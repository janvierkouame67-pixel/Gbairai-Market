# Gbairai Market

Plateforme des petites boutiques d'Abidjan : chaque vendeur a son lien de boutique, les clients remplissent un panier et commandent directement sur WhatsApp ou Telegram.

- **Clients** : accueil (recherche, quartiers, catégories), page boutique, page produit, panier → WhatsApp/Telegram.
- **Vendeurs** : création de boutique avec numéro + mot de passe, produits (photo, description, tailles, stock), stock, caisse (recettes et dépenses), commandes à confirmer, réglages, image pour le statut.
- **Administrateur** : tableau de bord, fiche vendeur complète, vérification, suspension, formules, mise en vedette, produits, commandes, catégories, quartiers, paramètres.

Site statique (HTML, CSS, JavaScript sans compilation) + Supabase (base de données, comptes, photos).

## Mise en route

1. **Supabase** : créez le projet, puis SQL Editor → New query → collez `supabase/schema.sql` → Run.
2. **Supabase → Authentication → Sign In / Providers → Email** : désactivez **Confirm email** (les vendeurs se connectent avec leur numéro, sans e-mail).
3. **config.js** : collez le *Project URL* et la clé *anon public* (Project Settings → API). Jamais la clé `service_role`.
4. **Vercel** : Add New → Project → importez le dépôt GitHub → Deploy (aucun réglage à changer).
5. **Devenir administrateur** : créez votre compte vendeur sur le site, puis dans Supabase SQL Editor :
   `update public.profiles set role = 'admin' where phone = '225XXXXXXXXXX';`

## Sécurité

- Les règles RLS de `schema.sql` empêchent un vendeur de modifier une autre boutique, de se vérifier lui-même ou de changer sa formule.
- Le numéro de CNI et les notes admin sont dans `shop_private`, jamais visibles du public.
- La limite de produits gratuits est vérifiée par la base de données.
