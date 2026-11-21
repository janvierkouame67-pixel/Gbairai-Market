-- Gbairai Market : mise à jour 2 (promos, photos, avis, livraison, clients, paiements,
-- bannières, signalements, liste noire). À coller une fois dans Supabase > SQL Editor > Run.
-- Sans danger si on la relance.

-- 1. Produits : promos, ventes flash, plusieurs photos
alter table public.products add column if not exists prix_barre int check (prix_barre is null or prix_barre >= 0);
alter table public.products add column if not exists promo_fin timestamptz;
alter table public.products add column if not exists photos text[] not null default '{}';

-- 2. Boutiques : logo, fin des abonnements
alter table public.shops add column if not exists logo text;
alter table public.shops add column if not exists pro_fin date;
alter table public.shops add column if not exists vedette_fin date;

-- 3. Paramètres : prix, numéros Mobile Money, support
alter table public.settings add column if not exists prix_banniere text default '';
alter table public.settings add column if not exists support_whatsapp text default '';
alter table public.settings add column if not exists paiement jsonb not null default '{"orange":"","mtn":"","moov":"","wave":""}';

-- 4. Commandes : suivi de livraison et client
alter table public.orders add column if not exists livraison text not null default 'attente';
alter table public.orders drop constraint if exists orders_livraison_check;
alter table public.orders add constraint orders_livraison_check check (livraison in ('attente','preparation','en_route','livree'));
alter table public.orders add column if not exists client_nom text not null default '';
alter table public.orders add column if not exists client_tel text not null default '';
alter table public.orders add column if not exists client_adresse text not null default '';
drop policy if exists "orders: création publique" on public.orders;
create policy "orders: création publique" on public.orders for insert
  with check (statut = 'envoyee' and livraison = 'attente' and length(client_nom) <= 80 and length(client_tel) <= 30 and length(client_adresse) <= 200);

-- Suivi d'une commande par le client (avec le numéro de commande seulement)
create or replace function public.suivi_commande(oid uuid)
returns table (statut text, livraison text, total int, items jsonb, created_at timestamptz, boutique text, slug text, whatsapp text)
language sql stable security definer set search_path = public as $$
  select o.statut, o.livraison, o.total, o.items, o.created_at, s.nom, s.slug, s.whatsapp
  from orders o join shops s on s.id = o.shop_id where o.id = oid;
$$;
grant execute on function public.suivi_commande(uuid) to anon, authenticated;

-- 5. Avis clients
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  nom text not null check (length(nom) between 1 and 60),
  note int not null check (note between 1 and 5),
  commentaire text not null default '' check (length(commentaire) <= 600),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists "avis: lecture" on public.reviews;
create policy "avis: lecture" on public.reviews for select using (visible or public.is_admin()
  or exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));
drop policy if exists "avis: dépôt" on public.reviews;
create policy "avis: dépôt" on public.reviews for insert with check (visible);
drop policy if exists "avis: admin" on public.reviews;
create policy "avis: admin" on public.reviews for update using (public.is_admin());
drop policy if exists "avis: admin supprime" on public.reviews;
create policy "avis: admin supprime" on public.reviews for delete using (public.is_admin());

-- 6. Signalements
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete set null,
  motif text not null check (length(motif) between 1 and 80),
  details text not null default '' check (length(details) <= 1000),
  contact text not null default '' check (length(contact) <= 60),
  statut text not null default 'nouveau' check (statut in ('nouveau','traite')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "signalement: dépôt" on public.reports;
create policy "signalement: dépôt" on public.reports for insert with check (statut = 'nouveau');
drop policy if exists "signalement: admin" on public.reports;
create policy "signalement: admin" on public.reports for all using (public.is_admin()) with check (public.is_admin());

-- 7. Liste noire (numéros interdits)
create table if not exists public.blacklist (
  phone text primary key,
  motif text not null default '',
  created_at timestamptz not null default now()
);
alter table public.blacklist enable row level security;
drop policy if exists "liste noire: admin" on public.blacklist;
create policy "liste noire: admin" on public.blacklist for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.norm_phone(p text) returns text language sql immutable as $$
  select case when length(regexp_replace(coalesce(p,''),'\D','','g')) = 10
    then '225' || regexp_replace(p,'\D','','g') else regexp_replace(coalesce(p,''),'\D','','g') end;
$$;
create or replace function public.check_blacklist() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from blacklist b where b.phone = norm_phone(new.whatsapp))
     or exists (select 1 from blacklist b join profiles p on p.phone = b.phone where p.id = new.owner) then
    raise exception 'Ce numéro est bloqué sur la plateforme. Contactez le support.';
  end if;
  return new;
end; $$;
drop trigger if exists shops_blacklist on public.shops;
create trigger shops_blacklist before insert or update of whatsapp on public.shops
for each row execute function public.check_blacklist();

-- 8. Bannières publicitaires
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  titre text not null default '',
  sous_titre text not null default '',
  image text,
  lien text not null default '',
  couleur int not null default 0,
  shop_id uuid references public.shops(id) on delete set null,
  debut date not null default current_date,
  fin date,
  actif boolean not null default true,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.banners enable row level security;
drop policy if exists "bannières: lecture" on public.banners;
create policy "bannières: lecture" on public.banners for select using (
  (actif and debut <= current_date and (fin is null or fin >= current_date)) or public.is_admin());
drop policy if exists "bannières: admin" on public.banners;
create policy "bannières: admin" on public.banners for all using (public.is_admin()) with check (public.is_admin());

-- 9. Paiements (Pro, vedette, bannière) par Mobile Money
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  type text not null check (type in ('pro','vedette','banniere')),
  duree int not null default 1 check (duree between 1 and 12),
  montant int not null default 0 check (montant >= 0),
  operateur text not null check (operateur in ('orange','mtn','moov','wave')),
  telephone text not null default '' check (length(telephone) <= 30),
  reference text not null default '' check (length(reference) <= 80),
  statut text not null default 'attente' check (statut in ('attente','valide','refuse')),
  note_admin text not null default '',
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
drop policy if exists "paiements: lecture" on public.payments;
create policy "paiements: lecture" on public.payments for select using (
  public.is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));
drop policy if exists "paiements: déclaration" on public.payments;
create policy "paiements: déclaration" on public.payments for insert with check (
  statut = 'attente' and note_admin = '' and exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()));
drop policy if exists "paiements: admin" on public.payments;
create policy "paiements: admin" on public.payments for update using (public.is_admin());

-- Validation par l'admin : active automatiquement la formule
create or replace function public.valider_paiement(pid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p payments;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  select * into p from payments where id = pid for update;
  if p.id is null or p.statut <> 'attente' then raise exception 'Paiement introuvable ou déjà traité'; end if;
  update payments set statut = 'valide' where id = pid;
  if p.type = 'pro' then
    update shops set formule = 'pro',
      pro_fin = greatest(coalesce(pro_fin, current_date), current_date) + (p.duree * 30)
    where id = p.shop_id;
  elsif p.type = 'vedette' then
    update shops set vedette = true,
      vedette_fin = greatest(coalesce(vedette_fin, current_date), current_date) + (p.duree * 7)
    where id = p.shop_id;
  end if;
end; $$;
grant execute on function public.valider_paiement(uuid) to authenticated;

-- Fin automatique des abonnements expirés (appelée par le site)
create or replace function public.expirer_abonnements() returns void
language sql security definer set search_path = public as $$
  update shops set formule = 'gratuit' where formule = 'pro' and pro_fin is not null and pro_fin < current_date;
  update shops set vedette = false where vedette and vedette_fin is not null and vedette_fin < current_date;
$$;
grant execute on function public.expirer_abonnements() to anon, authenticated;

-- Les vendeurs ne peuvent pas changer eux-mêmes leurs dates d'abonnement
create or replace function public.protect_shop_admin_fields() returns trigger
language plpgsql as $$
begin
  if not public.is_admin() and current_user not in ('postgres','supabase_admin') then
    if tg_op = 'INSERT' then
      new.verification := 'attente'; new.statut := 'actif'; new.formule := 'gratuit';
      new.vedette := false; new.motif_refus := ''; new.pro_fin := null; new.vedette_fin := null;
    else
      new.verification := old.verification; new.statut := old.statut; new.formule := old.formule;
      new.vedette := old.vedette; new.motif_refus := old.motif_refus;
      new.owner := old.owner; new.pro_fin := old.pro_fin; new.vedette_fin := old.vedette_fin;
    end if;
  end if;
  return new;
end; $$;

-- Accès de l'API aux nouvelles tables (les règles ci-dessus protègent)
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
