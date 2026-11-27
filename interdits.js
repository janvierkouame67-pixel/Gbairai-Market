// Gbairai Market : produits interdits.
// Un produit dont le nom, la description, la catégorie ou les tailles contiennent un de ces mots est refusé
// (ici dans l'appli, et aussi dans la base Supabase par supabase/mise-a-jour-18.sql).
// L'admin peut changer la liste dans Admin › Catégories et quartiers › Produits interdits.
// Règles d'écriture d'un mot : les accents et majuscules ne comptent pas ; le pluriel (s ou x) est accepté tout seul ;
// une étoile à la fin veut dire « et tout ce qui commence par » (ex. antibio* = antibiotique, antibiotiques…).
window.GB_INTERDITS0=[
 {nom:'Médicaments',raison:'Les médicaments se vendent seulement en pharmacie, avec l\'autorisation de l\'AIRP (Autorité ivoirienne de régulation pharmaceutique).',
  mots:['médicament*','medoc*','antibio*','amoxicilline','ampicilline','augmentin','paracétamol','doliprane','efferalgan','ibuprofène','diclofénac','aspirine','tramadol','tafradol','codéine','morphine','valium','diazépam','rivotril','quinine','artésunate','artéméther','coartem','antipalud*','antidouleur*','anti douleur*','anti inflammatoire*','comprimé* de vitamine*','comprimé* pour','comprimé* contre','boîte de comprimé*','gélule*','injectable*','ampoule injectable','perfusion*','ordonnance*','vermifuge*','insuline','vaccin*','pilule*','contraceptif*','cytotec','misoprostol','abortif*','avortement','corticoïde*','dexaméthasone','anabolisant*','stéroïde*','hormone* de croissance','sirop contre la toux','sirop pour la toux']},
 {nom:'Produits « miracle », minceur et aphrodisiaques',raison:'Les produits qui promettent de soigner, de faire maigrir ou d\'augmenter la puissance sexuelle sont interdits sans autorisation de l\'AIRP.',
  mots:['aphrodisiaque*','viagra','sildénafil','cialis','tadalafil','puissance sexuelle','booster sexuel','stimulant sexuel','faiblesse sexuelle','érection','éjaculation*','pénis','grossir le pénis','agrandir les seins','grossir les seins','grossir les fesses','amaigrissant*','brûle graisse*','coupe faim','perte de poids','faire maigrir','maigrir vite','produit minceur','thé minceur','tisane minceur','miracle*','guérit','guérir','guérison','remède*','plante médicinale*','plantes médicinale*','tisane médicinale*','médecine traditionnelle','complément alimentaire*','compléments alimentaire*','complément sportif*','compléments sportif*','anti hémorroïde*','hémorroïde*']},
 {nom:'Produits éclaircissants dangereux',raison:'Les produits de dépigmentation dangereux sont interdits en Côte d\'Ivoire.',
  mots:['hydroquinone','mercure','clobétasol','dermovate','bétaméthasone','dépigmentant*','dépigmentation']},
 {nom:'Armes et explosifs',raison:'La vente d\'armes, de munitions et d\'explosifs est interdite.',
  mots:['arme à feu','armes à feu','arme blanche','revolver*','fusil','kalachnikov','kalach','ak47','munition*','balles réelles','explosif*','dynamite','gaz lacrymogène','taser*','pistolet automatique','pistolet à billes réelles']},
 {nom:'Drogue',raison:'La drogue et les produits stupéfiants sont interdits.',
  mots:['drogue','cannabis','marijuana','chanvre indien','cocaïne','héroïne','kush','stupéfiant*']},
 {nom:'Animaux protégés',raison:'La vente d\'animaux protégés, d\'ivoire et de peaux d\'animaux sauvages est interdite.',
  mots:['objet* en ivoire','bijou* en ivoire','statuette* en ivoire','ivoire d éléphant','défense* d éléphant','peau de léopard','peau de panthère','carapace de tortue','pangolin*','chimpanzé*','perroquet gris']},
 {nom:'Faux documents et comptes',raison:'Les faux documents, les puces enregistrées au nom d\'une autre personne et les comptes Mobile Money sont interdits.',
  mots:['faux papiers','faux billet*','fausse carte*','faux diplôme*','faux permis','puce enregistrée*','puces enregistrée*','carte sim enregistrée*','cartes sim enregistrée*','compte mobile money','compte orange money','compte mtn money','compte moov money','compte wave','compte momo']},
 {nom:'Contenus pour adultes',raison:'Les contenus pornographiques sont interdits.',
  mots:['porno*','sextape*']}
];
(function(){
  // Même règle que la fonction gb_norm de la base : minuscules, sans accents, tout ce qui n'est pas lettre ou chiffre devient un espace.
  const norm=(x,star)=>String(x||'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(star?/[^a-z0-9*]+/g:/[^a-z0-9]+/g,' ').trim();
  const motRe=m=>{const w=norm(m,true).split(' ').filter(Boolean).map(x=>x.endsWith('*')?x.replace(/\*+$/,'')+'[a-z0-9]*':x.replace(/\*/g,'')+'[sx]?');return w.length&&w.join('')?new RegExp('(^| )'+w.join(' ')+'( |$)'):null;};
  let key=null,comp=[];
  function compile(groups){if(groups===key)return comp;key=groups;comp=[];
    (Array.isArray(groups)?groups:[]).forEach(g=>{if(!g)return;(g.mots||[]).forEach(m=>{const re=motRe(m);if(re)comp.push({re,mot:String(m).replace(/\*/g,''),nom:g.nom||'',raison:g.raison||''});});});return comp;}
  // Renvoie {mot, nom, raison} si le texte contient un mot interdit, sinon null.
  window.GbInterdit=function(texte,groups){const t=norm(texte);if(!t)return null;const c=compile(groups||window.GB_INTERDITS0);for(const x of c)if(x.re.test(t))return x;return null;};
  window.GbInterditMsg=function(x){return x?'⛔ Produit interdit sur Gbairai Market (« '+x.mot+' »). '+x.raison:'';};
  window.GbNorm=norm;
})();
