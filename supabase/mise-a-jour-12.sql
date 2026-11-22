-- Gbairai Market : mise à jour 12 (annonces de l'admin envoyées à tous : notification + message dans l'appli).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(titre) between 1 and 80),
  texte text not null default '' check (length(texte) <= 300),
  lien text not null default '' check (length(lien) <= 300),
  cible text not null default 'tous' check (cible in ('tous','vendeurs','clients')),
  envoye int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.annonces enable row level security;
drop policy if exists "annonces: lecture" on public.annonces;
create policy "annonces: lecture" on public.annonces for select using (true);
drop policy if exists "annonces: admin" on public.annonces;
create policy "annonces: admin" on public.annonces for all using (public.is_admin()) with check (public.is_admin());
grant select on public.annonces to anon, authenticated;
grant insert, update, delete on public.annonces to authenticated;
