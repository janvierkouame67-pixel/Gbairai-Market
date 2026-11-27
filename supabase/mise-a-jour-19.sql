-- Gbairai Market : mise à jour 19 « Notifications promo »
-- Comme les grandes applis : « -20 % sur tout » arrive sur l'écran du téléphone, avec une image.
--  - le vendeur envoie une promo à ses abonnés (1 par jour et 3 par semaine au plus)
--  - l'admin envoie une promo à tous les clients, aux vendeurs ou à tout le monde, et peut mettre une boutique en avant
--  - on peut programmer l'envoi (date et heure), et l'annuler tant qu'il n'est pas parti
--  - chaque client peut refuser les promos sur son téléphone
-- À coller dans Supabase › SQL Editor, puis « Run ». On peut le relancer sans risque.

create table if not exists public.campagnes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,      -- vide = campagne de l'admin
  titre text not null check (length(titre) between 1 and 60),
  texte text not null default '' check (length(texte) <= 160),
  image text not null default '' check (image = '' or (image ~ '^https://' and length(image) <= 500)),
  lien text not null default '' check (lien = '' or lien ~ '^#[A-Za-z0-9_-]{1,80}$'),
  cible text not null default 'abonnes' check (cible in ('abonnes','clients','vendeurs','tous')),
  envoyer_a timestamptz not null default now(),
  statut text not null default 'prevue' check (statut in ('prevue','envoi','envoyee','annulee')),
  envoye int not null default 0,
  ouvertures int not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check ((shop_id is null) or cible = 'abonnes'),
  check (envoyer_a <= created_at + interval '30 days')
);
create index if not exists campagnes_a_envoyer on public.campagnes (envoyer_a) where statut = 'prevue';
create index if not exists campagnes_shop on public.campagnes (shop_id, envoyer_a);
alter table public.campagnes enable row level security;

drop policy if exists "campagnes: lecture" on public.campagnes;
create policy "campagnes: lecture" on public.campagnes for select
  using (public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid()));
drop policy if exists "campagnes: création" on public.campagnes;
create policy "campagnes: création" on public.campagnes for insert
  with check (statut = 'prevue' and envoye = 0 and (
    (shop_id is null and public.is_admin())
    or exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid() and s.statut = 'actif')));
drop policy if exists "campagnes: annulation" on public.campagnes;
create policy "campagnes: annulation" on public.campagnes for update
  using (statut = 'prevue' and (public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid())))
  with check (statut = 'annulee');
drop policy if exists "campagnes: suppression" on public.campagnes;
create policy "campagnes: suppression" on public.campagnes for delete
  using (public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner = auth.uid()));
grant select, insert, update, delete on public.campagnes to authenticated;

-- Pas de spam : une boutique envoie au plus 1 promo par jour et 3 par semaine (comptées à la date d'envoi).
create or replace function public.campagnes_limite() returns trigger
language plpgsql security definer set search_path = public as $$
declare n_jour int; n_sem int;
begin
  if new.shop_id is null then return new; end if;
  if new.envoyer_a < now() - interval '5 minutes' then new.envoyer_a := now(); end if;
  select count(*) filter (where envoyer_a > new.envoyer_a - interval '20 hours' and envoyer_a < new.envoyer_a + interval '20 hours'),
         count(*) filter (where envoyer_a > new.envoyer_a - interval '7 days' and envoyer_a < new.envoyer_a + interval '7 days')
    into n_jour, n_sem
    from campagnes where shop_id = new.shop_id and statut <> 'annulee';
  if n_jour >= 1 then raise exception 'Une seule promo par jour : vos clients ne doivent pas recevoir trop de notifications.'; end if;
  if n_sem >= 3 then raise exception 'Trois promos par semaine au plus : vos clients ne doivent pas recevoir trop de notifications.'; end if;
  return new;
end; $$;
drop trigger if exists campagnes_limite on public.campagnes;
create trigger campagnes_limite before insert on public.campagnes for each row execute function public.campagnes_limite();

-- Le client peut refuser les promos sur ce téléphone (les alertes de commande et de message continuent).
alter table public.push_subs add column if not exists promos boolean not null default true;
create or replace function public.push_promos(ep text, oui boolean) returns boolean
language sql security definer set search_path = public as $$
  update push_subs set promos = coalesce(oui, true) where endpoint = ep returning true;
$$;
grant execute on function public.push_promos(text, boolean) to anon, authenticated;

-- Compter les ouvertures (quand on touche la notification)
create or replace function public.campagne_ouverte(cid uuid) returns void
language sql security definer set search_path = public as $$
  update campagnes set ouvertures = ouvertures + 1 where id = cid and statut = 'envoyee' and ouvertures < envoye + 50;
$$;
grant execute on function public.campagne_ouverte(uuid) to anon, authenticated;

-- Les promos programmées partent toutes seules : toutes les 5 minutes, Supabase réveille le site.
-- (Si pg_cron ou pg_net ne sont pas disponibles, le site les envoie quand même dès qu'une personne l'ouvre.)
do $$
begin
  create extension if not exists pg_net;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'gbairai-promos';
  perform cron.schedule('gbairai-promos', '*/5 * * * *',
    $c$select net.http_post(url := 'https://gbairai-market.vercel.app/api/notify', body := '{"kind":"programmees"}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb)$c$);
exception when others then
  raise notice 'Envoi automatique non activé (%). Les promos programmées partiront quand quelqu''un ouvre le site.', sqlerrm;
end $$;
