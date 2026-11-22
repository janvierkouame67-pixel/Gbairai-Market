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
