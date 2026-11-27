-- Gbairai Market : mise à jour 15 (les 10 idées : achat groupé, vente en direct, chasse aux codes, photo 360°).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- ---------- Photo 360° : la liste des images (24 vues autour de l'article) ----------
alter table public.products add column if not exists vue360 text[] not null default '{}';
alter table public.products drop constraint if exists products_vue360_taille;
alter table public.products add constraint products_vue360_taille check (coalesce(array_length(vue360, 1), 0) <= 36);

-- ---------- Achat groupé : le prix baisse quand assez de personnes rejoignent ----------
create table if not exists public.groupes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  prix_groupe int not null check (prix_groupe > 0),
  objectif int not null default 5 check (objectif between 2 and 100),
  fin timestamptz not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists groupes_product on public.groupes(product_id);
alter table public.groupes enable row level security;
drop policy if exists "groupes: lecture" on public.groupes;
create policy "groupes: lecture" on public.groupes for select using (true);
drop policy if exists "groupes: vendeur" on public.groupes;
create policy "groupes: vendeur" on public.groupes for all
  using (exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())));
grant select on public.groupes to anon, authenticated;
grant insert, update, delete on public.groupes to authenticated;

-- Les membres : nom et numéro, visibles seulement par le vendeur (et l'admin)
create table if not exists public.groupe_membres (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references public.groupes(id) on delete cascade,
  nom text not null default '' check (length(nom) <= 80),
  tel text not null check (length(tel) between 8 and 20),
  created_at timestamptz not null default now(),
  unique (groupe_id, tel)
);
alter table public.groupe_membres enable row level security;
drop policy if exists "membres: vendeur" on public.groupe_membres;
create policy "membres: vendeur" on public.groupe_membres for select using (
  exists (select 1 from public.groupes g join public.shops s on s.id = g.shop_id
          where g.id = groupe_id and (s.owner = auth.uid() or public.is_admin())));
drop policy if exists "membres: vendeur supprime" on public.groupe_membres;
create policy "membres: vendeur supprime" on public.groupe_membres for delete using (
  exists (select 1 from public.groupes g join public.shops s on s.id = g.shop_id
          where g.id = groupe_id and (s.owner = auth.uid() or public.is_admin())));
grant select, delete on public.groupe_membres to authenticated;

-- Combien de personnes dans chaque groupe (public, sans les numéros)
create or replace function public.groupes_etat()
returns table (groupe_id uuid, nb int)
language sql stable security definer set search_path = public as $$
  select g.id, (select count(*)::int from public.groupe_membres m where m.groupe_id = g.id)
  from public.groupes g where g.actif and g.fin > now() - interval '7 days';
$$;
grant execute on function public.groupes_etat() to anon, authenticated;

-- Rejoindre un groupe (un numéro = une place)
create or replace function public.groupe_rejoindre(gid uuid, n text, t text)
returns int
language plpgsql security definer set search_path = public as $$
declare g public.groupes; tt text := regexp_replace(coalesce(t, ''), '[^0-9]', '', 'g'); total int;
begin
  select * into g from public.groupes where id = gid;
  if g.id is null or not g.actif or g.fin < now() then raise exception 'Ce groupe est terminé.'; end if;
  if length(tt) < 8 or length(tt) > 15 then raise exception 'Numéro invalide.'; end if;
  insert into public.groupe_membres (groupe_id, nom, tel) values (gid, left(coalesce(n, ''), 80), tt)
    on conflict (groupe_id, tel) do nothing;
  select count(*)::int into total from public.groupe_membres where groupe_id = gid;
  if total > 200 then raise exception 'Groupe complet.'; end if;
  return total;
end $$;
grant execute on function public.groupe_rejoindre(uuid, text, text) to anon, authenticated;

-- ---------- Vente en direct : le lien du direct (TikTok, Facebook, YouTube) + les articles montrés ----------
create table if not exists public.lives (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  titre text not null default '' check (length(titre) <= 80),
  url text not null check (length(url) between 8 and 300 and url ~* '^https://'),
  produits uuid[] not null default '{}',
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.lives enable row level security;
drop policy if exists "lives: lecture" on public.lives;
create policy "lives: lecture" on public.lives for select using (true);
drop policy if exists "lives: vendeur" on public.lives;
create policy "lives: vendeur" on public.lives for all
  using (exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())));
grant select on public.lives to anon, authenticated;
grant insert, update, delete on public.lives to authenticated;

-- ---------- Chasse aux codes : codes promo cachés dans les statuts ----------
create table if not exists public.codes_chasse (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9-]{4,20}$'),
  remise int not null check (remise between 1 and 90),
  fin timestamptz not null,
  trouves int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.codes_chasse enable row level security;
-- Personne ne peut lire la liste des codes, sauf le vendeur pour ses propres codes
drop policy if exists "codes: vendeur" on public.codes_chasse;
create policy "codes: vendeur" on public.codes_chasse for all
  using (exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())));
grant select, insert, update, delete on public.codes_chasse to authenticated;

-- Vérifier un code trouvé : renvoie la boutique et la remise, et compte la trouvaille
drop function if exists public.code_trouve(text);
create or replace function public.code_trouve(c text)
returns table (boutique uuid, pct int, expire timestamptz)
language plpgsql security definer set search_path = public as $$
declare k public.codes_chasse; cc text := upper(regexp_replace(coalesce(c, ''), '\s', '', 'g'));
begin
  select x.* into k from public.codes_chasse x where x.code = cc and x.actif and x.fin > now();
  if k.id is null then raise exception 'Code inconnu ou expiré.'; end if;
  update public.codes_chasse x set trouves = x.trouves + 1 where x.id = k.id;
  return query select k.shop_id, k.remise, k.fin;
end $$;
grant execute on function public.code_trouve(text) to anon, authenticated;
