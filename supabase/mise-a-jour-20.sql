-- Gbairai Market : mise à jour 20 « Promos : droit d'envoi du serveur »
-- Le serveur (qui envoie les notifications) n'avait pas le droit de lire la liste des promos.
-- À coller dans Supabase › SQL Editor, puis « Run ». On peut le relancer sans risque.
grant all on public.campagnes to service_role;
grant execute on function public.campagne_ouverte(uuid), public.push_promos(text, boolean) to service_role;
