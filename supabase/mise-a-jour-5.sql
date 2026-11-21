-- Gbairai Market : mise à jour 5 (suivre une boutique, notifications, compte client).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

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
