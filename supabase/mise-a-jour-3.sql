-- Gbairai Market : mise à jour 3 (suivi des commandes avec code secret, livreur,
-- confiance des boutiques, vérification des numéros, fiabilité des clients).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- 1. Commandes : livreur, heure prévue, historique des étapes, livraison confirmée par code
alter table public.orders add column if not exists livreur_nom text not null default '' check (length(livreur_nom) <= 60);
alter table public.orders add column if not exists livreur_tel text not null default '' check (length(livreur_tel) <= 30);
alter table public.orders add column if not exists eta text not null default '' check (length(eta) <= 60);
alter table public.orders add column if not exists hist jsonb not null default '{}';
alter table public.orders add column if not exists livree_code boolean not null default false;
alter table public.orders drop constraint if exists orders_livraison_check;
alter table public.orders add constraint orders_livraison_check check (livraison in ('attente','preparation','en_route','livree','echec'));

-- Numéro bloqué ? (utilisable partout, sans montrer la liste noire)
create or replace function public.est_bloque(tel text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(tel,'') <> '' and exists (select 1 from blacklist where phone = norm_phone(tel));
$$;

-- Les numéros bloqués ne peuvent plus commander
drop policy if exists "orders: création publique" on public.orders;
create policy "orders: création publique" on public.orders for insert
  with check (statut = 'envoyee' and livraison = 'attente' and livree_code = false and hist = '{}'::jsonb
    and livreur_nom = '' and livreur_tel = '' and eta = ''
    and length(client_nom) <= 80 and length(client_tel) <= 30 and length(client_adresse) <= 200
    and not public.est_bloque(client_tel));

-- Historique automatique + seul le code du client peut confirmer une livraison
create or replace function public.orders_suivi() returns trigger
language plpgsql as $$
begin
  if current_user not in ('postgres','supabase_admin') then
    new.livree_code := old.livree_code;
    new.hist := old.hist;
  end if;
  if new.statut is distinct from old.statut then
    new.hist := new.hist || jsonb_build_object(new.statut, now());
  end if;
  if new.livraison is distinct from old.livraison then
    new.hist := new.hist || jsonb_build_object(new.livraison, now());
    if new.livraison <> 'livree' then new.livree_code := false; end if;
  end if;
  return new;
end; $$;
drop trigger if exists orders_suivi on public.orders;
create trigger orders_suivi before update on public.orders for each row execute function public.orders_suivi();

-- 2. Codes secrets de livraison (jamais lisibles par le vendeur)
create table if not exists public.order_codes (
  order_id uuid primary key references public.orders(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{4}$'),
  essais int not null default 0
);
alter table public.order_codes enable row level security;  -- aucune règle : personne ne lit la table

create or replace function public.creer_code(oid uuid, c text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if c !~ '^[0-9]{4}$' then return false; end if;
  if not exists (select 1 from orders where id = oid and created_at > now() - interval '30 minutes') then return false; end if;
  insert into order_codes(order_id, code) values (oid, c) on conflict do nothing;
  return found;
end; $$;

create or replace function public.confirmer_livraison(oid uuid, c text) returns text
language plpgsql security definer set search_path = public as $$
declare o orders; k order_codes;
begin
  select * into o from orders where id = oid;
  if o.id is null then return 'introuvable'; end if;
  if not (is_admin() or exists (select 1 from shops where id = o.shop_id and owner = auth.uid())) then return 'interdit'; end if;
  select * into k from order_codes where order_id = oid for update;
  if k.order_id is null then return 'aucun'; end if;
  if k.essais >= 5 then return 'bloque'; end if;
  if k.code <> c then update order_codes set essais = essais + 1 where order_id = oid; return 'faux'; end if;
  update orders set livraison = 'livree', livree_code = true, statut = 'confirmee' where id = oid;
  return 'ok';
end; $$;

-- 3. Suivi pour le client (plusieurs commandes d'un coup)
drop function if exists public.suivi_commande(uuid);
drop function if exists public.suivi_commandes(uuid[]);
create or replace function public.suivi_commandes(ids uuid[])
returns table (id uuid, statut text, livraison text, total int, items jsonb, created_at timestamptz,
  boutique text, slug text, whatsapp text, livreur_nom text, livreur_tel text, eta text, hist jsonb, livree_code boolean, a_code boolean)
language sql stable security definer set search_path = public as $$
  select o.id, o.statut, o.livraison, o.total, o.items, o.created_at, s.nom, s.slug, s.whatsapp,
         o.livreur_nom, o.livreur_tel, o.eta, o.hist, o.livree_code,
         exists (select 1 from order_codes k where k.order_id = o.id)
  from orders o join shops s on s.id = o.shop_id where o.id = any(ids[1:50]);
$$;
create or replace function public.suivi_commande(oid uuid)
returns table (statut text, livraison text, total int, items jsonb, created_at timestamptz,
  boutique text, slug text, whatsapp text, livreur_nom text, livreur_tel text, eta text, hist jsonb, livree_code boolean, a_code boolean)
language sql stable security definer set search_path = public as $$
  select statut, livraison, total, items, created_at, boutique, slug, whatsapp, livreur_nom, livreur_tel, eta, hist, livree_code, a_code
  from suivi_commandes(array[oid]);
$$;
-- Retrouver une commande avec son numéro (8 caractères) + le téléphone du client
create or replace function public.suivi_par_numero(num text, tel text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from orders where length(num) = 8 and upper(left(id::text, 8)) = upper(num)
    and norm_phone(client_tel) = norm_phone(tel) and norm_phone(tel) <> '' limit 1;
$$;

-- 4. Signalements : l'admin peut confirmer qu'un signalement est fondé
alter table public.reports drop constraint if exists reports_statut_check;
alter table public.reports add constraint reports_statut_check check (statut in ('nouveau','traite','confirme'));

-- Signalement d'un client par un vendeur
create table if not exists public.client_reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  client_tel text not null check (length(client_tel) between 8 and 30),
  motif text not null check (length(motif) between 1 and 80),
  details text not null default '' check (length(details) <= 600),
  statut text not null default 'nouveau' check (statut in ('nouveau','confirme','rejete')),
  created_at timestamptz not null default now()
);
alter table public.client_reports enable row level security;
drop policy if exists "signalement client: lecture" on public.client_reports;
create policy "signalement client: lecture" on public.client_reports for select using (
  public.is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));
drop policy if exists "signalement client: dépôt" on public.client_reports;
create policy "signalement client: dépôt" on public.client_reports for insert with check (
  statut = 'nouveau' and exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));
drop policy if exists "signalement client: admin" on public.client_reports;
create policy "signalement client: admin" on public.client_reports for update using (public.is_admin());
drop policy if exists "signalement client: admin supprime" on public.client_reports;
create policy "signalement client: admin supprime" on public.client_reports for delete using (public.is_admin());

-- 5. Boutiques : paiement à la livraison accepté
alter table public.shops add column if not exists paiement_livraison boolean not null default true;

-- Chiffres publics pour l'indice de confiance
create or replace function public.stats_confiance()
returns table (shop_id uuid, livrees int, signalements int)
language sql stable security definer set search_path = public as $$
  select s.id,
    (select count(*)::int from orders o where o.shop_id = s.id and o.livree_code),
    (select count(*)::int from reports r where r.shop_id = s.id and r.statut = 'confirme')
  from shops s where s.statut = 'actif';
$$;

-- Vérifier un numéro avant de payer (public, sans données personnelles)
create or replace function public.verifier_numero(tel text)
returns table (bloque boolean, signalements int, boutique text, slug text, verifie boolean, depuis timestamptz)
language sql stable security definer set search_path = public as $$
  with n as (select norm_phone(tel) p), b as (
    select s.* from shops s, n where norm_phone(s.whatsapp) = n.p and s.statut = 'actif' order by s.created_at limit 1)
  select est_bloque(tel),
    (select count(*)::int from reports r join shops s on s.id = r.shop_id, n where r.statut = 'confirme' and norm_phone(s.whatsapp) = n.p)
    + (select count(*)::int from client_reports c, n where c.statut = 'confirme' and norm_phone(c.client_tel) = n.p),
    (select nom from b), (select slug from b), (select verification = 'verifie' from b), (select created_at from b)
  from n where length(n.p) >= 8;
$$;

-- Fiabilité d'un client (réservé aux vendeurs et à l'admin)
create or replace function public.fiabilite_client(tel text)
returns table (recues int, annulees int, echecs int, signalements int, bloque boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_admin() or exists (select 1 from shops where owner = auth.uid())) then return; end if;
  return query
  with o as (select * from orders where norm_phone(client_tel) = norm_phone(tel) and norm_phone(tel) <> '')
  select (select count(*)::int from o where livraison = 'livree'),
         (select count(*)::int from o where statut = 'annulee'),
         (select count(*)::int from o where livraison = 'echec'),
         (select count(*)::int from client_reports c where c.statut = 'confirme' and norm_phone(c.client_tel) = norm_phone(tel)),
         est_bloque(tel);
end; $$;

-- Accès de l'API (les règles ci-dessus protègent)
revoke all on public.order_codes from anon, authenticated;
grant select, insert, update, delete on public.client_reports to anon, authenticated;
grant execute on function public.est_bloque(text), public.creer_code(uuid,text), public.suivi_commandes(uuid[]),
  public.suivi_commande(uuid), public.suivi_par_numero(text,text), public.stats_confiance(), public.verifier_numero(text) to anon, authenticated;
grant execute on function public.confirmer_livraison(uuid,text), public.fiabilite_client(text) to authenticated;
revoke execute on function public.confirmer_livraison(uuid,text), public.fiabilite_client(text) from public, anon;
