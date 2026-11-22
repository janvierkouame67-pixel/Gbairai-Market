-- Gbairai Market : mise à jour 10 (thème de boutique, carte des points de vente, fêtes, podium des commerciaux).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

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
