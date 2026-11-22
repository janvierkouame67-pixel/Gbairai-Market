-- Gbairai Market : mise à jour 14 (statistiques du site et suivi des connexions).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- 1) Journal des visites, recherches, clics et connexions (gardé 90 jours)
--    Rempli seulement par le serveur (api/stat). Personne ne peut le lire directement.
create table if not exists public.stats (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('page','recherche','wa','tg','panier','commande','connexion','echec','resume')),
  visiteur text not null default '' check (length(visiteur) <= 40),
  shop_id uuid,
  product_id uuid,
  user_id uuid,
  role text not null default '' check (role in ('','vendeur','client','admin')),
  q text not null default '' check (length(q) <= 80),
  n int,
  appareil text not null default '' check (length(appareil) <= 40),
  ville text not null default '' check (length(ville) <= 60)
);
create index if not exists stats_temps on public.stats (created_at);
create index if not exists stats_kind_temps on public.stats (kind, created_at);
alter table public.stats enable row level security;  -- aucune règle : accès seulement par le serveur et les fonctions
grant all on public.stats to service_role;
grant usage, select on sequence public.stats_id_seq to service_role;

-- 2) Notifications : reconnaître le téléphone de l'administrateur (pour le résumé du lundi)
alter table public.push_subs add column if not exists admin boolean not null default false;
create or replace function public.push_admin(ep text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then return false; end if;
  update push_subs set admin = true where endpoint = ep;
  return found;
end; $$;
grant execute on function public.push_admin(text) to authenticated;

-- 3) Statistiques pour l'onglet Admin (réservé à l'administrateur)
create or replace function public.stats_admin(jours int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d0 timestamptz; p0 timestamptz; r jsonb; nj int;
begin
  if not public.is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  delete from stats where created_at < now() - interval '90 days';
  nj := least(greatest(coalesce(jours, 90), 1), 90);
  d0 := case when nj = 1 then date_trunc('day', now() at time zone 'Africa/Abidjan') at time zone 'Africa/Abidjan' else now() - make_interval(days => nj) end;
  p0 := d0 - (now() - d0);
  with e as (select * from stats where created_at >= d0)
  select jsonb_build_object(
    'visiteurs', (select count(distinct visiteur) from e where kind = 'page' and visiteur <> ''),
    'visiteurs_avant', (select count(distinct visiteur) from stats where kind = 'page' and visiteur <> '' and created_at >= p0 and created_at < d0),
    'pages', (select count(*) from e where kind = 'page'),
    'cx_vendeurs', (select count(*) from e where kind = 'connexion' and role = 'vendeur'),
    'cx_vendeurs_diff', (select count(distinct user_id) from e where kind = 'connexion' and role = 'vendeur'),
    'cx_clients', (select count(*) from e where kind = 'connexion' and role = 'client'),
    'cx_clients_diff', (select count(distinct user_id) from e where kind = 'connexion' and role = 'client'),
    'commandeurs', (select count(distinct visiteur) from e where kind = 'commande' and visiteur <> ''),
    'en_ligne', (select count(distinct visiteur) from stats where kind = 'page' and visiteur <> '' and created_at > now() - interval '5 minutes'),
    'par_jour', (select coalesce(jsonb_agg(jsonb_build_object('j', j, 'v', v, 'c', c) order by j), '[]') from (
        select (created_at at time zone 'Africa/Abidjan')::date as j,
               count(distinct visiteur) filter (where kind = 'page') as v,
               count(distinct visiteur) filter (where kind = 'commande') as c
        from stats where created_at >= greatest(d0, now() - interval '30 days') and visiteur <> '' group by 1) x),
    'par_heure', (select coalesce(jsonb_agg(jsonb_build_object('h', h, 'n', n)), '[]') from (
        select extract(hour from created_at at time zone 'Africa/Abidjan')::int as h, count(*) as n from e where kind = 'page' group by 1) x),
    'boutiques', (select coalesce(jsonb_agg(jsonb_build_object('id', shop_id, 'v', v, 'wa', wa, 'tg', tg) order by v desc, wa desc), '[]') from (
        select shop_id, count(distinct visiteur) filter (where kind = 'page') as v,
               count(*) filter (where kind = 'wa') as wa, count(*) filter (where kind = 'tg') as tg
        from e where shop_id is not null and kind in ('page','wa','tg') group by shop_id order by 2 desc, 3 desc limit 60) x),
    'villes', (select coalesce(jsonb_agg(jsonb_build_object('ville', ville, 'n', n) order by n desc), '[]') from (
        select ville, count(distinct visiteur) as n from e where kind = 'page' and ville <> '' group by ville order by 2 desc limit 6) x),
    'appareils', (select coalesce(jsonb_agg(jsonb_build_object('a', a, 'n', n)), '[]') from (
        select case when appareil ~* '^(android|iphone|ipad)' then 'tel' else 'pc' end as a, count(distinct visiteur) as n
        from e where kind = 'page' and appareil <> '' group by 1) x),
    'recherches', (select coalesce(jsonb_agg(jsonb_build_object('q', q, 'n', n, 'vide', vide) order by n desc), '[]') from (
        select lower(q) as q, count(distinct visiteur) as n, bool_and(coalesce(n, 0) = 0) as vide
        from e where kind = 'recherche' and q <> '' group by lower(q) order by 2 desc limit 40) x),
    'paniers', (select count(distinct visiteur) from e where kind = 'panier' and visiteur <> ''),
    'paniers_abandon', (select count(distinct visiteur) from e a where kind = 'panier' and visiteur <> ''
        and not exists (select 1 from e b where b.kind = 'commande' and b.visiteur = a.visiteur)),
    'abandon_produits', (select coalesce(jsonb_agg(jsonb_build_object('id', product_id, 'n', n) order by n desc), '[]') from (
        select product_id, count(distinct visiteur) as n from e a where kind = 'panier' and product_id is not null
          and not exists (select 1 from e b where b.kind = 'commande' and b.visiteur = a.visiteur)
        group by product_id order by 2 desc limit 5) x),
    'produits_vus', (select coalesce(jsonb_agg(jsonb_build_object('id', product_id, 'v', v, 'p', p) order by v desc), '[]') from (
        select product_id, count(distinct visiteur) filter (where kind = 'page') as v, count(distinct visiteur) filter (where kind = 'panier') as p
        from e where product_id is not null and kind in ('page','panier') group by product_id order by 2 desc limit 40) x),
    'connexions', (select coalesce(jsonb_agg(c order by (c->>'t') desc), '[]') from (
        select jsonb_build_object('t', s.created_at, 'k', s.kind, 'role', coalesce(nullif(s.role, ''), case when p.role = 'admin' then 'admin' when sh.id is not null then 'vendeur' when p.id is not null then 'client' else '' end),
          'uid', coalesce(s.user_id, p.id), 'nom', coalesce(cd.nom, ''), 'tel', coalesce(p.phone, s.q), 'shop', sh.id, 'app', s.appareil, 'ville', s.ville) as c
        from (select * from e where kind in ('connexion','echec') order by created_at desc limit 300) s
        left join profiles p on p.id = s.user_id or (s.user_id is null and s.q <> '' and p.phone = s.q)
        left join client_data cd on cd.user_id = coalesce(s.user_id, p.id)
        left join lateral (select id from shops where owner = coalesce(s.user_id, p.id) limit 1) sh on true) z),
    'alertes', (select coalesce(jsonb_agg(jsonb_build_object('tel', q, 'n', n, 't', t) order by t desc), '[]') from (
        select q, count(*) as n, max(created_at) as t from stats
        where kind = 'echec' and q <> '' and created_at > now() - interval '24 hours'
        group by q having count(*) >= 5) x)
  ) into r;
  return r;
end; $$;
revoke all on function public.stats_admin(int) from public, anon;
grant execute on function public.stats_admin(int) to authenticated;

-- 4) Résumé de la semaine (appelé chaque lundi par le serveur seulement)
create or replace function public.stats_resume() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'visiteurs', (select count(distinct visiteur) from stats where kind = 'page' and visiteur <> '' and created_at > now() - interval '7 days'),
    'commandes', (select count(*) from orders where created_at > now() - interval '7 days'),
    'confirmees', (select count(*) from orders where statut = 'confirmee' and created_at > now() - interval '7 days'),
    'boutiques', (select count(*) from shops where created_at > now() - interval '7 days'),
    'endormis', (select count(*) from shops where statut = 'actif' and coalesce(vu_le, created_at) < now() - interval '7 days'),
    'recherche_vide', (select lower(q) from stats where kind = 'recherche' and q <> '' and coalesce(n, 0) = 0 and created_at > now() - interval '7 days'
                       group by lower(q) order by count(distinct visiteur) desc limit 1),
    'deja', exists (select 1 from stats where kind = 'resume' and created_at > now() - interval '6 days'));
$$;
revoke all on function public.stats_resume() from public, anon, authenticated;
grant execute on function public.stats_resume() to service_role;
