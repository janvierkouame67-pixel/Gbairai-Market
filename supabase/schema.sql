-- Gbairai Market : schéma de la base Supabase
-- À coller une seule fois dans Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

-- Profils (un par compte). role = 'vendeur' ou 'admin'
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  role text not null default 'vendeur' check (role in ('vendeur','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Crée le profil automatiquement à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Paramètres de la plateforme (une seule ligne, id = 1)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  nom text not null default 'Gbairai Market',
  limite_gratuit int not null default 20,
  prix_pro text default '',
  prix_vedette text default '',
  quartiers text[] not null default array['Cocody','Yopougon','Plateau','Adjamé','Marcory','Abobo','Koumassi','Treichville','Port-Bouët','Bingerville'],
  categories jsonb not null default '[{"id":"mode","nom":"Mode"},{"id":"beaute","nom":"Beauté"},{"id":"tel","nom":"Téléphones"},{"id":"chaussures","nom":"Chaussures"},{"id":"maison","nom":"Maison"}]'
);
insert into public.settings (id) values (1) on conflict do nothing;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  nom text not null,
  gerant text default '', categorie text default 'mode', description text default '',
  whatsapp text not null, telegram text default '', telephone text default '', email text default '',
  facebook text default '', tiktok text default '',
  ville text default 'Abidjan', quartier text default '', adresse text default '',
  livraison_zones text default '', livraison_frais text default '',
  verification text not null default 'attente' check (verification in ('attente','verifie','refuse')),
  motif_refus text default '',
  statut text not null default 'actif' check (statut in ('actif','suspendu')),
  formule text not null default 'gratuit' check (formule in ('gratuit','pro')),
  vedette boolean not null default false,
  couleur int not null default 0,
  created_at timestamptz not null default now()
);

-- Données privées d'une boutique (jamais visibles du public)
create table if not exists public.shop_private (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  cni text default '',        -- numéro de pièce d'identité (vendeur et admin)
  notes text default ''       -- notes internes (admin seulement)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  nom text not null, description text default '',
  prix int not null check (prix >= 0),
  categorie text default 'mode', tailles text default '',
  stock int not null default 0 check (stock >= 0),
  visible boolean not null default true,
  photo text,                        -- URL dans le stockage « photos »
  couleur int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  canal text not null default 'whatsapp' check (canal in ('whatsapp','telegram')),
  statut text not null default 'envoyee' check (statut in ('envoyee','confirmee','annulee')),
  items jsonb not null,
  total int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.txs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  type text not null check (type in ('recette','depense')),
  montant int not null check (montant > 0),
  libelle text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Le vendeur ne peut pas changer lui-même les champs réservés à l'admin
create or replace function public.protect_shop_admin_fields() returns trigger
language plpgsql as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.verification := 'attente'; new.statut := 'actif'; new.formule := 'gratuit';
      new.vedette := false; new.motif_refus := '';
    else
      new.verification := old.verification; new.statut := old.statut; new.formule := old.formule;
      new.vedette := old.vedette; new.motif_refus := old.motif_refus;
      new.owner := old.owner;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists shops_protect on public.shops;
create trigger shops_protect before insert or update on public.shops
for each row execute function public.protect_shop_admin_fields();

-- Limite de produits pour la formule gratuite
create or replace function public.check_product_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare f text; n int; lim int;
begin
  select formule into f from shops where id = new.shop_id;
  select limite_gratuit into lim from settings where id = 1;
  select count(*) into n from products where shop_id = new.shop_id;
  if f = 'gratuit' and n >= lim then
    raise exception 'Limite gratuite atteinte (% produits)', lim;
  end if;
  return new;
end; $$;
drop trigger if exists products_limit on public.products;
create trigger products_limit before insert on public.products
for each row execute function public.check_product_limit();

create or replace function public.protect_private_notes() returns trigger
language plpgsql as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then new.notes := ''; else new.notes := old.notes; end if;
  end if;
  return new;
end; $$;
drop trigger if exists shop_private_protect on public.shop_private;
create trigger shop_private_protect before insert or update on public.shop_private
for each row execute function public.protect_private_notes();

-- Sécurité (RLS)
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.shop_private enable row level security;
alter table public.orders enable row level security;
alter table public.txs enable row level security;

drop policy if exists "profil: soi ou admin" on public.profiles;
create policy "profil: soi ou admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profil: admin modifie" on public.profiles;
create policy "profil: admin modifie" on public.profiles for update using (public.is_admin());

drop policy if exists "settings: lecture" on public.settings;
create policy "settings: lecture" on public.settings for select using (true);
drop policy if exists "settings: admin" on public.settings;
create policy "settings: admin" on public.settings for update using (public.is_admin());

drop policy if exists "shops: lecture publique" on public.shops;
create policy "shops: lecture publique" on public.shops for select using (statut = 'actif' or owner = auth.uid() or public.is_admin());
drop policy if exists "shops: création" on public.shops;
create policy "shops: création" on public.shops for insert with check (owner = auth.uid());
drop policy if exists "shops: modif" on public.shops;
create policy "shops: modif" on public.shops for update using (owner = auth.uid() or public.is_admin());
drop policy if exists "shops: suppression admin" on public.shops;
create policy "shops: suppression admin" on public.shops for delete using (public.is_admin());

drop policy if exists "privé: vendeur ou admin" on public.shop_private;
create policy "privé: vendeur ou admin" on public.shop_private for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin())
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin());

drop policy if exists "products: lecture" on public.products;
create policy "products: lecture" on public.products for select using (
  (visible and exists (select 1 from shops s where s.id = shop_id and s.statut = 'actif'))
  or exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid())
  or public.is_admin());
drop policy if exists "products: vendeur" on public.products;
create policy "products: vendeur" on public.products for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin())
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin());

-- Commandes : tout le monde peut en créer une (clic « Commander »), seuls vendeur et admin les voient
drop policy if exists "orders: création publique" on public.orders;
create policy "orders: création publique" on public.orders for insert with check (statut = 'envoyee');
drop policy if exists "orders: lecture" on public.orders;
create policy "orders: lecture" on public.orders for select using (
  exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin());
drop policy if exists "orders: modif" on public.orders;
create policy "orders: modif" on public.orders for update using (
  exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin());

drop policy if exists "txs: vendeur" on public.txs;
create policy "txs: vendeur" on public.txs for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin())
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or public.is_admin());

-- Photos des produits (lecture publique, écriture par les comptes connectés dans leur dossier)
insert into storage.buckets (id, name, public) values ('photos','photos',true) on conflict (id) do nothing;
drop policy if exists "photos: lecture" on storage.objects;
create policy "photos: lecture" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos: envoi" on storage.objects;
create policy "photos: envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos: suppression" on storage.objects;
create policy "photos: suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Pour devenir administrateur : après avoir créé votre compte dans l'appli,
-- remplacez le numéro puis lancez :
-- update public.profiles set role = 'admin' where phone = '2250700000000';

-- Accès de l'API (les nouveaux projets Supabase ne le donnent plus automatiquement).
-- Les règles RLS ci-dessus restent la vraie protection.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- Logo de la boutique (ajout du 21/11/2026)
alter table public.shops add column if not exists logo text;


-- ===== Mise à jour 2 (incluse) =====

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

-- ===== Mise à jour 3 (incluse) =====
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

-- ===== Mise à jour 4 (incluse) =====

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

-- ===== Mise à jour 5 (incluse) =====

-- 1. Clé publique des notifications (la clé privée reste dans Vercel)
alter table public.settings add column if not exists vapid_public text not null default '';

-- 2. Téléphones abonnés aux notifications (personne ne lit cette table directement)
create table if not exists public.push_subs (
  endpoint text primary key check (endpoint ~ '^https://' and length(endpoint) <= 800),
  p256dh text not null check (length(p256dh) <= 200),
  auth text not null check (length(auth) <= 100),
  shops uuid[] not null default '{}',
  orders uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);
create index if not exists push_subs_shops on public.push_subs using gin (shops);
create index if not exists push_subs_orders on public.push_subs using gin (orders);
alter table public.push_subs enable row level security;  -- aucune règle : accès seulement par les fonctions

create or replace function public.push_save(ep text, k text, a text, sh uuid[], ord uuid[]) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if ep !~ '^https://' or length(ep) > 800 or coalesce(k,'') = '' or coalesce(a,'') = '' then return false; end if;
  insert into push_subs(endpoint, p256dh, auth, shops, orders, updated_at)
  values (ep, k, a, coalesce(sh[1:200], '{}'), coalesce(ord[1:50], '{}'), now())
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth,
    shops = excluded.shops, orders = excluded.orders, updated_at = now();
  return true;
end; $$;

create or replace function public.push_remove(ep text) returns void
language sql security definer set search_path = public as $$ delete from push_subs where endpoint = ep; $$;

-- Nombre d'abonnés d'une boutique (public)
create or replace function public.nb_abonnes(sid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from push_subs where shops @> array[sid];
$$;

-- Limite : 5 notifications « nouveautés » par boutique et par jour
create table if not exists public.push_log (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.push_log enable row level security;

-- 3. Compte client : ses favoris, boutiques suivies et commandes, sur tous ses téléphones
create table if not exists public.client_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nom text not null default '' check (length(nom) <= 80),
  favs jsonb not null default '[]',
  follows jsonb not null default '[]',
  orders jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  check (pg_column_size(favs) + pg_column_size(follows) + pg_column_size(orders) < 60000)
);
alter table public.client_data enable row level security;
drop policy if exists "client: lecture" on public.client_data;
create policy "client: lecture" on public.client_data for select using (user_id = auth.uid());
drop policy if exists "client: création" on public.client_data;
create policy "client: création" on public.client_data for insert with check (user_id = auth.uid());
drop policy if exists "client: modification" on public.client_data;
create policy "client: modification" on public.client_data for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Accès de l'API
revoke all on public.push_subs, public.push_log from anon, authenticated;
grant select, insert, update on public.client_data to authenticated;
grant execute on function public.push_save(text,text,text,uuid[],uuid[]), public.push_remove(text), public.nb_abonnes(uuid) to anon, authenticated;
