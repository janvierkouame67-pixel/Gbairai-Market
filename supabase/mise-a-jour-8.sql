-- Gbairai Market : mise à jour 8 (reçus, relevés clients, points de vente, commerciaux).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- 1. Commandes : numéro de reçu, mode de paiement (ou crédit), point de vente, commercial
alter table public.orders add column if not exists recu_num int;
alter table public.orders add column if not exists paye_mode text not null default '' check (paye_mode in ('','especes','wave','orange','mtn','moov','credit'));
alter table public.orders add column if not exists point_id uuid;
alter table public.orders add column if not exists commercial_code text not null default '' check (length(commercial_code) <= 20);

drop policy if exists "orders: création publique" on public.orders;
create policy "orders: création publique" on public.orders for insert
  with check (statut = 'envoyee' and livraison = 'attente' and livree_code = false and hist = '{}'::jsonb
    and livreur_nom = '' and livreur_tel = '' and eta = '' and recu_num is null and paye_mode = '' and point_id is null
    and length(client_nom) <= 80 and length(client_tel) <= 30 and length(client_adresse) <= 200
    and not public.est_bloque(client_tel));

-- Numéro de reçu donné automatiquement quand la vente est confirmée (1, 2, 3… par boutique)
create or replace function public.orders_recu() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.recu_num is distinct from old.recu_num and current_user not in ('postgres','supabase_admin') then new.recu_num := old.recu_num; end if;
    if new.commercial_code is distinct from old.commercial_code and current_user not in ('postgres','supabase_admin') then new.commercial_code := old.commercial_code; end if;
  end if;
  if new.statut = 'confirmee' and new.recu_num is null then
    perform pg_advisory_xact_lock(hashtext(new.shop_id::text));
    select coalesce(max(recu_num), 0) + 1 into new.recu_num from orders where shop_id = new.shop_id;
  end if;
  return new;
end; $$;
drop trigger if exists orders_recu on public.orders;
create trigger orders_recu before insert or update on public.orders for each row execute function public.orders_recu();

-- 2. Versements des clients (ventes à crédit)
create table if not exists public.versements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  client_tel text not null check (length(client_tel) between 8 and 30),
  montant int not null check (montant > 0),
  mode text not null default 'especes' check (mode in ('especes','wave','orange','mtn','moov')),
  note text not null default '' check (length(note) <= 120),
  date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.versements enable row level security;
drop policy if exists "versements: vendeur" on public.versements;
create policy "versements: vendeur" on public.versements for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));

-- 3. Points de vente
create table if not exists public.points_vente (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  nom text not null check (length(nom) between 1 and 60),
  adresse text not null default '' check (length(adresse) <= 160),
  horaires text not null default '' check (length(horaires) <= 60),
  responsable text not null default '' check (length(responsable) <= 60),
  tel text not null default '' check (length(tel) <= 30),
  principal boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.points_vente enable row level security;
drop policy if exists "points: lecture" on public.points_vente;
create policy "points: lecture" on public.points_vente for select using (
  exists (select 1 from shops s where s.id = shop_id and (s.statut = 'actif' or s.owner = auth.uid() or public.is_admin())));
drop policy if exists "points: vendeur" on public.points_vente;
create policy "points: vendeur" on public.points_vente for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));

-- 4. Commerciaux : un code pour leur lien de vente, une commission, un lien secret vers leur espace
create table if not exists public.commerciaux (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  nom text not null check (length(nom) between 1 and 60),
  tel text not null default '' check (length(tel) <= 30),
  code text not null check (code ~ '^[A-Z0-9]{2,20}$'),
  commission numeric(4,1) not null default 10 check (commission >= 0 and commission <= 50),
  actif boolean not null default true,
  secret uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (shop_id, code)
);
alter table public.commerciaux enable row level security;
drop policy if exists "commerciaux: vendeur" on public.commerciaux;
create policy "commerciaux: vendeur" on public.commerciaux for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));

-- Reçu public : visible avec le lien (le numéro de commande complet est secret)
create or replace function public.recu_public(oid uuid)
returns table (boutique text, slug text, whatsapp text, ville text, quartier text, logo text, recu_num int, created_at timestamptz,
  items jsonb, total int, statut text, livraison text, livree_code boolean, paye_mode text, client_nom text, point text)
language sql stable security definer set search_path = public as $$
  select s.nom, s.slug, s.whatsapp, s.ville, s.quartier, s.logo, o.recu_num, o.created_at, o.items, o.total, o.statut,
         o.livraison, o.livree_code, o.paye_mode, o.client_nom, p.nom
  from orders o join shops s on s.id = o.shop_id left join points_vente p on p.id = o.point_id
  where o.id = oid and o.recu_num is not null;
$$;

-- Espace du commercial (avec son lien secret, sans compte)
create or replace function public.espace_commercial(sec uuid)
returns table (nom text, code text, commission numeric, boutique text, slug text, ventes jsonb)
language sql stable security definer set search_path = public as $$
  select c.nom, c.code, c.commission, s.nom, s.slug,
    coalesce((select jsonb_agg(jsonb_build_object('id', left(o.id::text, 8), 'date', o.created_at, 'client', split_part(o.client_nom, ' ', 1),
      'total', o.total, 'statut', o.statut, 'livraison', o.livraison, 'code', o.livree_code) order by o.created_at desc)
      from orders o where o.shop_id = c.shop_id and o.commercial_code = c.code and o.created_at > now() - interval '120 days'), '[]'::jsonb)
  from commerciaux c join shops s on s.id = c.shop_id where c.secret = sec and c.actif;
$$;

revoke all on public.versements, public.points_vente, public.commerciaux from anon;
grant select, insert, update, delete on public.versements, public.points_vente, public.commerciaux to authenticated;
grant select on public.points_vente to anon;
grant execute on function public.recu_public(uuid), public.espace_commercial(uuid) to anon, authenticated;
