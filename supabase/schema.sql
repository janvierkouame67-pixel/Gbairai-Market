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
