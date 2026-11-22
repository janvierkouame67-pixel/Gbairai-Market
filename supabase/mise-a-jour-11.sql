-- Gbairai Market : mise à jour 11 (page Aide : guides en étapes et vidéos, modifiables par l'admin).
-- À coller une fois dans Supabase > SQL Editor > Run. Sans danger si on la relance.

create table if not exists public.aide (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'guide' check (type in ('guide','video')),
  public text not null default 'vendeur' check (public in ('vendeur','client')),
  titre text not null check (length(titre) between 1 and 100),
  icone text not null default '💡' check (length(icone) <= 8),
  etapes jsonb not null default '[]'::jsonb check (jsonb_typeof(etapes) = 'array'),
  video_url text not null default '' check (length(video_url) <= 400),
  duree text not null default '' check (length(duree) <= 10),
  ordre int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.aide enable row level security;
drop policy if exists "aide: lecture" on public.aide;
create policy "aide: lecture" on public.aide for select using (actif or public.is_admin());
drop policy if exists "aide: admin" on public.aide;
create policy "aide: admin" on public.aide for all using (public.is_admin()) with check (public.is_admin());
grant select on public.aide to anon, authenticated;
grant insert, update, delete on public.aide to authenticated;

-- Guides de départ (ajoutés seulement si la table est vide)
insert into public.aide (public, titre, icone, ordre, etapes)
select x.p, x.t, x.i, x.o, x.e::jsonb from (values
 ('vendeur','Créer ma boutique','🏪',1,'["Sur l''accueil, touchez « Je suis vendeur ».","Créez votre compte avec votre numéro et un mot de passe.","Donnez le nom de la boutique, votre WhatsApp, votre ville et votre quartier.","C''est prêt : votre boutique a son propre lien."]'),
 ('vendeur','Ajouter un produit','📸',2,'["Vendeur → Produits → « + Ajouter un produit ».","Prenez une photo, écrivez le nom et le prix.","Choisissez le rayon, puis touchez « Enregistrer ». Le produit apparaît tout de suite."]'),
 ('vendeur','Partager mon lien sur WhatsApp','📲',3,'["Vendeur → touchez « Voir ma page ».","Touchez le bouton partager en haut pour copier le lien de la boutique.","Sur un produit, l''icône image crée une belle image pour votre statut.","Collez le lien sur votre statut WhatsApp, TikTok ou Facebook."]'),
 ('vendeur','Confirmer une vente et envoyer le reçu','✅',4,'["Vendeur → Commandes : les nouvelles commandes sont en orange.","Quand le client a payé, touchez « Confirmer la vente » : la caisse et le stock se mettent à jour.","Choisissez le paiement (Wave, Espèces… ou À crédit).","Touchez « Envoyer le reçu » : le client le reçoit sur WhatsApp."]'),
 ('vendeur','Suivre une livraison','🛵',5,'["Sur une vente confirmée, choisissez l''étape : Préparation, En route…","Écrivez le nom du livreur et l''heure d''arrivée prévue.","À la livraison, demandez au client son code à 4 chiffres et validez-le."]'),
 ('vendeur','Utiliser la caisse et le relevé','💰',6,'["Chaque vente confirmée s''ajoute seule dans la Caisse.","Ajoutez vos dépenses (transport, tissu…) pour voir votre vrai bénéfice.","« Relevé du mois » fait un PDF à garder ou à envoyer.","Dans Clients, « Relevé du client » montre ce qu''un client vous doit."]'),
 ('vendeur','Ajouter un point de vente ou un commercial','👥',7,'["Vendeur → Équipe.","Ajoutez vos magasins ou stands, puis « Placer sur la carte » en étant sur place.","Ajoutez un commercial : il reçoit son lien de vente et sa page pour suivre sa commission."]'),
 ('client','Commander un article','🛍',1,'["Choisissez un produit et touchez « + ».","Ouvrez le Panier, écrivez votre nom et votre numéro.","Touchez « Commander sur WhatsApp » : le message part tout prêt chez le vendeur."]'),
 ('client','Acheter en sécurité','🔒',2,'["Préférez le paiement à la livraison.","Avant de payer, vérifiez le numéro du vendeur dans « Achetez en sécurité ».","Donnez votre code de livraison seulement quand vous avez l''article en main."]'),
 ('client','Suivre ma commande','🚚',3,'["Touchez l''icône camion sur l''accueil.","Vous voyez chaque étape : confirmée, en préparation, en route, livrée.","Activez les alertes pour être prévenu à chaque étape."]'),
 ('client','Discuter avec une boutique','💬',4,'["Sur la page d''une boutique, touchez « Discuter ici avec la boutique ».","Écrivez votre question : le vendeur répond dans l''appli.","Vous retrouvez vos discussions dans « Mes discussions »."]')
) as x(p,t,i,o,e)
where not exists (select 1 from public.aide);
