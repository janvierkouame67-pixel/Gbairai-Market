/* Gbairai Market : notifications promo (comme « -20 % sur tout » sur l'écran du téléphone).
   - Vendeur : Espace vendeur › 📣 Promos → ses abonnés (1 par jour, 3 par semaine)
   - Admin : Admin › 🔔 Promos → clients, vendeurs ou tout le monde, avec une boutique mise en avant
   - Envoi tout de suite ou programmé ; annulable tant qu'il n'est pas parti ; nombre d'ouvertures
   Ce fichier se branche après app.js et utilise window.GB (outils de l'appli). */
(function(){
'use strict';
const G=()=>window.GB;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P={titre:'',texte:'',img:'',up:null,lien:'',cible:'clients',shop:'',quand:'now',date:'',res:'',busy:false};
const IDEES=['-20 % sur tout','Livraison gratuite aujourd\'hui','Nouveautés arrivées 🔥','Dernières pièces','Prix cassés ce week-end'];
const iso=d=>{const x=new Date(d);return isNaN(x)?null:x;};
const quand=d=>{const x=new Date(d);return x.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})+' à '+x.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});};
const localInput=d=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return x.toISOString().slice(0,16);};

function shopFor(admin){const g=G();return admin?(P.shop?g.shopById(P.shop):null):g.myShop();}
function images(s){const g=G();const L=[];if(s&&s.logo)L.push({u:s.logo,l:'Logo',lien:''});
  if(s)g.shopProducts(s.id).filter(p=>p.photo&&p.visible!==false&&p.stock>0).slice(0,10).forEach(p=>L.push({u:p.photo,l:p.nom,lien:'#produit-'+p.id}));
  if(P.up)L.push({u:P.up,l:'Ma photo',lien:''});return L;}

/* Aperçu : comme sur l'écran verrouillé d'un téléphone Android */
function apercu(s){const g=G();const nom=(g.S.settings&&g.S.settings.nom)||'Gbairai Market';
  const titre=P.titre||'-20 % sur tout',texte=P.texte||(s?'Venez voir les nouveautés de '+s.nom+' et faites-vous plaisir à petit prix.':'Les meilleures boutiques de Côte d\'Ivoire, au même endroit.');
  const vignette=s&&s.logo?s.logo:(P.img||'');
  return '<div class="pm-ecran" aria-label="Aperçu de la notification"><div class="pm-heure">'+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</div>'+
    '<div class="pm-notif"><img class="pm-app" src="/icons/icon-192.png" alt=""><div class="pm-txt"><span class="pm-src">'+esc(nom)+' · maintenant</span><b id="pm-t">'+esc(titre)+'</b><span id="pm-x">'+esc(texte)+'</span></div>'+
    (vignette?'<img class="pm-vig" src="'+esc(vignette)+'" alt="">':'')+'</div>'+
    (P.img?'<img class="pm-big" src="'+esc(P.img)+'" alt="">':'')+'<span class="pm-cap">Aperçu : c\'est ce que vos clients verront sur leur téléphone</span></div>';}

function formHTML(admin){const g=G();const s=shopFor(admin);const imgs=images(s);
  if(P.img&&!imgs.some(x=>x.u===P.img))P.img='';
  const nb=admin?null:g.S.nbAb;
  const L=(g.S.campagnes||[]).filter(c=>admin?!c.shop_id:(s&&c.shop_id===s.id));
  const semaine=L.filter(c=>c.statut!=='annulee'&&Date.now()-new Date(c.envoyer_a)<7*864e5).length;
  let h='<form class="card stack pm-form" data-f="promoEnvoi" data-admin="'+(admin?1:0)+'" style="max-width:640px"><h2 style="font-size:17px">'+(admin?'🔔 Notification promo à tous':'📣 Envoyer une promo à mes clients')+'</h2>'+
    '<p class="small muted" style="margin:0">'+(admin?'Elle arrive sur l\'écran des téléphones qui ont activé les alertes, même appli fermée, avec une image. Idéal pour mettre une boutique en avant (offre payante).':'Elle arrive sur l\'écran du téléphone de vos abonnés, même appli fermée, avec une image. <b>'+(nb||0)+' abonné'+((nb||0)>1?'s':'')+'</b> avec alertes · '+Math.max(0,3-semaine)+' promo'+(3-semaine>1?'s':'')+' possible'+(3-semaine>1?'s':'')+' cette semaine (1 par jour au plus).')+'</p>'+apercu(s);
  if(admin){h+='<label class="lbl">Pour qui ?<div class="seg">'+[['clients','Clients'],['vendeurs','Vendeurs'],['tous','Tout le monde']].map(x=>'<button type="button" class="'+(P.cible===x[0]?'on':'')+'" data-a="pmSet" data-k="cible" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></label>'+
    '<label class="lbl">Boutique mise en avant (facultatif)<select class="in" data-pm="shop"><option value="">Aucune : annonce de '+esc((g.S.settings&&g.S.settings.nom)||'Gbairai Market')+'</option>'+g.S.shops.filter(x=>x.statut==='actif').sort((a,b)=>a.nom.localeCompare(b.nom)).map(x=>'<option value="'+x.id+'"'+(P.shop===x.id?' selected':'')+'>'+esc(x.nom)+'</option>').join('')+'</select></label>';}
  h+='<label class="lbl">Titre (court et fort)<input class="in" name="titre" data-pm="titre" maxlength="60" required value="'+esc(P.titre)+'" placeholder="Ex. : -20 % sur tout"></label>'+
    '<div class="row wrapx" style="gap:6px">'+IDEES.map(t=>'<button type="button" class="chip" data-a="pmIdee" data-v="'+esc(t)+'">'+esc(t)+'</button>').join('')+'</div>'+
    '<label class="lbl">Message<textarea class="in" name="texte" data-pm="texte" rows="2" maxlength="160" style="height:auto;padding:10px 14px" placeholder="'+esc(s?'Ex. : Explorez '+s.nom+' et offrez-vous quelque chose de beau à petit prix.':'Ex. : Les promos de fin d\'année commencent aujourd\'hui.')+'">'+esc(P.texte)+'</textarea></label>'+
    '<div class="lbl">Image (facultatif)<div class="pm-imgs"><button type="button" class="pm-im'+(P.img?'':' on')+'" data-a="pmImg" data-v="">Sans image</button>'+imgs.map(x=>'<button type="button" class="pm-im'+(P.img===x.u?' on':'')+'" data-a="pmImg" data-v="'+esc(x.u)+'" data-lien="'+esc(x.lien)+'" title="'+esc(x.l)+'"><img src="'+esc(x.u)+'" alt="'+esc(x.l)+'" loading="lazy"></button>').join('')+
    '<label class="pm-im pm-up">📷<span>Ma photo</span><input type="file" accept="image/*" data-file="promoImg" hidden></label></div></div>'+
    '<label class="lbl">Quand on touche la notification, ouvrir<select class="in" data-pm="lien">'+
      (s?'<option value="">'+(admin?'La boutique '+esc(s.nom):'Ma boutique')+'</option>':'<option value="">L\'accueil</option><option value="#rayons"'+(P.lien==='#rayons'?' selected':'')+'>Les rayons</option><option value="#vendeur"'+(P.lien==='#vendeur'?' selected':'')+'>La page vendeur</option>')+
      (s?g.shopProducts(s.id).filter(p=>p.visible!==false&&p.stock>0).slice(0,60).map(p=>'<option value="#produit-'+p.id+'"'+(P.lien==='#produit-'+p.id?' selected':'')+'>Article : '+esc(p.nom)+'</option>').join(''):'')+'</select></label>'+
    '<label class="lbl">Quand ?<div class="seg"><button type="button" class="'+(P.quand==='now'?'on':'')+'" data-a="pmSet" data-k="quand" data-v="now">Maintenant</button><button type="button" class="'+(P.quand==='plus'?'on':'')+'" data-a="pmSet" data-k="quand" data-v="plus">Programmer</button></div></label>'+
    (P.quand==='plus'?'<input class="in" type="datetime-local" data-pm="date" value="'+esc(P.date||localInput(new Date(Date.now()+36e5)))+'" min="'+localInput(new Date())+'" max="'+localInput(new Date(Date.now()+29*864e5))+'"><span class="small muted">Astuce : 12 h ou 19 h, quand les gens regardent leur téléphone.</span>':'')+
    '<div class="note small">📱 <b>Android</b> : tous les abonnés la reçoivent. <b>iPhone</b> : seulement ceux qui ont <b>installé l\'appli</b> sur l\'écran d\'accueil (Partager › « Sur l\'écran d\'accueil »). Chaque client peut refuser les promos.</div>'+
    (P.res?'<div class="good small">'+esc(P.res)+'</div>':'')+
    '<button class="btn btn-v btn-block" type="submit"'+(P.busy?' disabled':'')+'>'+(P.quand==='plus'?'🗓️ Programmer la promo':'📣 Envoyer maintenant')+'</button></form>';
  h+='<div class="sec-title"><h2>'+(admin?'Promos envoyées':'Mes promos')+'</h2><span class="cnt-pill">'+L.length+'</span></div>'+(L.length?'<div class="card" style="padding:4px 14px">'+L.map(c=>{
      const st=c.statut==='prevue'?'<span class="badge b-orange">🗓️ '+esc(quand(c.envoyer_a))+'</span>':c.statut==='annulee'?'<span class="badge">Annulée</span>':c.statut==='envoi'?'<span class="badge b-orange">Envoi…</span>':'<span class="badge b-green">✔ '+c.envoye+' téléphone'+(c.envoye>1?'s':'')+' · 👆 '+c.ouvertures+' ouverture'+(c.ouvertures>1?'s':'')+'</span>';
      return '<div class="row between" style="padding:10px 0;border-top:1px solid var(--line);gap:10px">'+(c.image?'<img src="'+esc(c.image)+'" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none">':'')+'<span style="min-width:0;flex:1;text-align:left"><b>'+esc(c.titre)+'</b><span class="small muted" style="display:block">'+esc(c.statut==='prevue'?'Programmée':quand(c.envoyer_a))+(admin?' · '+esc({clients:'Clients',vendeurs:'Vendeurs',tous:'Tout le monde'}[c.cible]||''):'')+'</span>'+st+'</span>'+
        (c.statut==='prevue'?'<button type="button" class="btn btn-w btn-s" data-a="pmAnnule" data-id="'+c.id+'">Annuler</button>':'')+'</div>';}).join('')+'</div>':'<div class="card muted small" style="max-width:640px">Aucune promo pour l\'instant. Essayez : « -20 % sur tout » avec la photo de votre meilleur article.</div>');
  return h;}

function majApercu(){const t=document.getElementById('pm-t'),x=document.getElementById('pm-x');
  if(t)t.textContent=P.titre||'-20 % sur tout';if(x&&P.texte)x.textContent=P.texte;}

async function envoyer(f){const g=G();if(P.busy)return;const admin=f.dataset.admin==='1';const s=shopFor(admin);
  P.titre=String(P.titre||'').trim().slice(0,60);P.texte=String(P.texte||'').trim().slice(0,160);
  if(!P.titre)return g.toast('Écrivez un titre, par exemple « -20 % sur tout ».');
  if(!admin&&!s)return;
  let quandD=new Date();if(P.quand==='plus'){quandD=iso(P.date||localInput(new Date(Date.now()+36e5)));if(!quandD||quandD<Date.now()-6e4)return g.toast('Choisissez une date et une heure à venir.');}
  const row={titre:P.titre,texte:P.texte,image:/^https:\/\//.test(P.img)?P.img:'',lien:/^#[\w-]{1,80}$/.test(P.lien)?P.lien:'',cible:admin?P.cible:'abonnes',shop_id:admin?null:s.id};if(P.quand==='plus')row.envoyer_a=quandD.toISOString();
  // Admin : la boutique mise en avant passe par le lien (sa page ou un de ses articles), pas par shop_id
  if(admin&&!row.lien)row.lien=s?'#boutique-'+s.slug:'#accueil';
  P.busy=true;P.res='';g.render(true);
  try{const r=await g.q(g.sb.from('campagnes').insert(row).select('id').single());
    if(P.quand==='plus')P.res='🗓️ Promo programmée pour '+quand(quandD)+'. Elle partira toute seule.';
    else{let n=null;try{const x=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+g.S.token},body:JSON.stringify({kind:'campagne',campagne_id:r.id})});const j=await x.json();if(j&&j.pret===false)n=-1;else if(j&&j.error)n=-2,P.err=j.error;else if(j&&j.programmee)n=null;else if(j&&typeof j.envoye==='number')n=j.envoye;}catch(e){}
      P.res=n===-2?'Promo enregistrée, mais l\'envoi a échoué : '+P.err+' Elle repartira dans quelques minutes.':n===-1?'Promo enregistrée, mais les notifications ne sont pas encore prêtes (Admin › Paramètres › Notifications).':n===null?'Promo enregistrée. Elle part dans quelques minutes.':n?'📣 Promo envoyée sur '+n+' téléphone'+(n>1?'s':'')+' !':'Promo enregistrée, mais aucun abonné n\'a encore activé les alertes. Partagez votre lien pour en gagner.';}
    P.titre='';P.texte='';P.img='';P.lien='';P.date='';P.quand='now';
    await g.loadAll();if(g.tchin)g.tchin();
  }catch(e){g.toast(g.errMsg(e));}
  finally{P.busy=false;g.render(true);}}

function brancher(){const g=G();if(!g)return setTimeout(brancher,50);
  Object.assign(g.A,{
    pmSet:t=>{P[t.dataset.k]=t.dataset.v;g.render(true);},
    pmIdee:t=>{P.titre=t.dataset.v;const i=document.querySelector('[data-pm="titre"]');if(i)i.value=P.titre;majApercu();},
    pmImg:t=>{P.img=t.dataset.v||'';if(t.dataset.lien&&!P.lien)P.lien=t.dataset.lien;g.render(true);},
    pmAnnule:t=>g.act(()=>g.q(g.sb.from('campagnes').update({statut:'annulee'}).eq('id',t.dataset.id)),'Promo annulée'),
  });
  Object.assign(g.FORMS,{promoEnvoi:(d,f)=>envoyer(f)});
  document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.pm;if(!k)return;P[k]=e.target.value;if(k==='titre'||k==='texte')majApercu();});
  document.addEventListener('change',async e=>{const k=e.target.dataset&&e.target.dataset.pm;
    if(k==='shop'){P.shop=e.target.value;P.img='';P.lien='';g.render(true);return;}
    if(k){P[k]=e.target.value;return;}
    if(e.target.dataset&&e.target.dataset.file==='promoImg'&&e.target.files[0]){try{const r=await g.resizePhoto(e.target.files[0],1000);g.toast('Envoi de la photo…');P.up=await g.uploadPhoto(r.blob);P.img=P.up;g.render(true);}catch(err){g.toast('Impossible d\'envoyer cette photo');}}});
  // Ouverture d'une promo (lien /?promo=<id>#…) : on la compte, puis on nettoie l'adresse
  try{const u=new URL(location.href),id=u.searchParams.get('promo');if(id&&/^[0-9a-f-]{36}$/i.test(id)){g.sb.rpc('campagne_ouverte',{cid:id}).then(()=>{},()=>{});u.searchParams.delete('promo');history.replaceState(null,'',u.pathname+u.search+u.hash);}}catch(e){}
  // Les promos programmées partent aussi quand quelqu'un ouvre le site (au plus une fois toutes les 5 min par téléphone)
  try{const t=+(localStorage.getItem('gbairai-pm-ping')||0);if(Date.now()-t>3e5){localStorage.setItem('gbairai-pm-ping',String(Date.now()));setTimeout(()=>fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"kind":"programmees"}'}).catch(()=>{}),4000);}}catch(e){}
}
window.GBPROMO={vendeur:s=>formHTML(false),admin:()=>formHTML(true)};
brancher();
})();
