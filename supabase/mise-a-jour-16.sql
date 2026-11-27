-- Gbairai Market : mise à jour 16 (les 10 nouvelles idées).
-- Vendeur IA, payer en 3 fois, Gbairai Coins, heure magique 20 h, livreur suivi en direct, cagnotte cadeau.
-- (Studio photo, vidéo TikTok, essayage caméra et prévisions de stock n'ont pas besoin de la base.)
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- ---------- Réglages de la boutique ----------
alter table public.shops add column if not exists assistant boolean not null default true;          -- vendeur IA 24 h/24
alter table public.shops add column if not exists assistant_info text not null default '';           -- consignes pour l'IA
alter table public.shops drop constraint if exists shops_assistant_info_taille;
alter table public.shops add constraint shops_assistant_info_taille check (length(assistant_info) <= 800);
alter table public.shops add column if not exists tranches boolean not null default false;           -- accepte le paiement en 3 fois
alter table public.shops add column if not exists coins_ok boolean not null default false;           -- accepte les Gbairai Coins

-- ---------- Heure magique : un prix spécial chaque soir de 20 h à 21 h ----------
alter table public.products add column if not exists prix_magique int;
alter table public.products drop constraint if exists products_prix_magique_ok;
alter table public.products add constraint products_prix_magique_ok check (prix_magique is null or (prix_magique > 0 and prix_magique < prix));

-- ---------- Commandes : paiement en tranches + clé du livreur ----------
alter table public.orders add column if not exists tranches smallint not null default 1;
alter table public.orders add column if not exists tranches_payees smallint not null default 0;
alter table public.orders add column if not exists livreur_cle uuid;
alter table public.orders add column if not exists coins_bon text not null default '';
alter table public.orders drop constraint if exists orders_tranches_ok;
alter table public.orders add constraint orders_tranches_ok check (tranches between 1 and 3 and tranches_payees between 0 and tranches);

-- Le nombre de tranches choisi par le client ne change plus après l'envoi (l'admin garde la main)
create or replace function public.orders_verrou() returns trigger language plpgsql as $$
begin
  if not public.is_admin() and current_user not in ('postgres','supabase_admin') then
    new.items := old.items; new.total := old.total; new.canal := old.canal;
    new.client_nom := old.client_nom; new.client_tel := old.client_tel; new.client_adresse := old.client_adresse;
    new.commercial_code := old.commercial_code; new.created_at := old.created_at; new.recu_num := old.recu_num;
    new.tranches := old.tranches; new.coins_bon := old.coins_bon;
  end if;
  return new;
end; $$;

-- Suivi client : on ajoute les tranches
drop function if exists public.suivi_tranches(uuid);
create or replace function public.suivi_tranches(oid uuid)
returns table (tranches int, payees int, total int, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.tranches::int, o.tranches_payees::int, o.total, o.created_at from orders o where o.id = oid;
$$;
grant execute on function public.suivi_tranches(uuid) to anon, authenticated;

-- ---------- Livreur suivi en direct ----------
create table if not exists public.livraison_pos (
  order_id uuid primary key references public.orders(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  vitesse real,
  maj timestamptz not null default now()
);
alter table public.livraison_pos enable row level security;  -- aucune règle : accès seulement par les fonctions

-- Le livreur (lien secret) : voir la course
create or replace function public.livreur_course(oid uuid, cle uuid)
returns table (boutique text, client_nom text, client_tel text, client_adresse text, total int, items jsonb, livraison text)
language sql stable security definer set search_path = public as $$
  select s.nom, o.client_nom, o.client_tel, o.client_adresse, o.total, o.items, o.livraison
  from orders o join shops s on s.id = o.shop_id where o.id = oid and o.livreur_cle = cle and cle is not null;
$$;
-- Le livreur envoie sa position (toutes les 10 secondes au plus)
create or replace function public.livreur_position(oid uuid, cle uuid, la double precision, lo double precision, v real)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from orders where id = oid and livreur_cle = cle and cle is not null
                 and coalesce(livraison,'') not in ('livree','echec') and statut <> 'annulee') then return false; end if;
  insert into livraison_pos(order_id, lat, lng, vitesse, maj) values (oid, la, lo, v, now())
  on conflict (order_id) do update set lat = excluded.lat, lng = excluded.lng, vitesse = excluded.vitesse, maj = now()
  where livraison_pos.maj < now() - interval '8 seconds';
  return true;
end; $$;
-- Le client (lien de suivi) : où est le livreur ?
create or replace function public.position_livreur(oid uuid)
returns table (lat double precision, lng double precision, vitesse real, maj timestamptz)
language sql stable security definer set search_path = public as $$
  select p.lat, p.lng, p.vitesse, p.maj from livraison_pos p join orders o on o.id = p.order_id
  where p.order_id = oid and o.livraison = 'en_route' and p.maj > now() - interval '30 minutes';
$$;
grant execute on function public.livreur_course(uuid, uuid), public.livreur_position(uuid, uuid, double precision, double precision, real), public.position_livreur(uuid) to anon, authenticated;

-- ---------- Cagnotte cadeau ----------
create table if not exists public.cagnottes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  pour text not null check (length(pour) between 1 and 60),
  occasion text not null default '' check (length(occasion) <= 60),
  date_evt date,
  objectif int not null check (objectif > 0),
  org_nom text not null check (length(org_nom) between 1 and 60),
  org_tel text not null check (length(org_tel) between 8 and 20),
  cle uuid not null default gen_random_uuid(),
  statut text not null default 'ouverte' check (statut in ('ouverte','commandee','annulee')),
  created_at timestamptz not null default now()
);
create table if not exists public.cagnotte_parts (
  id uuid primary key default gen_random_uuid(),
  cagnotte_id uuid not null references public.cagnottes(id) on delete cascade,
  nom text not null default '' check (length(nom) <= 60),
  tel text not null check (length(tel) between 8 and 20),
  montant int not null check (montant between 100 and 5000000),
  anonyme boolean not null default false,
  created_at timestamptz not null default now(),
  unique (cagnotte_id, tel)
);
alter table public.cagnottes enable row level security;
alter table public.cagnotte_parts enable row level security;
-- Le vendeur voit les cagnottes de ses articles
drop policy if exists "cagnottes: vendeur" on public.cagnottes;
create policy "cagnottes: vendeur" on public.cagnottes for select using (
  exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())));
grant select on public.cagnottes to authenticated;

create or replace function public.cagnotte_creer(pid uuid, p_pour text, p_occasion text, p_date date, p_nom text, p_tel text)
returns table (id uuid, cle uuid)
language plpgsql security definer set search_path = public as $$
declare pr public.products; t text := regexp_replace(coalesce(p_tel,''), '\D', '', 'g'); c public.cagnottes;
begin
  select * into pr from products where products.id = pid and visible;
  if pr.id is null then raise exception 'Article introuvable.'; end if;
  if length(t) < 8 or length(t) > 15 then raise exception 'Numéro invalide.'; end if;
  if length(trim(coalesce(p_pour,''))) = 0 or length(trim(coalesce(p_nom,''))) = 0 then raise exception 'Indiquez les prénoms.'; end if;
  if (select count(*) from cagnottes x where x.org_tel = t and x.created_at > now() - interval '1 day') >= 5 then raise exception 'Trop de cagnottes aujourd''hui.'; end if;
  insert into cagnottes(product_id, shop_id, pour, occasion, date_evt, objectif, org_nom, org_tel)
  values (pr.id, pr.shop_id, left(trim(p_pour),60), left(coalesce(p_occasion,''),60), p_date, pr.prix, left(trim(p_nom),60), t)
  returning * into c;
  return query select c.id, c.cle;
end; $$;

-- Vue publique : les prénoms (ou « Anonyme ») et les montants, jamais les numéros des amis
create or replace function public.cagnotte_voir(cid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'product_id', c.product_id, 'shop_id', c.shop_id, 'pour', c.pour, 'occasion', c.occasion,
    'date_evt', c.date_evt, 'objectif', c.objectif, 'org_nom', c.org_nom, 'org_tel', c.org_tel, 'statut', c.statut, 'created_at', c.created_at,
    'parts', coalesce((select jsonb_agg(jsonb_build_object('nom', case when p.anonyme then 'Anonyme' else p.nom end, 'montant', p.montant, 'le', p.created_at) order by p.created_at)
                       from cagnotte_parts p where p.cagnotte_id = c.id), '[]'::jsonb))
  from cagnottes c where c.id = cid;
$$;

create or replace function public.cagnotte_participer(cid uuid, p_nom text, p_tel text, p_montant int, p_anonyme boolean)
returns int language plpgsql security definer set search_path = public as $$
declare c public.cagnottes; t text := regexp_replace(coalesce(p_tel,''), '\D', '', 'g'); total int;
begin
  select * into c from cagnottes where id = cid;
  if c.id is null or c.statut <> 'ouverte' then raise exception 'Cette cagnotte est fermée.'; end if;
  if length(t) < 8 or length(t) > 15 then raise exception 'Numéro invalide.'; end if;
  if coalesce(p_montant,0) < 100 then raise exception 'Au moins 100 F.'; end if;
  insert into cagnotte_parts(cagnotte_id, nom, tel, montant, anonyme)
  values (cid, left(trim(coalesce(p_nom,'')),60), t, least(p_montant, 5000000), coalesce(p_anonyme,false))
  on conflict (cagnotte_id, tel) do update set montant = excluded.montant, nom = excluded.nom, anonyme = excluded.anonyme;
  if (select count(*) from cagnotte_parts where cagnotte_id = cid) > 100 then raise exception 'Cagnotte complète.'; end if;
  select coalesce(sum(montant),0)::int into total from cagnotte_parts where cagnotte_id = cid;
  return total;
end; $$;

-- L'organisateur (clé secrète) : voir les numéros des amis, marquer « commandée » ou annuler
create or replace function public.cagnotte_parts_org(cid uuid, k uuid)
returns table (nom text, tel text, montant int, anonyme boolean)
language sql stable security definer set search_path = public as $$
  select p.nom, p.tel, p.montant, p.anonyme from cagnotte_parts p join cagnottes c on c.id = p.cagnotte_id
  where c.id = cid and c.cle = k order by p.created_at;
$$;
create or replace function public.cagnotte_statut(cid uuid, k uuid, s text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if s not in ('ouverte','commandee','annulee') then return false; end if;
  update cagnottes set statut = s where id = cid and cle = k;
  return found;
end; $$;
grant execute on function public.cagnotte_creer(uuid, text, text, date, text, text), public.cagnotte_voir(uuid),
  public.cagnotte_participer(uuid, text, text, int, boolean), public.cagnotte_parts_org(uuid, uuid), public.cagnotte_statut(uuid, uuid, text) to anon, authenticated;

-- ---------- Gbairai Coins : points de fidélité ----------
-- 1 Coin pour 100 F d'achat confirmé, +100 au premier achat. 1 Coin = 1 F de remise chez les boutiques qui acceptent les Coins.
create table if not exists public.coins_gains (
  id uuid primary key default gen_random_uuid(),
  tel text not null,
  coins int not null,
  raison text not null,
  ref text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists coins_gains_tel on public.coins_gains(tel);
create table if not exists public.coins_bons (
  code text primary key,
  tel text not null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  montant int not null check (montant between 100 and 100000),
  utilise boolean not null default false,
  utilise_le timestamptz,
  expire timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists coins_bons_tel on public.coins_bons(tel);
alter table public.coins_gains enable row level security;   -- accès seulement par les fonctions
alter table public.coins_bons enable row level security;
drop policy if exists "bons: vendeur" on public.coins_bons;
create policy "bons: vendeur" on public.coins_bons for select using (
  exists (select 1 from public.shops s where s.id = shop_id and (s.owner = auth.uid() or public.is_admin())));
grant select on public.coins_bons to authenticated;

-- Gagner des Coins quand le vendeur confirme une commande
create or replace function public.coins_sur_commande() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text := norm_phone(new.client_tel); proprio text; jour int;
begin
  if new.statut = 'confirmee' and coalesce(old.statut,'') <> 'confirmee' and length(t) >= 11 and new.total >= 100 then
    -- pas de Coins sur ses propres achats
    select coalesce(p.phone,'') into proprio from shops s left join profiles p on p.id = s.owner where s.id = new.shop_id;
    if proprio = t then return new; end if;
    select coalesce(sum(coins),0) into jour from coins_gains where tel = t and created_at > now() - interval '1 day';
    if jour >= 5000 then return new; end if;
    insert into coins_gains(tel, coins, raison, ref) values (t, least(new.total / 100, 5000 - jour), 'Achat', 'cmd:' || new.id) on conflict (ref) do nothing;
    insert into coins_gains(tel, coins, raison, ref) values (t, 100, 'Premier achat', 'premier:' || t) on conflict (ref) do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists orders_coins on public.orders;
create trigger orders_coins after update on public.orders for each row execute function public.coins_sur_commande();

-- Mon numéro (compte client) : le numéro est dans l'adresse de connexion
create or replace function public.mon_tel() returns text language sql stable as $$
  select split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1);
$$;
create or replace function public.coins_solde_de(t text) returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(coins) from coins_gains where tel = t), 0)
        - coalesce((select sum(montant) from coins_bons where tel = t and (utilise or expire > now())), 0))::int;
$$;
revoke execute on function public.coins_solde_de(text) from public, anon, authenticated;

create or replace function public.mes_coins()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then null else jsonb_build_object(
    'solde', coins_solde_de(mon_tel()),
    'gagnes', coalesce((select sum(coins) from coins_gains where tel = mon_tel()), 0),
    'historique', coalesce((select jsonb_agg(x order by x.le desc) from (
        select raison as libelle, coins, created_at as le from coins_gains where tel = mon_tel()
        union all
        select 'Bon ' || b.code || ' · ' || s.nom, -b.montant, b.created_at from coins_bons b join shops s on s.id = b.shop_id
          where b.tel = mon_tel() and (b.utilise or b.expire > now())
        order by le desc limit 40) x), '[]'::jsonb),
    'bons', coalesce((select jsonb_agg(jsonb_build_object('code', b.code, 'shop_id', b.shop_id, 'montant', b.montant, 'expire', b.expire))
        from coins_bons b where b.tel = mon_tel() and not b.utilise and b.expire > now()), '[]'::jsonb)) end;
$$;

-- Utiliser ses Coins : crée un bon de réduction pour une boutique (valable 7 jours ; non utilisé, les Coins reviennent)
create or replace function public.coins_bon(sid uuid, m int)
returns text language plpgsql security definer set search_path = public as $$
declare t text := mon_tel(); c text; a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  if auth.uid() is null or length(t) < 11 then raise exception 'Connectez-vous à votre compte client.'; end if;
  if not exists (select 1 from shops where id = sid and coins_ok and statut = 'actif') then raise exception 'Cette boutique n''accepte pas les Coins.'; end if;
  if coalesce(m,0) < 100 then raise exception 'Au moins 100 Coins.'; end if;
  if m > coins_solde_de(t) then raise exception 'Pas assez de Coins.'; end if;
  if (select count(*) from coins_bons where tel = t and not utilise and expire > now()) >= 5 then raise exception 'Utilisez d''abord vos bons en cours.'; end if;
  loop
    c := 'GC-'; for i in 1..6 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from coins_bons where code = c);
  end loop;
  insert into coins_bons(code, tel, shop_id, montant, expire) values (c, t, sid, least(m, 100000), now() + interval '7 days');
  return c;
end; $$;

-- Le vendeur valide un bon reçu dans une commande
create or replace function public.coins_valider(c text)
returns int language plpgsql security definer set search_path = public as $$
declare b public.coins_bons;
begin
  select * into b from coins_bons where code = upper(trim(c));
  if b.code is null then raise exception 'Bon inconnu.'; end if;
  if not exists (select 1 from shops where id = b.shop_id and (owner = auth.uid() or public.is_admin())) then raise exception 'Ce bon est pour une autre boutique.'; end if;
  if b.utilise then raise exception 'Bon déjà utilisé.'; end if;
  if b.expire < now() then raise exception 'Bon expiré.'; end if;
  update coins_bons set utilise = true, utilise_le = now() where code = b.code;
  return b.montant;
end; $$;
grant execute on function public.mes_coins(), public.coins_bon(uuid, int), public.coins_valider(text) to authenticated;

-- ---------- Heure magique : recevoir l'alerte de 20 h ----------
alter table public.push_subs add column if not exists magique boolean not null default false;
create or replace function public.push_magique(ep text, oui boolean)
returns boolean language sql security definer set search_path = public as $$
  update push_subs set magique = coalesce(oui, false) where endpoint = ep returning true;
$$;
grant execute on function public.push_magique(text, boolean) to anon, authenticated;
