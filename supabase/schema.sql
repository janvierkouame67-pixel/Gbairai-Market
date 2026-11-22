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

-- ===== Mise à jour 6 (incluse) =====

-- Dernière fois que le vendeur a ouvert son espace
alter table public.shops add column if not exists vu_le timestamptz;

-- Appelée par le site quand le vendeur est connecté (toutes les 2 minutes)
create or replace function public.je_suis_la() returns void
language sql security definer set search_path = public as $$
  update shops set vu_le = now() where owner = auth.uid() and (vu_le is null or vu_le < now() - interval '1 minute');
$$;
revoke execute on function public.je_suis_la() from public, anon;
grant execute on function public.je_suis_la() to authenticated;

-- ===== Mise à jour 7 (incluse) =====
-- Le client n'a pas besoin de compte : son téléphone garde une clé secrète (k) qui ouvre ses discussions.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  client_key uuid not null,
  client_nom text not null default '' check (length(client_nom) <= 80),
  client_tel text not null default '' check (length(client_tel) <= 30),
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  last_msg text not null default '',
  non_lus_vendeur int not null default 0,
  non_lus_client int not null default 0,
  signale boolean not null default false,
  motif text not null default '' check (length(motif) <= 200),
  unique (shop_id, client_key)
);
create index if not exists conversations_shop on public.conversations(shop_id, last_at desc);
create index if not exists conversations_key on public.conversations(client_key);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conv_id uuid not null references public.conversations(id) on delete cascade,
  de text not null check (de in ('client','vendeur')),
  texte text not null check (length(texte) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv on public.messages(conv_id, id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Le vendeur voit les discussions de sa boutique ; l'admin seulement celles signalées (litiges)
drop policy if exists "conv: lecture" on public.conversations;
create policy "conv: lecture" on public.conversations for select using (
  exists (select 1 from shops s where s.id = shop_id and s.owner = auth.uid()) or (signale and public.is_admin()));
drop policy if exists "msg: lecture" on public.messages;
create policy "msg: lecture" on public.messages for select using (exists (
  select 1 from conversations c join shops s on s.id = c.shop_id
  where c.id = conv_id and (s.owner = auth.uid() or (c.signale and public.is_admin()))));
drop policy if exists "msg: réponse vendeur" on public.messages;
create policy "msg: réponse vendeur" on public.messages for insert with check (de = 'vendeur' and exists (
  select 1 from conversations c join shops s on s.id = c.shop_id where c.id = conv_id and s.owner = auth.uid()));

-- L'admin peut clore un litige (la discussion redevient privée)
drop policy if exists "conv: admin clôt" on public.conversations;
create policy "conv: admin clôt" on public.conversations for update using (signale and public.is_admin()) with check (public.is_admin());

-- Chaque message met à jour la discussion (dernier message, non lus) ; 40 messages max par 10 minutes
create or replace function public.messages_apres() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from messages where conv_id = new.conv_id and created_at > now() - interval '10 minutes') > 40 then
    raise exception 'Trop de messages, patientez un peu.';
  end if;
  update conversations set last_at = now(), last_msg = left(new.texte, 120),
    non_lus_vendeur = non_lus_vendeur + (new.de = 'client')::int,
    non_lus_client = non_lus_client + (new.de = 'vendeur')::int
  where id = new.conv_id;
  return new;
end; $$;
drop trigger if exists messages_apres on public.messages;
create trigger messages_apres before insert on public.messages for each row execute function public.messages_apres();

-- Fonctions pour le client (avec sa clé secrète)
create or replace function public.conv_ouvrir(sid uuid, k uuid, nom text, tel text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if k is null or not exists (select 1 from shops where id = sid and statut = 'actif') then return null; end if;
  if public.est_bloque(tel) then return null; end if;
  insert into conversations(shop_id, client_key, client_nom, client_tel)
  values (sid, k, left(coalesce(nom,''), 80), left(coalesce(tel,''), 30))
  on conflict (shop_id, client_key) do update set
    client_nom = case when excluded.client_nom <> '' then excluded.client_nom else conversations.client_nom end,
    client_tel = case when excluded.client_tel <> '' then excluded.client_tel else conversations.client_tel end
  returning id into cid;
  return cid;
end; $$;

create or replace function public.conv_envoyer(cid uuid, k uuid, t text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from conversations where id = cid and client_key = k) then return false; end if;
  insert into messages(conv_id, de, texte) values (cid, 'client', left(btrim(t), 1000));
  return true;
end; $$;

create or replace function public.conv_messages(cid uuid, k uuid)
returns table (id bigint, de text, texte text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from conversations c where c.id = cid and c.client_key = k) then return; end if;
  update conversations set non_lus_client = 0 where conversations.id = cid and non_lus_client > 0;
  return query select m.id, m.de, m.texte, m.created_at from messages m where m.conv_id = cid order by m.id desc limit 200;
end; $$;

create or replace function public.conv_liste(k uuid)
returns table (id uuid, shop_id uuid, last_at timestamptz, last_msg text, non_lus int)
language sql stable security definer set search_path = public as $$
  select id, shop_id, last_at, last_msg, non_lus_client from conversations where client_key = k order by last_at desc limit 50;
$$;

create or replace function public.conv_signaler(cid uuid, k uuid, m text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update conversations c set signale = true, motif = left(coalesce(m,''), 200)
  where c.id = cid and (c.client_key = k or exists (select 1 from shops s where s.id = c.shop_id and s.owner = auth.uid()));
  return found;
end; $$;

-- Le vendeur marque une discussion comme lue
create or replace function public.conv_lu(cid uuid) returns void
language sql security definer set search_path = public as $$
  update conversations c set non_lus_vendeur = 0 where c.id = cid
    and exists (select 1 from shops s where s.id = c.shop_id and s.owner = auth.uid());
$$;

-- Alertes : le vendeur peut aussi recevoir les notifications de nouveaux messages,
-- et le client celles des réponses du vendeur
alter table public.push_subs add column if not exists convs uuid[] not null default '{}';
alter table public.push_subs add column if not exists vendeur_shop uuid;
create index if not exists push_subs_convs on public.push_subs using gin (convs);
drop function if exists public.push_save(text,text,text,uuid[],uuid[]);
create or replace function public.push_save(ep text, k text, a text, sh uuid[], ord uuid[], cv uuid[] default '{}') returns boolean
language plpgsql security definer set search_path = public as $$
declare vs uuid;
begin
  if ep !~ '^https://' or length(ep) > 800 or coalesce(k,'') = '' or coalesce(a,'') = '' then return false; end if;
  select id into vs from shops where owner = auth.uid() limit 1;
  insert into push_subs(endpoint, p256dh, auth, shops, orders, convs, vendeur_shop, updated_at)
  values (ep, k, a, coalesce(sh[1:200], '{}'), coalesce(ord[1:50], '{}'), coalesce(cv[1:50], '{}'), vs, now())
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, shops = excluded.shops,
    orders = excluded.orders, convs = excluded.convs, vendeur_shop = coalesce(excluded.vendeur_shop, push_subs.vendeur_shop), updated_at = now();
  return true;
end; $$;

-- Le compte client garde aussi sa clé de discussion (pour la retrouver sur un autre téléphone)
alter table public.client_data add column if not exists ck uuid;

revoke all on public.conversations, public.messages from anon;
grant select, update on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant execute on function public.conv_ouvrir(uuid,uuid,text,text), public.conv_envoyer(uuid,uuid,text), public.conv_messages(uuid,uuid),
  public.conv_liste(uuid), public.conv_signaler(uuid,uuid,text), public.push_save(text,text,text,uuid[],uuid[],uuid[]) to anon, authenticated;
grant execute on function public.conv_lu(uuid) to authenticated;
revoke execute on function public.conv_lu(uuid) from public, anon;

-- ===== Mise à jour 8 (incluse) =====

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

-- ===== Mise à jour 9 (incluse) =====

alter table public.commerciaux add column if not exists point_id uuid references public.points_vente(id) on delete set null;

-- Quand la vente est confirmée, une commande venue du lien d'un commercial va dans son point de vente
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
    if new.point_id is null and new.commercial_code <> '' then
      select c.point_id into new.point_id from commerciaux c where c.shop_id = new.shop_id and c.code = new.commercial_code;
    end if;
  end if;
  return new;
end; $$;

-- ===== Mise à jour 10 (incluse) =====

alter table public.shops add column if not exists couverture text not null default '' check (length(couverture) <= 400);
alter table public.points_vente add column if not exists lat double precision check (lat between -90 and 90);
alter table public.points_vente add column if not exists lng double precision check (lng between -180 and 180);
alter table public.settings add column if not exists fetes jsonb not null default '{}'::jsonb;

-- Podium du mois, visible dans l'espace du commercial (prénoms et nombre de ventes seulement)
create or replace function public.podium_commercial(sec uuid)
returns table (nom text, ventes int, moi boolean)
language sql stable security definer set search_path = public as $$
  select split_part(c.nom, ' ', 1), count(o.id)::int, c.secret = sec
  from commerciaux c
  left join orders o on o.shop_id = c.shop_id and o.commercial_code = c.code and o.statut = 'confirmee'
    and o.created_at >= date_trunc('month', now())
  where c.shop_id = (select shop_id from commerciaux where secret = sec and actif) and c.actif
  group by c.id, c.nom, c.secret
  order by 2 desc, 1
  limit 10;
$$;
grant execute on function public.podium_commercial(uuid) to anon, authenticated;

-- Meilleures ventes des 60 derniers jours (pour le badge « Meilleure vente ») : seulement l'identifiant du produit et la quantité
create or replace function public.meilleures_ventes()
returns table (pid text, n int)
language sql stable security definer set search_path = public as $$
  select it->>'pid', sum(coalesce((it->>'qty')::int, 1))::int
  from orders o, jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) it
  where o.statut = 'confirmee' and o.created_at > now() - interval '60 days' and it ? 'pid'
  group by 1 having sum(coalesce((it->>'qty')::int, 1)) >= 3
  order by 2 desc limit 40;
$$;
grant execute on function public.meilleures_ventes() to anon, authenticated;

-- ===== Mise à jour 11 (incluse) =====

create table if not exists public.aide (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'guide' check (type in ('guide','video')),
  public text not null default 'vendeur' check (public in ('vendeur','client')),
  titre text not null check (length(titre) between 1 and 100),
  icone text not null default '💡' check (length(icone) <= 8),
  etapes jsonb not null default '[]'::jsonb check (jsonb_typeof(etapes) = 'array'),
  video_url text not null default '' check (length(video_url) <= 400),
  duree text not null default '' check (length(duree) <= 10),
  ordre int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.aide enable row level security;
drop policy if exists "aide: lecture" on public.aide;
create policy "aide: lecture" on public.aide for select using (actif or public.is_admin());
drop policy if exists "aide: admin" on public.aide;
create policy "aide: admin" on public.aide for all using (public.is_admin()) with check (public.is_admin());
grant select on public.aide to anon, authenticated;
grant insert, update, delete on public.aide to authenticated;

-- Guides de départ (ajoutés seulement si la table est vide)
insert into public.aide (public, titre, icone, ordre, etapes)
select x.p, x.t, x.i, x.o, x.e::jsonb from (values
 ('vendeur','Créer ma boutique','🏪',1,'["Sur l''accueil, touchez « Je suis vendeur ».","Créez votre compte avec votre numéro et un mot de passe.","Donnez le nom de la boutique, votre WhatsApp, votre ville et votre quartier.","C''est prêt : votre boutique a son propre lien."]'),
 ('vendeur','Ajouter un produit','📸',2,'["Vendeur → Produits → « + Ajouter un produit ».","Prenez une photo, écrivez le nom et le prix.","Choisissez le rayon, puis touchez « Enregistrer ». Le produit apparaît tout de suite."]'),
 ('vendeur','Partager mon lien sur WhatsApp','📲',3,'["Vendeur → touchez « Voir ma page ».","Touchez le bouton partager en haut pour copier le lien de la boutique.","Sur un produit, l''icône image crée une belle image pour votre statut.","Collez le lien sur votre statut WhatsApp, TikTok ou Facebook."]'),
 ('vendeur','Confirmer une vente et envoyer le reçu','✅',4,'["Vendeur → Commandes : les nouvelles commandes sont en orange.","Quand le client a payé, touchez « Confirmer la vente » : la caisse et le stock se mettent à jour.","Choisissez le paiement (Wave, Espèces… ou À crédit).","Touchez « Envoyer le reçu » : le client le reçoit sur WhatsApp."]'),
 ('vendeur','Suivre une livraison','🛵',5,'["Sur une vente confirmée, choisissez l''étape : Préparation, En route…","Écrivez le nom du livreur et l''heure d''arrivée prévue.","À la livraison, demandez au client son code à 4 chiffres et validez-le."]'),
 ('vendeur','Utiliser la caisse et le relevé','💰',6,'["Chaque vente confirmée s''ajoute seule dans la Caisse.","Ajoutez vos dépenses (transport, tissu…) pour voir votre vrai bénéfice.","« Relevé du mois » fait un PDF à garder ou à envoyer.","Dans Clients, « Relevé du client » montre ce qu''un client vous doit."]'),
 ('vendeur','Ajouter un point de vente ou un commercial','👥',7,'["Vendeur → Équipe.","Ajoutez vos magasins ou stands, puis « Placer sur la carte » en étant sur place.","Ajoutez un commercial : il reçoit son lien de vente et sa page pour suivre sa commission."]'),
 ('client','Commander un article','🛍',1,'["Choisissez un produit et touchez « + ».","Ouvrez le Panier, écrivez votre nom et votre numéro.","Touchez « Commander sur WhatsApp » : le message part tout prêt chez le vendeur."]'),
 ('client','Acheter en sécurité','🔒',2,'["Préférez le paiement à la livraison.","Avant de payer, vérifiez le numéro du vendeur dans « Achetez en sécurité ».","Donnez votre code de livraison seulement quand vous avez l''article en main."]'),
 ('client','Suivre ma commande','🚚',3,'["Touchez l''icône camion sur l''accueil.","Vous voyez chaque étape : confirmée, en préparation, en route, livrée.","Activez les alertes pour être prévenu à chaque étape."]'),
 ('client','Discuter avec une boutique','💬',4,'["Sur la page d''une boutique, touchez « Discuter ici avec la boutique ».","Écrivez votre question : le vendeur répond dans l''appli.","Vous retrouvez vos discussions dans « Mes discussions »."]')
) as x(p,t,i,o,e)
where not exists (select 1 from public.aide);

-- ===== Mise à jour 12 (incluse) =====

create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(titre) between 1 and 80),
  texte text not null default '' check (length(texte) <= 300),
  lien text not null default '' check (length(lien) <= 300),
  cible text not null default 'tous' check (cible in ('tous','vendeurs','clients')),
  envoye int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.annonces enable row level security;
drop policy if exists "annonces: lecture" on public.annonces;
create policy "annonces: lecture" on public.annonces for select using (true);
drop policy if exists "annonces: admin" on public.annonces;
create policy "annonces: admin" on public.annonces for all using (public.is_admin()) with check (public.is_admin());
grant select on public.annonces to anon, authenticated;
grant insert, update, delete on public.annonces to authenticated;

-- ===== Mise à jour 13 (incluse) =====
-- Gbairai Market : mise à jour 13 (sécurité : anti-spam, photos, commandes, paiements).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- 1) Photos : seulement des images, 5 Mo maximum (empêche d'héberger des pages pièges)
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'photos';

-- 2) Anti-spam : limite les avis, signalements et commandes envoyés en rafale
create or replace function public.anti_spam() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if public.is_admin() then return new; end if;
  if tg_table_name = 'reviews' then
    select count(*) into n from reviews where shop_id = new.shop_id and created_at > now() - interval '1 hour';
    if n >= 5 then raise exception 'Trop d''avis pour cette boutique. Réessayez plus tard.'; end if;
  elsif tg_table_name = 'reports' then
    select count(*) into n from reports where shop_id is not distinct from new.shop_id and created_at > now() - interval '1 hour';
    if n >= 10 then raise exception 'Trop de signalements. Réessayez plus tard.'; end if;
  elsif tg_table_name = 'orders' then
    select count(*) into n from orders where shop_id = new.shop_id and created_at > now() - interval '10 minutes';
    if n >= 30 then raise exception 'Trop de commandes en même temps. Réessayez dans quelques minutes.'; end if;
    select count(*) into n from orders where client_tel = new.client_tel and new.client_tel <> '' and created_at > now() - interval '10 minutes';
    if n >= 5 then raise exception 'Trop de commandes avec ce numéro. Réessayez dans quelques minutes.'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists reviews_anti_spam on public.reviews;
create trigger reviews_anti_spam before insert on public.reviews for each row execute function public.anti_spam();
drop trigger if exists reports_anti_spam on public.reports;
create trigger reports_anti_spam before insert on public.reports for each row execute function public.anti_spam();
drop trigger if exists orders_anti_spam on public.orders;
create trigger orders_anti_spam before insert on public.orders for each row execute function public.anti_spam();

-- 3) Commandes : taille raisonnable du panier et du total
alter table public.orders drop constraint if exists orders_taille;
alter table public.orders add constraint orders_taille check (
  jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60
  and pg_column_size(items) <= 30000 and total between 0 and 100000000) not valid;

-- 4) Commandes : après l'envoi, le contenu, le total, le client et le commercial ne changent plus
--    (protège les reçus et les commissions des commerciaux). L'admin garde la main.
create or replace function public.orders_verrou() returns trigger language plpgsql as $$
begin
  if not public.is_admin() and current_user not in ('postgres','supabase_admin') then
    new.items := old.items; new.total := old.total; new.canal := old.canal;
    new.client_nom := old.client_nom; new.client_tel := old.client_tel; new.client_adresse := old.client_adresse;
    new.commercial_code := old.commercial_code; new.created_at := old.created_at; new.recu_num := old.recu_num;
  end if;
  return new;
end; $$;
drop trigger if exists orders_a_verrou on public.orders;
create trigger orders_a_verrou before update on public.orders for each row execute function public.orders_verrou();

-- 5) Paiements déclarés : durée et montant possibles seulement
alter table public.payments drop constraint if exists payments_bornes;
alter table public.payments add constraint payments_bornes check (
  duree between 1 and 24 and montant between 0 and 10000000) not valid;

-- 6) Couverture de boutique : un motif prévu, ou un lien https propre
alter table public.shops drop constraint if exists shops_couverture_ok;
alter table public.shops add constraint shops_couverture_ok check (
  couverture in ('','wax','bogolan','degrade') or couverture ~ '^https://[^''"()<>\\[:space:]]+$') not valid;

-- ===== mise-a-jour-14 =====
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
