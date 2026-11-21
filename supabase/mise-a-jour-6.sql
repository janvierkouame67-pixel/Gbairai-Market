-- Gbairai Market : mise à jour 6 (vendeurs « en ligne »).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

-- Dernière fois que le vendeur a ouvert son espace
alter table public.shops add column if not exists vu_le timestamptz;

-- Appelée par le site quand le vendeur est connecté (toutes les 2 minutes)
create or replace function public.je_suis_la() returns void
language sql security definer set search_path = public as $$
  update shops set vu_le = now() where owner = auth.uid() and (vu_le is null or vu_le < now() - interval '1 minute');
$$;
revoke execute on function public.je_suis_la() from public, anon;
grant execute on function public.je_suis_la() to authenticated;
