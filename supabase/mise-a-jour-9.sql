-- Gbairai Market : mise à jour 9 (rattacher un commercial à un point de vente).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

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
