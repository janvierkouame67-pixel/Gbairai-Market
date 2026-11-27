/* Gbairai Market : les artisans du quotidien.
   Plombier, électricien, frigoriste… : trouver le plus proche, voir ses travaux en photos,
   photographier sa panne pour que l'IA trouve le bon métier.
   Un artisan est une boutique qui a un métier (shops.metier, mise-a-jour-17.sql).
   Ce fichier se branche après plus2.js : il complète window.GBX et utilise window.GB. */
(function(){
'use strict';
const G=()=>window.GB;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const fmt=n=>Math.round(n||0).toLocaleString('fr-FR').replace(/[  ]/g,' ');
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const toast=t=>{const g=G();if(g)g.toast(t);};
const rerender=()=>{const g=G();if(g)g.render(true);};
const Z={pos:null,q:'',ville:'',urg:false,panne:null};

/* ---------- Les métiers (même liste que la contrainte SQL) ---------- */
const METIERS=[
  ['plombier','🚰','Plombier','fuite eau robinet tuyau wc toilette douche lavabo evier chauffe-eau canalisation bouche'],
  ['electricien','💡','Électricien','courant electricite prise cable fil disjoncteur compteur lampe ampoule court-circuit cie installation'],
  ['frigoriste','❄️','Frigoriste / Clim','clim climatiseur climatisation frigo refrigerateur congelateur gaz froid'],
  ['macon','🧱','Maçon','mur fissure carrelage dalle ciment construction crepissage brique'],
  ['menuisier','🪚','Menuisier','porte bois lit armoire meuble placard table chaise'],
  ['peintre','🎨','Peintre','peinture mur facade decoration'],
  ['soudeur','🔩','Soudeur','soudure portail fer grille metal ferronnerie'],
  ['serrurier','🔑','Serrurier','serrure cle porte cadenas bloque'],
  ['vitrier','🪟','Vitrier / Alu','vitre fenetre verre aluminium alu miroir baie'],
  ['mecanicien','🚗','Mécanicien','voiture auto moteur panne vidange garage batterie pneu'],
  ['moto','🏍️','Réparateur moto','moto scooter motocyclette pneu chaine'],
  ['telephone','📱','Réparateur téléphone','telephone portable ecran batterie smartphone iphone samsung tablette'],
  ['antenne','📺','Antenne / TV','antenne television tele tv canal parabole decodeur'],
  ['couturier','🧵','Couturier','couture tailleur pagne habit retouche robe'],
  ['coiffure','✂️','Coiffure','coiffeur coiffeuse tresse barbier cheveux'],
  ['menage','🧹','Ménage','nettoyage menagere repassage linge'],
  ['gaz','🔥','Gaz à domicile','bouteille gaz butane recharge cuisine'],
  ['vidange','💧','Vidange fosse','fosse septique vidange camion puisard'],
];
const MET={};METIERS.forEach(m=>MET[m[0]]={id:m[0],ico:m[1],nom:m[2],mots:m[3]});
const metNom=id=>MET[id]?MET[id].nom:'Artisan';
const metIco=id=>MET[id]?MET[id].ico:'🛠️';
const metOpts=sel=>METIERS.map(m=>'<option value="'+m[0]+'"'+(m[0]===sel?' selected':'')+'>'+m[1]+' '+esc(m[2])+'</option>').join('');

/* ---------- Outils ---------- */
const shopOk=s=>s&&s.statut==='actif';
const artisans=met=>(G().S.shops||[]).filter(s=>shopOk(s)&&s.metier&&(!met||s.metier===met));
const dispoOn=s=>!!(s.dispo&&s.dispo_maj&&Date.now()-new Date(s.dispo_maj)<12*3600e3);
function note(s){const r=(G().S.reviews||[]).filter(x=>x.shop_id===s.id&&x.visible!==false);return {n:r.length,avg:r.length?r.reduce((a,x)=>a+(+x.note||0),0)/r.length:0};}
function posOf(s){if(s.lat!=null&&s.lng!=null)return {lat:+s.lat,lng:+s.lng};
  const P=(G().S.points||[]).filter(p=>p.shop_id===s.id&&p.lat!=null&&p.lng!=null);const p=P.find(x=>x.principal)||P[0];return p?{lat:+p.lat,lng:+p.lng}:null;}
function dist(a,b){const R=6371e3,r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r,x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
const dTxt=m=>m<1000?Math.round(m/10)*10+' m':(m/1000).toFixed(m<10000?1:0).replace('.',',')+' km';
function maPos(){if(Z.pos)return Z.pos;const p=LS('gbairai-mapos',null);if(p&&Date.now()-p.t<30*60e3){Z.pos={lat:p.lat,lng:p.lng};return Z.pos;}return null;}
function prendrePos(){G().geo(p=>{Z.pos=p;LSset('gbairai-mapos',{lat:p.lat,lng:p.lng,t:Date.now()});rerender();});}
const galerie=s=>(Array.isArray(s.galerie)?s.galerie:[]).filter(x=>x&&typeof x.u==='string'&&/^https:\/\//.test(x.u));

// Classer : disponibles d'abord (en urgence), puis par distance, puis par avis
function classer(L){const me=maPos();
  return L.map(s=>{const p=posOf(s),d=me&&p?dist(me,p):null,n=note(s);return {s,p,d,n,on:dispoOn(s)};})
    .sort((a,b)=>{if(Z.urg&&a.on!==b.on)return a.on?-1:1;if(a.d!=null&&b.d!=null)return a.d-b.d;if(a.d!=null)return -1;if(b.d!=null)return 1;if(a.on!==b.on)return a.on?-1:1;return b.n.avg*Math.min(b.n.n,10)-a.n.avg*Math.min(a.n.n,10);});}

function msgWa(s,extra){return 'Bonjour '+s.nom+', je vous ai trouvé sur Gbairai Market. J\'ai besoin d\'un '+metNom(s.metier).toLowerCase()+(extra?' : '+extra:'.')+' Êtes-vous disponible ?';}
function boutons(s,p,extra,photo){const g=G(),tel=String(s.telephone||s.whatsapp||'').replace(/[^\d+]/g,'');
  return '<div class="ar-btns">'+
    (photo?'<button type="button" class="btn btn-o btn-s" data-a="arEnvoyer" data-id="'+s.id+'">📤 Envoyer ma photo</button>':'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+g.waNum(s.whatsapp)+'?text='+encodeURIComponent(msgWa(s,extra))+'">'+g.ic('wa',15,'#fff')+'WhatsApp</a>')+
    (tel?'<a class="btn btn-w btn-s" href="tel:'+esc(tel)+'">📞 Appeler</a>':'')+
    (p?'<a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+p.lat+','+p.lng+'">🧭 Y aller</a>':'')+'</div>';}

function carte(x,opt){opt=opt||{};const g=G(),s=x.s,G3=galerie(s).slice(0,3);
  return '<div class="card ar-card"><a class="row ar-head" href="#boutique-'+esc(s.slug)+'">'+g.avatar(s,48)+'<div class="grow" style="min-width:0"><b class="ell">'+esc(s.nom)+'</b>'+g.verifBadge(s)+
    '<div class="small muted">'+metIco(s.metier)+' '+esc(metNom(s.metier))+(x.d!=null?' · à <b class="ar-km">'+dTxt(x.d)+'</b>':' · '+esc(g.place(s)))+'</div>'+
    '<div class="small">'+(x.n.n?'⭐ '+x.n.avg.toFixed(1).replace('.',',')+' <span class="muted">('+x.n.n+' avis)</span> · ':'')+(x.on?'<span class="ar-on">● Disponible maintenant</span>':'<span class="muted">Pas disponible pour l\'instant</span>')+(s.urgence?' · <span class="ar-urg">🚨 Urgences</span>':'')+'</div>'+
    (s.deplacement!=null?'<div class="small muted">Déplacement : <b>'+(s.deplacement?fmt(s.deplacement)+' F':'gratuit')+'</b></div>':'')+'</div></a>'+
    (G3.length?'<div class="ar-gal3">'+G3.map(p=>'<a href="#boutique-'+esc(s.slug)+'"><img src="'+esc(p.u)+'" alt="'+esc(p.t||'Travail réalisé')+'" loading="lazy"></a>').join('')+'</div>':'')+
    boutons(s,x.p,opt.extra,opt.photo)+'</div>';}

function radar(L){const me=maPos();if(!me)return '';const P=L.filter(x=>x.d!=null).slice(0,12);if(!P.length)return '';
  const far=Math.max(1500,Math.min(30000,P[Math.min(P.length-1,9)].d));
  const dots=P.map((x,i)=>{const ang=Math.atan2(x.p.lat-me.lat,(x.p.lng-me.lng)*Math.cos(me.lat*Math.PI/180)),r=Math.min(1,Math.sqrt(x.d/far))*44,cx=50+r*Math.cos(ang),cy=50-r*Math.sin(ang);
    return '<a href="#boutique-'+esc(x.s.slug)+'"><circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="3.4" fill="'+(x.on?'#0E7A5F':'#8B5CF6')+'" stroke="#fff" stroke-width="1"/><text x="'+cx.toFixed(1)+'" y="'+(cy-5).toFixed(1)+'" font-size="3.6" text-anchor="middle" font-weight="700" fill="#1B1033">'+esc(x.s.nom.slice(0,14))+'</text></a>';}).join('');
  return '<div class="card mg-radar"><svg viewBox="0 0 100 100" role="img" aria-label="Carte des artisans autour de vous"><circle cx="50" cy="50" r="44" fill="#EEF5E8"/><circle cx="50" cy="50" r="29" fill="none" stroke="#C9DDBD" stroke-dasharray="1.5 1.5"/><circle cx="50" cy="50" r="15" fill="none" stroke="#C9DDBD" stroke-dasharray="1.5 1.5"/>'+dots+'<circle cx="50" cy="50" r="3" fill="#3B82F6" stroke="#fff" stroke-width="1.2"/></svg><span class="small muted">🟢 disponible maintenant · cercle extérieur ≈ '+dTxt(far)+'</span></div>';}

function posBandeau(){return maPos()?'':'<div class="card row ar-posband"><span style="font-size:26px">📍</span><div class="grow small"><b>Voir les plus proches de vous</b><br><span class="muted">Votre position reste sur votre téléphone.</span></div><button type="button" class="btn btn-v btn-s" data-a="arPos">Ma position</button></div>';}
const photoBtn=(txt,cls)=>'<label class="'+(cls||'btn btn-o btn-s')+'">📷 '+txt+'<input type="file" accept="image/*" data-ar="panne" hidden></label>';

/* ---------- Page « Services du quotidien » ---------- */
function vServices(){
  const g=G(),A=artisans(),nb={};A.forEach(s=>nb[s.metier]=(nb[s.metier]||0)+1);const nOn=A.filter(s=>dispoOn(s)&&s.urgence).length;
  let h='<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">🛠️ Services du quotidien</h1></div>'+
  '<p class="small muted" style="margin:0">Plombier, électricien, clim… les artisans de toute la Côte d\'Ivoire, avec les photos de leur travail.</p>'+
  '<form class="row ar-search" data-f="arCherche"><input class="in" name="q" type="search" placeholder="Fuite d\'eau, clim, prise…" value="'+esc(Z.q)+'" autocomplete="off"><button class="btn btn-v btn-s" type="submit">Chercher</button></form>'+
  '<div class="card row ar-photo"><span style="font-size:30px">📷</span><div class="grow small"><b>Photographiez la panne</b><br><span class="muted">L\'IA trouve le bon artisan pour vous.</span></div>'+photoBtn('Photo')+'</div>'+
  '<a class="card row ar-urgence" href="#services-urgence"><span style="font-size:26px">🚨</span><div class="grow"><b>Urgence ?</b><div class="small">Fuite, court-circuit, odeur de gaz : '+(nOn?'<b>'+nOn+'</b> artisan'+(nOn>1?'s':'')+' disponible'+(nOn>1?'s':'')+' maintenant':'les artisans qui acceptent les urgences')+'</div></div><span>›</span></a>';
  if(Z.q){const t=norm(Z.q).split(/\s+/).filter(w=>w.length>2);
    const M=METIERS.filter(m=>t.some(w=>norm(m[2]+' '+m[3]).includes(w)||norm(m[2]).includes(norm(Z.q))));
    h+='<div class="sec-title"><h2>Pour « '+esc(Z.q)+' »</h2></div>'+(M.length?'<div class="ar-grid">'+M.map(m=>tuile(m,nb)).join('')+'</div>':'<p class="muted small">Aucun métier trouvé. Essayez un autre mot ou choisissez ci-dessous.</p>');}
  h+='<div class="sec-title"><h2>Tous les métiers</h2><span class="cnt-pill">'+A.length+' artisan'+(A.length>1?'s':'')+'</span></div><div class="ar-grid">'+METIERS.map(m=>tuile(m,nb)).join('')+'</div>'+
  '<div class="card stack ar-join"><b>Vous êtes artisan ?</b><span class="small muted">Créez votre page gratuite : vos clients du quartier vous trouvent, voient vos travaux et vous écrivent sur WhatsApp.</span><a class="btn btn-o btn-s" href="#vendeur" style="align-self:flex-start">Je m\'inscris comme artisan</a></div></div>';
  return h;
}
const tuile=(m,nb)=>'<a class="ar-tile" href="#services-'+m[0]+'"><span>'+m[1]+'</span><b>'+esc(m[2])+'</b><small>'+(nb[m[0]]?nb[m[0]]+' inscrit'+(nb[m[0]]>1?'s':''):'Bientôt')+'</small></a>';

/* ---------- Liste d'un métier (ou des urgences) ---------- */
function vListe(met){
  const g=G(),urg=met==='urgence';if(!urg&&!MET[met])return null;
  const keep=Z.urg;if(urg)Z.urg=true;
  let A=urg?artisans().filter(s=>s.urgence):artisans(met);
  const villes=[...new Set(A.map(s=>g.villeOf(s)))].sort();
  if(Z.ville&&!maPos())A=A.filter(s=>g.villeOf(s)===Z.ville);
  const L=classer(A);if(urg)Z.urg=keep;
  const nOn=L.filter(x=>x.on).length,titre=urg?'🚨 Urgences':metIco(met)+' '+metNom(met)+(met==='gaz'||met==='menage'||met==='vidange'||met==='coiffure'?'':'s')+' près de moi';
  let h='<div class="wrap"><div class="row">'+g.back('#services')+'<h1 style="font-size:20px">'+esc(titre)+'</h1></div>'+
    '<div class="small muted">'+L.length+' trouvé'+(L.length>1?'s':'')+' · <span class="ar-on">'+nOn+' disponible'+(nOn>1?'s':'')+' maintenant</span></div>';
  if(urg)h+='<div class="note small">En cas de danger (feu, odeur forte de gaz, fils électriques dans l\'eau) : coupez le compteur ou le gaz, sortez, et appelez les pompiers au <b>180</b>.</div>';
  h+=posBandeau();
  if(!maPos()&&villes.length>1)h+='<label class="lbl">Ville<select class="in" data-ar2="ville"><option value="">Toutes les villes</option>'+villes.map(v=>'<option'+(v===Z.ville?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';
  if(!urg)h+='<label class="row small ar-chk"><input type="checkbox" data-ar2="urg"'+(Z.urg?' checked':'')+'> Disponibles maintenant d\'abord</label>';
  h+=radar(L);
  if(!L.length)return h+'<div class="card stack" style="text-align:center"><span style="font-size:40px">'+(urg?'🚨':metIco(met))+'</span><b>Pas encore d\'artisan ici</b><span class="small muted">Vous connaissez un bon '+esc(urg?'artisan':metNom(met).toLowerCase())+' ? Partagez-lui Gbairai Market : son inscription est gratuite.</span><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('Inscris-toi gratuitement sur Gbairai Market : les clients de ton quartier te trouvent et t\'écrivent sur WhatsApp. '+location.origin+'/#vendeur')+'" style="align-self:center">'+g.ic('wa',15,'#fff')+'Inviter un artisan</a></div></div>';
  return h+L.slice(0,60).map(x=>carte(x)).join('')+'</div>';
}

/* ---------- Photographiez la panne ---------- */
async function pannePhoto(file){
  const g=G();let r;try{r=await g.resizePhoto(file,900);}catch(e){return toast('Impossible de lire cette photo');}
  Z.panne={url:r.url,blob:r.blob,state:'load'};if(location.hash!=='#panne')location.hash='panne';else rerender();
  try{const b64=await new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(f.result);f.onerror=rej;f.readAsDataURL(r.blob);});
    const d=await ia('panne',{image:b64,metiers:METIERS.map(m=>m[0])});Object.assign(Z.panne,{state:'ok',d,met:MET[d.metier]?d.metier:null});}
  catch(e){Z.panne.state='err';Z.panne.err=e&&e.message==='IA_OFF'?'L\'IA n\'est pas encore activée sur le site.':(e&&e.message)||'Erreur';}
  rerender();
}
async function ia(kind,body){
  const g=G(),h={'Content-Type':'application/json'};if(g.S.token)h.Authorization='Bearer '+g.S.token;
  let r;try{r=await fetch('/api/ia',{method:'POST',headers:h,body:JSON.stringify(Object.assign({kind},body))});}catch(e){throw new Error('Pas de connexion internet');}
  let j={};try{j=await r.json();}catch(e){}
  if(j.cle===false)throw new Error('IA_OFF');
  if(!r.ok||!j.ok)throw new Error(j.error||'L\'IA ne répond pas pour le moment');
  return j.data;
}
function vPanne(){
  const g=G(),P=Z.panne;
  let h='<div class="wrap"><div class="row">'+g.back('#services')+'<h1 style="font-size:20px">📷 Photographiez la panne</h1></div>';
  if(!P)return h+'<label class="card mg-drop"><span style="font-size:44px">📷</span><b>Prenez en photo votre problème</b><span class="small muted">Un robinet qui fuit, une prise brûlée, la clim qui coule, une serrure cassée… L\'IA vous dit quel artisan appeler et vous montre les plus proches.</span><input type="file" accept="image/*" data-ar="panne" hidden></label></div>';
  h+='<div class="card row ar-pimg"><img src="'+esc(P.url)+'" alt="Votre photo"><div class="stack grow" style="gap:4px;min-width:0">';
  if(P.state==='load')return h+'<b>✨ L\'IA regarde votre photo…</b><span class="small muted">Quelques secondes</span></div></div></div>';
  if(P.state==='err'||!P.met){
    h+='<b>'+(P.state==='err'?'Je n\'ai pas pu analyser la photo':'Je ne suis pas sûr du métier')+'</b><span class="small muted">'+esc(P.err||'Choisissez vous-même ci-dessous.')+'</span>'+photoBtn('Autre photo','small ar-link')+'</div></div>';
    return h+'<div class="sec-title"><h2>De quel artisan avez-vous besoin ?</h2></div><div class="ar-grid">'+METIERS.map(m=>'<button type="button" class="ar-tile" data-a="arChoix" data-id="'+m[0]+'"><span>'+m[1]+'</span><b>'+esc(m[2])+'</b></button>').join('')+'</div></div>';}
  const d=P.d||{};
  h+='<b>🤖 '+esc(d.resume||'Photo analysée')+'</b><span class="small">Il vous faut un <b>'+esc(metNom(P.met).toLowerCase())+'</b>.</span>'+photoBtn('Autre photo','small ar-link')+'</div></div>';
  if(d.urgent)h+='<div class="card ar-urgence"><b>🚨 Ça semble urgent</b>'+(d.conseil?'<div class="small">En attendant : '+esc(d.conseil)+'</div>':'')+'</div>';
  else if(d.conseil)h+='<div class="note small">💡 '+esc(d.conseil)+'</div>';
  const save=Z.urg;Z.urg=!!d.urgent;const L=classer(artisans(P.met));Z.urg=save;
  h+=posBandeau()+'<div class="sec-title"><h2>'+metIco(P.met)+' Les plus proches</h2><span class="cnt-pill">'+L.length+'</span></div>';
  if(!L.length)return h+'<div class="card stack"><span class="small muted">Pas encore de '+esc(metNom(P.met).toLowerCase())+' inscrit. Choisissez un autre métier ou revenez bientôt.</span><a class="btn btn-w btn-s" href="#services" style="align-self:flex-start">Tous les métiers</a></div></div>';
  return h+'<p class="small muted" style="margin:0">Touchez « Envoyer ma photo » : l\'artisan voit le problème avant de venir.</p>'+L.slice(0,8).map(x=>carte(x,{photo:true,extra:d.resume})).join('')+'<a class="btn btn-w btn-block" href="#services-'+P.met+'">Voir tous les '+esc(metNom(P.met).toLowerCase())+'s</a></div>';
}
async function envoyer(id){
  const g=G(),s=g.shopById(id),P=Z.panne;if(!s||!P)return;
  const txt=msgWa(s,P.d&&P.d.resume)+' Voici la photo du problème.';
  try{const f=new File([P.blob],'probleme.jpg',{type:'image/jpeg'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:txt});return;}}catch(e){if(e&&e.name==='AbortError')return;}
  window.open('https://wa.me/'+g.waNum(s.whatsapp)+'?text='+encodeURIComponent(txt),'_blank','noopener');
  toast('Dans WhatsApp, joignez la photo avec 📎');
}

/* ---------- Page d'un artisan (dans sa boutique) ---------- */
function boutiqueArtisan(s){
  if(!s||!s.metier)return '';const on=dispoOn(s),p=posOf(s),me=maPos(),Gal=galerie(s);
  return '<section class="card stack ar-fiche"><div class="row between wrapx" style="gap:6px"><b style="font-size:16px">'+metIco(s.metier)+' '+esc(metNom(s.metier))+'</b>'+(on?'<span class="badge ar-badge-on">● Disponible maintenant</span>':'<span class="badge">Pas disponible pour l\'instant</span>')+'</div>'+
    '<div class="small muted">'+(s.urgence?'🚨 Accepte les urgences · ':'')+(s.deplacement!=null?'Déplacement : <b>'+(s.deplacement?fmt(s.deplacement)+' F':'gratuit')+'</b>':'Prix à discuter sur WhatsApp')+(me&&p?' · à <b>'+dTxt(dist(me,p))+'</b>':'')+'</div>'+
    boutons(s,p)+(Gal.length?'<b>📸 Ses travaux</b><div class="ar-galerie">'+Gal.map(x=>'<a href="'+esc(x.u)+'" target="_blank" rel="noopener"><img src="'+esc(x.u)+'" alt="'+esc(x.t||'Travail réalisé')+'" loading="lazy"></a>').join('')+'</div>':'')+'</section>';
}

/* ---------- Espace de l'artisan ---------- */
function espaceArtisan(s){
  if(!s||!s.metier)return '';const on=dispoOn(s),Gal=galerie(s),hasPos=s.lat!=null&&s.lng!=null;
  return '<section class="card stack ar-espace"><div class="row between"><b style="font-size:16px">'+metIco(s.metier)+' Mon activité d\'artisan</b><a class="small" href="#services-'+s.metier+'">Voir comme un client ›</a></div>'+
    '<button type="button" class="ar-dispo'+(on?' on':'')+'" data-a="arDispo"><span class="ar-sw"></span><span><b>'+(on?'Je suis disponible':'Je ne suis pas disponible')+'</b><small>'+(on?'Les clients vous voient en premier. S\'éteint seul après 12 h.':'Touchez quand vous êtes libre pour un travail')+'</small></span></button>'+
    '<label class="row small ar-chk"><input type="checkbox" data-ar2="urgence"'+(s.urgence?' checked':'')+'> J\'accepte les urgences (fuite, panne de courant…)</label>'+
    '<form class="stack" data-f="arInfos" style="gap:8px"><div class="grid2"><label class="lbl">Métier<select class="in" name="metier">'+metOpts(s.metier)+'</select></label>'+
    '<label class="lbl">Prix du déplacement (F)<input class="in" name="deplacement" inputmode="numeric" placeholder="Vide = à discuter" value="'+(s.deplacement!=null?s.deplacement:'')+'"></label></div>'+
    '<button class="btn btn-w btn-s" type="submit" style="align-self:flex-start">Enregistrer</button></form>'+
    '<div class="row" style="gap:10px"><span style="font-size:22px">📍</span><div class="grow small">'+(hasPos?'<b>Position enregistrée ✔</b><br><span class="muted">À environ 100 m près. Refaites-le si vous changez d\'atelier.</span>':'<b>Ajoutez votre position</b><br><span class="muted">Sans elle, vous n\'apparaissez pas dans « près de moi ». Faites-le depuis votre atelier ou votre quartier.</span>')+'</div><button type="button" class="btn '+(hasPos?'btn-w':'btn-v')+' btn-s" data-a="arMaPos">'+(hasPos?'Mettre à jour':'Ma position')+'</button></div>'+
    '<b>📸 Photos de mes travaux ('+Gal.length+'/12)</b><span class="small muted">Montrez vos plus beaux chantiers, avant et après : c\'est ce qui donne confiance aux clients.</span>'+
    '<div class="ar-galerie">'+Gal.map((x,i)=>'<span class="ar-gi"><img src="'+esc(x.u)+'" alt="" loading="lazy"><button type="button" data-a="arGalDel" data-id="'+i+'" aria-label="Retirer cette photo">✕</button></span>').join('')+
    (Gal.length<12?'<label class="ar-add">＋<small>Ajouter</small><input type="file" accept="image/*" data-ar="gal" hidden></label>':'')+'</div></section>';
}
function devenirArtisan(s){
  if(!s||s.metier)return s&&s.metier?'<section class="card row" style="gap:10px"><span class="grow small">🛠️ Vous êtes inscrit comme <b>'+esc(metNom(s.metier).toLowerCase())+'</b>.</span><button type="button" class="btn btn-w btn-s" data-a="arQuitter">Ne plus être artisan</button></section>':'';
  return '<form class="card stack" data-f="arDevenir"><b>🛠️ Vous êtes artisan ?</b><span class="small muted">Plombier, électricien, coiffeuse… Choisissez votre métier : vous apparaissez dans « Services du quotidien » et les clients proches vous trouvent.</span><select class="in" name="metier">'+metOpts('')+'</select><button class="btn btn-o btn-s" type="submit" style="align-self:flex-start">Je suis artisan</button></form>';
}
function signupExtra(){
  return '<label class="lbl">Je suis…<select class="in" name="metier"><option value="">🛍️ Une boutique (je vends des articles)</option><optgroup label="Un artisan / un service">'+metOpts('')+'</optgroup></select></label>';
}
const maj=(ch,msg)=>{const g=G(),s=g.myShop();if(!s)return;g.act(()=>g.q(g.sb.from('shops').update(ch).eq('id',s.id)),msg);};
async function galAjout(file){
  const g=G(),s=g.myShop();if(!s)return;const L=galerie(s);if(L.length>=12)return toast('12 photos au maximum');
  let r;try{r=await g.resizePhoto(file,1000);}catch(e){return toast('Impossible de lire cette photo');}
  g.act(async()=>{const u=await g.uploadPhoto(r.blob);await g.q(g.sb.from('shops').update({galerie:L.concat([{u,t:''}])}).eq('id',s.id));},'📸 Photo ajoutée');
}

/* ---------- Accueil : la rangée des métiers ---------- */
function homeArtisans(){
  const A=artisans(),on=A.filter(dispoOn).length;
  return '<section class="ar-home"><div class="row between"><b>🛠️ Services du quotidien</b><a class="small" href="#services">Tout voir ›</a></div>'+
  '<div class="ar-strip">'+METIERS.slice(0,8).map(m=>'<a href="#services-'+m[0]+'"><span>'+m[1]+'</span>'+esc(m[2].split(' /')[0])+'</a>').join('')+
  '<label class="ar-strip-cam"><span>📷</span>Ma panne<input type="file" accept="image/*" data-ar="panne" hidden></label></div>'+
  (on?'<div class="small ar-on" style="margin-top:6px">● '+on+' artisan'+(on>1?'s':'')+' disponible'+(on>1?'s':'')+' maintenant</div>':'')+'</section>';
}

/* ---------- Branchement ---------- */
function brancher(){
  const g=G(),X=window.GBX;if(!g||!X||Z.ok)return false;Z.ok=true;
  const wrap=(k,f)=>{const old=X[k];X[k]=function(){return f(old?old.apply(null,arguments):'',...arguments);};};
  wrap('home',h=>h+homeArtisans());
  wrap('boutique',(h,s)=>boutiqueArtisan(s)+h);
  wrap('route',(h,r)=>{if(h!=null&&h!=='')return h;if(r==='services')return vServices();if(r==='panne')return vPanne();if(r.startsWith('services-'))return vListe(r.slice(9));return null;});
  X.vAccueil=s=>espaceArtisan(s);
  X.vReglages=s=>devenirArtisan(s);
  X.signupExtra=()=>signupExtra();
  Object.assign(g.A,{
    arPos:()=>prendrePos(),
    arDispo:()=>{const s=g.myShop();if(s)maj({dispo:!dispoOn(s)},dispoOn(s)?'Vous n\'êtes plus disponible':'✔ Les clients voient que vous êtes disponible');},
    arMaPos:()=>g.geo(p=>maj({lat:Math.round(p.lat*1000)/1000,lng:Math.round(p.lng*1000)/1000},'📍 Position enregistrée')),
    arGalDel:t=>{const s=g.myShop();if(!s)return;const L=galerie(s).slice();L.splice(+t.dataset.id,1);maj({galerie:L},'Photo retirée');},
    arQuitter:()=>maj({metier:null,dispo:false},'Vous n\'êtes plus dans les artisans'),
    arChoix:t=>{if(Z.panne){Z.panne.met=t.dataset.id;Z.panne.state='ok';Z.panne.d=Z.panne.d||{};rerender();}},
    arEnvoyer:t=>envoyer(t.dataset.id),
  });
  Object.assign(g.FORMS,{
    arCherche:d=>{Z.q=String(d.q||'').trim().slice(0,60);const t=norm(Z.q);const m=METIERS.find(x=>norm(x[2])===t||x[0]===t);if(m){Z.q='';location.hash='services-'+m[0];return;}rerender();},
    arInfos:d=>{const v=String(d.deplacement||'').replace(/\D/g,''),dep=v===''?null:Math.min(100000,parseInt(v,10));if(!MET[d.metier])return toast('Choisissez un métier');maj({metier:d.metier,deplacement:dep},'Enregistré ✔');},
    arDevenir:d=>{if(!MET[d.metier])return toast('Choisissez un métier');maj({metier:d.metier},'🛠️ Vous êtes maintenant dans les artisans. Ajoutez votre position et vos photos dans Accueil.');},
  });
  return true;
}
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset)return;
  if(t.dataset.ar&&t.files&&t.files[0]){const f=t.files[0];t.value='';if(t.dataset.ar==='panne')pannePhoto(f);else if(t.dataset.ar==='gal')galAjout(f);return;}
  const k=t.dataset.ar2;if(!k)return;
  if(k==='ville'){Z.ville=t.value;rerender();}
  else if(k==='urg'){Z.urg=t.checked;rerender();}
  else if(k==='urgence')maj({urgence:t.checked},t.checked?'🚨 Vous recevez les urgences':'Urgences désactivées');
});
function demarrer(){if(!brancher())return false;const g=G();if(g.S.loaded)g.render(true);return true;}
const t=setInterval(()=>{if(window.GB&&window.GBX&&window.GBX.route&&demarrer())clearInterval(t);},150);
})();
