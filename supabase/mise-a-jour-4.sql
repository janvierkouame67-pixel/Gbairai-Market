-- Gbairai Market : mise à jour 4 (rayons en photos et types d'articles).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- 1. Chaque produit peut avoir un type précis (ex. « Robes », « Baskets », « Smartphones »)
alter table public.products add column if not exists type text not null default '';
alter table public.products drop constraint if exists products_type_check;
alter table public.products add constraint products_type_check check (length(type) <= 40);

-- 2. Les rayons de base (les noms, photos et types sont fournis par le site).
--    On garde les photos et types déjà ajoutés par l'admin, et les rayons créés à la main.
update public.settings set categories = (
  with base(id, nom, ord) as (values
    ('mode','Mode femme',1),('mode_homme','Mode homme',2),('chaussures','Chaussures',3),('sacs','Sacs',4),
    ('bijoux','Bijoux',5),('montres','Montres & accessoires',6),('beaute','Beauté & parfums',7),('tel','Téléphones',8),
    ('electronique','Électronique',9),('maison','Maison & déco',10),('enfants','Enfants & bébé',11),('sport','Sport',12),('autre','Autres',99)),
  cur as (select e, e->>'id' id, ord from jsonb_array_elements(coalesce(categories,'[]'::jsonb)) with ordinality t(e, ord))
  select coalesce(jsonb_agg(x order by o), '[]'::jsonb) from (
    select coalesce(c.e, '{}'::jsonb) || jsonb_build_object('id', b.id, 'nom', b.nom) x, b.ord o
      from base b left join cur c on c.id = b.id
    union all
    select c.e, 50 + c.ord from cur c where c.id not in (select id from base)
  ) z
) where id = 1;
alter table public.settings alter column categories set default
  '[{"id":"mode","nom":"Mode femme"},{"id":"mode_homme","nom":"Mode homme"},{"id":"chaussures","nom":"Chaussures"},{"id":"sacs","nom":"Sacs"},{"id":"bijoux","nom":"Bijoux"},{"id":"montres","nom":"Montres & accessoires"},{"id":"beaute","nom":"Beauté & parfums"},{"id":"tel","nom":"Téléphones"},{"id":"electronique","nom":"Électronique"},{"id":"maison","nom":"Maison & déco"},{"id":"enfants","nom":"Enfants & bébé"},{"id":"sport","nom":"Sport"},{"id":"autre","nom":"Autres"}]';
