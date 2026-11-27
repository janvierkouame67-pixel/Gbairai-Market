-- Gbairai Market : mise à jour 18 « Produits interdits »
-- La base refuse d'enregistrer un produit interdit (médicaments, produits « miracle », amaigrissants,
-- aphrodisiaques, armes, drogue…), même si quelqu'un passe à côté de l'appli.
-- La liste est dans settings.interdits ; l'admin la change dans Admin › Catégories et quartiers › Produits interdits.
-- À coller dans Supabase › SQL Editor, puis « Run ». On peut le relancer sans risque.

alter table public.settings add column if not exists interdits jsonb;
update public.settings set interdits = '[{"nom":"Médicaments","raison":"Les médicaments se vendent seulement en pharmacie, avec l''autorisation de l''AIRP (Autorité ivoirienne de régulation pharmaceutique).","mots":["médicament*","medoc*","antibio*","amoxicilline","ampicilline","augmentin","paracétamol","doliprane","efferalgan","ibuprofène","diclofénac","aspirine","tramadol","tafradol","codéine","morphine","valium","diazépam","rivotril","quinine","artésunate","artéméther","coartem","antipalud*","antidouleur*","anti douleur*","anti inflammatoire*","comprimé* de vitamine*","comprimé* pour","comprimé* contre","boîte de comprimé*","gélule*","injectable*","ampoule injectable","perfusion*","ordonnance*","vermifuge*","insuline","vaccin*","pilule*","contraceptif*","cytotec","misoprostol","abortif*","avortement","corticoïde*","dexaméthasone","anabolisant*","stéroïde*","hormone* de croissance","sirop contre la toux","sirop pour la toux"]},{"nom":"Produits « miracle », minceur et aphrodisiaques","raison":"Les produits qui promettent de soigner, de faire maigrir ou d''augmenter la puissance sexuelle sont interdits sans autorisation de l''AIRP.","mots":["aphrodisiaque*","viagra","sildénafil","cialis","tadalafil","puissance sexuelle","booster sexuel","stimulant sexuel","faiblesse sexuelle","érection","éjaculation*","pénis","grossir le pénis","agrandir les seins","grossir les seins","grossir les fesses","amaigrissant*","brûle graisse*","coupe faim","perte de poids","faire maigrir","maigrir vite","produit minceur","thé minceur","tisane minceur","miracle*","guérit","guérir","guérison","remède*","plante médicinale*","plantes médicinale*","tisane médicinale*","médecine traditionnelle","complément alimentaire*","compléments alimentaire*","complément sportif*","compléments sportif*","anti hémorroïde*","hémorroïde*"]},{"nom":"Produits éclaircissants dangereux","raison":"Les produits de dépigmentation dangereux sont interdits en Côte d''Ivoire.","mots":["hydroquinone","mercure","clobétasol","dermovate","bétaméthasone","dépigmentant*","dépigmentation"]},{"nom":"Armes et explosifs","raison":"La vente d''armes, de munitions et d''explosifs est interdite.","mots":["arme à feu","armes à feu","arme blanche","revolver*","fusil","kalachnikov","kalach","ak47","munition*","balles réelles","explosif*","dynamite","gaz lacrymogène","taser*","pistolet automatique","pistolet à billes réelles"]},{"nom":"Drogue","raison":"La drogue et les produits stupéfiants sont interdits.","mots":["drogue","cannabis","marijuana","chanvre indien","cocaïne","héroïne","kush","stupéfiant*"]},{"nom":"Animaux protégés","raison":"La vente d''animaux protégés, d''ivoire et de peaux d''animaux sauvages est interdite.","mots":["objet* en ivoire","bijou* en ivoire","statuette* en ivoire","ivoire d éléphant","défense* d éléphant","peau de léopard","peau de panthère","carapace de tortue","pangolin*","chimpanzé*","perroquet gris"]},{"nom":"Faux documents et comptes","raison":"Les faux documents, les puces enregistrées au nom d''une autre personne et les comptes Mobile Money sont interdits.","mots":["faux papiers","faux billet*","fausse carte*","faux diplôme*","faux permis","puce enregistrée*","puces enregistrée*","carte sim enregistrée*","cartes sim enregistrée*","compte mobile money","compte orange money","compte mtn money","compte moov money","compte wave","compte momo"]},{"nom":"Contenus pour adultes","raison":"Les contenus pornographiques sont interdits.","mots":["porno*","sextape*"]}]'::jsonb where id = 1 and (interdits is null or jsonb_typeof(interdits) <> 'array' or jsonb_array_length(interdits) = 0);
alter table public.settings drop constraint if exists settings_interdits_ok;
alter table public.settings add constraint settings_interdits_ok check (interdits is null or (jsonb_typeof(interdits) = 'array' and length(interdits::text) <= 40000));

-- Texte simplifié : minuscules, sans accents, tout ce qui n'est pas lettre ou chiffre devient un espace (comme dans interdits.js).
create or replace function public.gb_norm(t text, etoile boolean default false) returns text
language sql immutable as $$
  select btrim(regexp_replace(
    translate(replace(replace(lower(coalesce(t, '')), 'œ', 'oe'), 'æ', 'ae'),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
      'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuy'),
    case when etoile then '[^a-z0-9*]+' else '[^a-z0-9]+' end, ' ', 'g'))
$$;

-- Un mot de la liste devient une règle : pluriel s/x accepté, « * » à la fin = tout ce qui commence par.
create or replace function public.gb_mot_re(m text) returns text
language sql immutable as $$
  select case when x = '' then null else '(^| )' || x || '( |$)' end
  from (select coalesce(string_agg(
      case when w like '%*' then regexp_replace(w, '\*+$', '') || '[a-z0-9]*' else replace(w, '*', '') || '[sx]?' end,
      ' ' order by n), '') as x
    from regexp_split_to_table(public.gb_norm(m, true), ' ') with ordinality as s(w, n)
    where w <> '' and w <> '*') z
$$;

-- Renvoie le message d'erreur si le texte contient un mot interdit, sinon null.
create or replace function public.produit_interdit(txt text) returns text
language plpgsql stable security definer set search_path = public as $$
declare t text := public.gb_norm(txt); g jsonb; m text; re text; lst jsonb;
begin
  if t = '' then return null; end if;
  select interdits into lst from settings where id = 1;
  if lst is null or jsonb_typeof(lst) <> 'array' then return null; end if;
  for g in select * from jsonb_array_elements(lst) loop
    if jsonb_typeof(g -> 'mots') <> 'array' then continue; end if;
    for m in select * from jsonb_array_elements_text(g -> 'mots') loop
      re := public.gb_mot_re(m);
      if re is not null and t ~ re then
        return '⛔ Produit interdit sur Gbairai Market (« ' || replace(m, '*', '') || ' »). ' || coalesce(g ->> 'raison', '');
      end if;
    end loop;
  end loop;
  return null;
end; $$;

create or replace function public.products_interdits() returns trigger
language plpgsql as $$
declare msg text;
begin
  -- On vérifie à la création, quand le texte change, ou quand on remet en ligne un produit masqué.
  if tg_op = 'UPDATE' and new.nom is not distinct from old.nom and new.description is not distinct from old.description
     and new.type is not distinct from old.type and new.tailles is not distinct from old.tailles
     and not (new.visible and not old.visible) then
    return new;
  end if;
  msg := public.produit_interdit(concat_ws(' ', new.nom, new.description, new.type, new.tailles));
  if msg is not null then raise exception '%', msg using errcode = 'P0001'; end if;
  return new;
end; $$;
drop trigger if exists products_interdits on public.products;
create trigger products_interdits before insert or update on public.products
for each row execute function public.products_interdits();

-- Les produits interdits déjà en ligne sont masqués (le vendeur peut les modifier ou les supprimer).
update public.products set visible = false
where visible and public.produit_interdit(concat_ws(' ', nom, description, type, tailles)) is not null;

-- Pour voir lesquels : select nom, public.produit_interdit(concat_ws(' ', nom, description, type, tailles)) from public.products where public.produit_interdit(concat_ws(' ', nom, description, type, tailles)) is not null;
