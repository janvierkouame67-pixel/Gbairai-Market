-- Gbairai Market : mise à jour 7 (discussions client ↔ vendeur dans Gbairai).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.
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
