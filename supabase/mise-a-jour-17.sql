-- Gbairai Market : mise à jour 17 « Artisans du quotidien »
-- Un artisan (plombier, électricien…) est une boutique qui a un métier.
-- À coller dans Supabase › SQL Editor, puis « Run ». On peut le relancer sans risque.

alter table public.shops add column if not exists metier text;
alter table public.shops add column if not exists dispo boolean not null default false;
alter table public.shops add column if not exists dispo_maj timestamptz;
alter table public.shops add column if not exists urgence boolean not null default false;
alter table public.shops add column if not exists deplacement int;
alter table public.shops add column if not exists lat double precision;
alter table public.shops add column if not exists lng double precision;
alter table public.shops add column if not exists galerie jsonb not null default '[]'::jsonb;

alter table public.shops drop constraint if exists shops_metier_ok;
alter table public.shops add constraint shops_metier_ok check (metier is null or metier in (
  'plombier','electricien','frigoriste','macon','menuisier','peintre','soudeur','serrurier','vitrier',
  'mecanicien','moto','telephone','antenne','couturier','coiffure','menage','gaz','vidange'));
alter table public.shops drop constraint if exists shops_deplacement_ok;
alter table public.shops add constraint shops_deplacement_ok check (deplacement is null or deplacement between 0 and 100000);
alter table public.shops drop constraint if exists shops_pos_ok;
alter table public.shops add constraint shops_pos_ok check ((lat is null or lat between -90 and 90) and (lng is null or lng between -180 and 180));
alter table public.shops drop constraint if exists shops_galerie_ok;
alter table public.shops add constraint shops_galerie_ok check (jsonb_typeof(galerie) = 'array' and jsonb_array_length(galerie) <= 12 and length(galerie::text) <= 6000);

-- Quand l'artisan change « Disponible », on note l'heure (la dispo s'éteint seule après 12 h sur le site)
create or replace function public.shops_dispo_maj() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.dispo is distinct from old.dispo then new.dispo_maj := now(); end if;
  return new;
end; $$;
drop trigger if exists shops_dispo on public.shops;
create trigger shops_dispo before insert or update on public.shops
for each row execute function public.shops_dispo_maj();

create index if not exists shops_metier_idx on public.shops (metier) where metier is not null;
