/* Gbairai Market : les « outils magiques ».
   1 Photo → produit (IA) · 2 Recherche par photo (IA) · 3 Vente en direct · 4 Achat groupé · 5 Photo 360°
   6 Coach IA du vendeur · 7 Assistant vocal (IA en secours) · 8 Près de moi · 9 Chasse aux codes · 10 Traduction (IA)
   Ce fichier se branche sur app.js par window.GB (outils de l'appli) et window.GBX (ce qu'il ajoute aux pages). */
(function(){
'use strict';
const G=()=>window.GB;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const fmt=n=>Math.round(n||0).toLocaleString('fr-FR').replace(/ | /g,' ');
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const X={};               // état propre à ce fichier
const live=g=>g.actif&&new Date(g.fin)>Date.now();
const rerender=()=>{const g=G();if(g)g.render(true);};
const toast=t=>{const g=G();if(g)g.toast(t);};
const origin=()=>location.origin;

/* ---------- IA (passe par /api/ia, la clé reste dans Vercel) ---------- */
async function ia(kind,body){
  const g=G(),h={'Content-Type':'application/json'};if(g.S.token)h.Authorization='Bearer '+g.S.token;
  let r;try{r=await fetch('/api/ia',{method:'POST',headers:h,body:JSON.stringify(Object.assign({kind},body))});}catch(e){throw new Error('Pas de connexion internet');}
  let j={};try{j=await r.json();}catch(e){}
  if(j.cle===false)throw new Error('IA_OFF');
  if(!r.ok||!j.ok)throw new Error(j.error||'L\'IA ne répond pas pour le moment');
  return j.data;
}
const iaMsg=e=>e&&e.message==='IA_OFF'?'L\'IA n\'est pas encore activée sur le site (clé à ajouter dans Vercel)':(e&&e.message)||'Erreur';
const b64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});
async function urlBlob(u){const r=await fetch(u);if(!r.ok)throw new Error('photo');const b=await r.blob();return G().resizePhoto(new File([b],'p.jpg',{type:b.type||'image/jpeg'}),900);}
const rayons=()=>G().CATS().map(c=>c.id);

/* ---------- Chargement des données (appelé par loadAll) ---------- */
async function load(){
  const g=G(),S=g.S;
  const [gr,et,lv,pts]=await Promise.all([g.safe(g.sb.from('groupes').select('*').order('created_at',{ascending:false}).limit(300)),g.safe(g.sb.rpc('groupes_etat')),g.safe(g.sb.from('lives').select('*').eq('actif',true).order('created_at',{ascending:false}).limit(50)),S.points?Promise.resolve(S.points):g.safe(g.sb.from('points_vente').select('*'))]);
  S.groupes=gr;S.gNb={};(et||[]).forEach(x=>S.gNb[x.groupe_id]=x.nb);S.lives=lv;if(!S.points)S.points=pts;
  S.mesCodes=[];S.gMembres=[];
  const me=S.user&&!g.isAdmin()&&g.myShop();
  if(me){
    S.mesCodes=await g.safe(g.sb.from('codes_chasse').select('*').eq('shop_id',me.id).order('created_at',{ascending:false}));
    const ids=gr.filter(x=>x.shop_id===me.id).map(x=>x.id);
    if(ids.length)S.gMembres=await g.safe(g.sb.from('groupe_membres').select('*').in('groupe_id',ids).order('created_at'));
  }
}
const shopOk=s=>s&&s.statut==='actif';
const groupeDe=pid=>(G().S.groupes||[]).find(x=>x.product_id===pid&&live(x));
const livesActifs=()=>(G().S.lives||[]).filter(l=>l.actif&&shopOk(G().shopById(l.shop_id))&&Date.now()-new Date(l.created_at)<12*3600e3);
function reste(d){const ms=new Date(d)-Date.now();if(ms<=0)return 'terminé';const h=Math.floor(ms/3600e3),m=Math.floor(ms%3600e3/6e4);return h>=48?Math.round(h/24)+' jours':h?h+' h '+String(m).padStart(2,'0')+' min':m+' min';}

/* ---------- Accueil : la rangée des outils magiques ---------- */
function home(){
  const L=livesActifs(),g=G(),nG=(g.S.groupes||[]).filter(x=>live(x)&&shopOk(g.shopById(x.shop_id))).length;
  const tile=(href,ico,t,sub,cls)=>'<a class="mg-tile'+(cls?' '+cls:'')+'" href="'+href+'"><span class="mg-ico">'+ico+'</span><b>'+t+'</b><small>'+sub+'</small></a>';
  return (L.length?'<div class="mg-lives">'+L.slice(0,6).map(l=>{const s=g.shopById(l.shop_id);return '<a class="mg-live" href="#live-'+l.id+'"><span class="mg-red">● EN DIRECT</span><span class="mg-lv-s">'+g.avatar(s,34)+'<span><b>'+esc(s.nom)+'</b><small>'+esc(l.titre||'Regardez et commandez')+'</small></span></span></a>';}).join('')+'</div>':'')+
  '<div class="mg-row">'+tile('#pres','📍','Près de moi','Boutiques autour de vous')+tile('#codes','🎁','Chasse aux codes','Trouvez les codes promo')+tile('#groupes','👥','Achats groupés',nG?nG+' en cours':'Payez moins ensemble')+tile('#lives','🔴','En direct',L.length?L.length+' maintenant':'Ventes en vidéo',L.length?'on':'')+'</div>';
}
function homeSearch(){return '<label class="mg-cam"><span>📷</span>Chercher avec une photo<input type="file" accept="image/*" data-px="rphoto" hidden></label>';}

/* ---------- 2. Recherche par photo ---------- */
async function photoSearch(file){
  const g=G();let r;try{r=await g.resizePhoto(file,800);}catch(e){return toast('Impossible de lire cette photo');}
  X.ph={url:r.url,state:'load'};if(location.hash!=='#photo')location.hash='#photo';else rerender();
  try{const d=await ia('recherche',{image:await b64(r.blob),rayons:rayons()});X.ph=Object.assign(X.ph,{state:'ok',d});}
  catch(e){X.ph.state='err';X.ph.err=iaMsg(e);}
  rerender();
}
function vPhoto(){
  const g=G(),P=X.ph;
  let h='<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">Recherche par photo</h1></div>';
  if(!P)return h+'<label class="card mg-drop"><span style="font-size:40px">📷</span><b>Prenez en photo l\'article que vous cherchez</b><span class="small muted">Une robe vue dans la rue, des chaussures chez une amie… on trouve les articles qui y ressemblent.</span><input type="file" accept="image/*" data-px="rphoto" hidden></label></div>';
  h+='<div class="card row" style="gap:12px"><img src="'+esc(P.url)+'" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:14px"><div class="stack" style="gap:4px;min-width:0">';
  if(P.state==='load')return h+'<b>✨ L\'IA regarde votre photo…</b><span class="small muted">Quelques secondes</span></div></div></div>';
  if(P.state==='err')return h+'<b>Recherche impossible</b><span class="small muted">'+esc(P.err)+'</span><label class="btn btn-w btn-s" style="align-self:flex-start">Réessayer<input type="file" accept="image/*" data-px="rphoto" hidden></label></div></div></div>';
  const mots=(P.d.mots||[]).map(norm).filter(m=>m.length>1),cat=P.d.categorie;
  const res=g.S.products.filter(p=>{const s=g.shopById(p.shop_id);return shopOk(s)&&p.visible&&p.stock>0;}).map(p=>{const t=norm(p.nom+' '+(p.description||'')+' '+(p.type||''));let sc=mots.reduce((a,m)=>a+(t.includes(m)?2:0),0);if(sc&&p.categorie===cat)sc+=1;if(!sc&&p.categorie===cat)sc=0.5;return {p,sc};}).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,24);
  h+='<b>'+esc(P.d.resume||'Article reconnu')+'</b><div class="row wrapx" style="gap:4px">'+(P.d.mots||[]).slice(0,6).map(m=>'<span class="badge b-violet">'+esc(m)+'</span>').join('')+'</div><label class="small" style="color:#6D28D9;font-weight:700;cursor:pointer">📷 Autre photo<input type="file" accept="image/*" data-px="rphoto" hidden></label></div></div>';
  h+='<div class="sec-title"><h2>Articles qui ressemblent</h2><span class="cnt-pill">'+res.length+'</span></div>';
  return h+(res.length?'<div class="pgrid">'+res.map(x=>g.pCard(x.p)).join('')+'</div>':'<p class="muted">Rien de semblable pour l\'instant. Essayez une photo plus nette, ou cherchez avec des mots.</p>')+'</div>';
}

/* ---------- 1 et 7. Remplir la fiche produit avec l'IA (photo ou voix) ---------- */
function fill(r,opts){
  const f=document.querySelector('form[data-f="produit"]');if(!f||!r)return 0;let n=0;
  const set=(id,v,force)=>{const el=document.getElementById(id);if(el&&v!=null&&v!==''&&v!==0&&(force||!String(el.value).trim()||opts.force)){el.value=v;el.classList.add('voixok');n++;}};
  if(r.categorie&&rayons().includes(r.categorie)){const rb=f.querySelector('input[name="categorie"][value="'+r.categorie+'"]');if(rb){rb.checked=true;document.querySelectorAll('.rpick .rayon').forEach(l=>l.classList.toggle('on',l.contains(rb)));const ft=document.getElementById('f-type');if(ft){ft.innerHTML=G().typeOpts(r.categorie,r.type||'');ft.value=r.type||'';}n++;}}
  else{const ft=document.getElementById('f-type');if(ft&&r.type){ft.innerHTML=G().typeOpts((f.querySelector('input[name="categorie"]:checked')||{}).value,r.type);ft.value=r.type;}}
  set('f-nom',r.nom,true);set('f-desc',r.description);set('f-prix',r.prix||r.prix_conseille);set('f-stock',r.stock);set('f-tailles',r.tailles);
  return n;
}
function formProduit(p){
  const g=G(),hasPhoto=g.ui.photo?true:(g.ui.photo===undefined&&!!p.photo);
  let h='<div class="mg-ai"><div class="row" style="gap:10px"><span style="font-size:26px">✨</span><div class="grow"><b>Remplir avec l\'IA</b><div class="small muted">'+(hasPhoto?'L\'IA regarde la photo et écrit le nom, la description et un prix conseillé.':'Ajoutez d\'abord une photo, puis touchez ce bouton.')+'</div></div><button type="button" class="btn btn-o btn-s" data-a="pxFill"'+(hasPhoto&&!X.fillBusy?'':' disabled')+'>'+(X.fillBusy?'Je regarde…':'Remplir')+'</button></div>'+(X.conseil&&X.conseil.pid===(p.id||'new')?'<div class="small" style="margin-top:6px">💡 Prix conseillé par l\'IA : <b>'+fmt(X.conseil.prix)+' F</b>'+(X.conseil.couleurs?' · Couleurs : '+esc(X.conseil.couleurs):'')+'</div>':'')+'</div>';
  if(p.id){const n=(p.vue360||[]).length;
    h+='<div class="mg-ai"><div class="row" style="gap:10px"><span style="font-size:26px">🔄</span><div class="grow"><b>Photo 360°</b><div class="small muted">'+(X.v360&&X.v360.pid===p.id?esc(X.v360.msg):n?'✔ '+n+' vues enregistrées. Les clients font tourner l\'article.':'Filmez l\'article en tournant autour pendant 10 secondes.')+'</div></div>'+
      (n&&!X.v360?'<button type="button" class="btn btn-w btn-s" data-a="pxV360del" data-id="'+p.id+'">Retirer</button>':'')+'<label class="btn btn-v btn-s"'+(X.v360?' style="opacity:.5;pointer-events:none"':'')+'>🎥 Filmer<input type="file" accept="video/*" capture="environment" data-px="v360" data-id="'+p.id+'" hidden></label></div></div>';}
  return h;
}
async function pxFill(){
  const g=G();if(X.fillBusy)return;g.keepForm();X.fillBusy=true;rerender();g.restoreForm();
  try{
    let blob;if(g.ui.photo&&g.ui.photo.blob)blob=g.ui.photo.blob;else{const p=g.prodById(g.ui.edit);if(!p||!p.photo)throw new Error('Ajoutez une photo');blob=(await urlBlob(p.photo)).blob;}
    const d=await ia('produit',{image:await b64(blob),rayons:rayons()});
    X.fillBusy=false;g.keepForm();X.conseil=d.prix_conseille?{pid:g.ui.edit==='new'?'new':g.ui.edit,prix:d.prix_conseille,couleurs:d.couleurs}:null;rerender();g.restoreForm();
    const n=fill({nom:d.nom,description:d.description,categorie:d.categorie,type:d.type,prix:d.prix_conseille},{});
    toast(n?'✨ Fiche remplie : vérifiez puis enregistrez':'L\'IA n\'a rien trouvé à ajouter');
  }catch(e){X.fillBusy=false;g.keepForm();rerender();g.restoreForm();toast(iaMsg(e));}
}
async function voixIA(text){
  try{const d=await ia('vocal',{texte:text,rayons:rayons()});const n=fill(d,{force:true});toast(n?'✨ Fiche remplie : vérifiez puis enregistrez':'Je n\'ai pas compris. Dites le nom et le prix');}
  catch(e){if(e.message==='IA_OFF')toast('Fiche remplie en partie : vérifiez les champs');else toast(iaMsg(e));}
}

/* ---------- 5. Photo 360° : 24 images tirées d'une petite vidéo ---------- */
async function v360(file,pid){
  const g=G(),N=24;X.v360={pid,msg:'Préparation de la vidéo…'};g.keepForm();rerender();g.restoreForm();
  const say=m=>{X.v360.msg=m;const el=document.querySelector('[data-px="v360"]');if(el){const t=el.closest('.mg-ai').querySelector('.small');if(t)t.textContent=m;}};
  try{
    const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=URL.createObjectURL(file);
    await new Promise((res,rej)=>{v.onloadeddata=res;v.onerror=()=>rej(new Error('Vidéo illisible sur ce téléphone'));setTimeout(()=>rej(new Error('Vidéo trop longue à lire')),20000);});
    const d=v.duration;if(!d||!isFinite(d)||d<2)throw new Error('Filmez au moins 3 secondes');
    const k=Math.min(1,700/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement('canvas');c.width=Math.round(v.videoWidth*k);c.height=Math.round(v.videoHeight*k);const x=c.getContext('2d');
    const urls=[];
    for(let i=0;i<N;i++){
      await new Promise(res=>{v.onseeked=res;v.currentTime=Math.min(d-0.05,d*i/N);});
      x.drawImage(v,0,0,c.width,c.height);
      const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',.72));
      urls.push(await g.uploadPhoto(blob));say('Envoi des vues : '+(i+1)+' / '+N);
    }
    URL.revokeObjectURL(v.src);
    await g.q(g.sb.from('products').update({vue360:urls}).eq('id',pid));
    X.v360=null;g.keepForm();await g.loadAll();rerender();g.restoreForm();toast('🔄 Photo 360° enregistrée');
  }catch(e){X.v360=null;g.keepForm();rerender();g.restoreForm();toast(e.message||'Échec de la photo 360°');}
}
function viewer360(p){const v=p.vue360||[];if(v.length<4)return '';
  return '<div class="v360 auto" data-n="'+v.length+'" data-i="0">'+v.map((u,i)=>'<img src="'+esc(u)+'" alt="" draggable="false" loading="'+(i<6?'eager':'lazy')+'"'+(i?' hidden':'')+'>').join('')+'<span class="v360-hint">👆 Glissez pour faire tourner · 360°</span></div>';}
function v360show(el,i){const n=+el.dataset.n;i=((i%n)+n)%n;el.dataset.i=i;el.querySelectorAll('img').forEach((im,k)=>im.hidden=k!==i);}
setInterval(()=>document.querySelectorAll('.v360.auto').forEach(el=>v360show(el,+el.dataset.i+1)),140);
let drag=null;
document.addEventListener('pointerdown',e=>{const el=e.target.closest&&e.target.closest('.v360');if(!el)return;el.classList.remove('auto');drag={el,x:e.clientX,i:+el.dataset.i};try{el.setPointerCapture(e.pointerId);}catch(_){}});
document.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,step=Math.max(6,drag.el.clientWidth/(+drag.el.dataset.n));v360show(drag.el,drag.i-Math.round(dx/step));});
document.addEventListener('pointerup',()=>{drag=null;});document.addEventListener('pointercancel',()=>{drag=null;});

/* ---------- Page produit : 360°, achat groupé, traduction ---------- */
function produit(p,s){return viewer360(p)+groupeBox(p,s)+tradBox(p);}

/* ---------- 4. Achat groupé ---------- */
function groupeBox(p,s){
  const g=G(),gr=groupeDe(p.id);if(!gr)return '';
  const nb=g.S.gNb[gr.id]||0,ok=nb>=gr.objectif,moi=LS('gbairai-groupes',{})[gr.id],pc=Math.min(100,Math.round(nb/gr.objectif*100));
  const lien=origin()+'/p/'+p.id,txt='👥 Achat groupé sur '+(g.S.settings.nom||'Gbairai Market')+' : '+p.nom+' à '+fmt(gr.prix_groupe)+' F au lieu de '+fmt(g.prix(p))+' F si on est '+gr.objectif+'. Rejoins-nous : '+lien;
  return '<section class="card stack mg-grp"><div class="row between"><span class="badge b-orange">👥 Achat groupé</span><span class="small" style="font-weight:700;color:#C2410C">⏳ '+reste(gr.fin)+'</span></div>'+
  '<div class="row" style="gap:10px;align-items:baseline"><b class="num" style="font-size:24px;color:#C2410C">'+fmt(gr.prix_groupe)+' F</b><s class="muted">'+fmt(g.prix(p))+' F</s><span class="small muted">à '+gr.objectif+' personnes</span></div>'+
  '<div class="mg-bar"><i style="width:'+pc+'%"></i></div><div class="row between small" style="font-weight:700"><span>'+nb+' / '+gr.objectif+' personnes</span><span>'+(ok?'🎉 Objectif atteint !':'Plus que '+(gr.objectif-nb))+'</span></div>'+
  (moi?'<div class="note">✔ Vous êtes dans le groupe ('+esc(moi.tel)+'). '+(ok?'Le vendeur va vous écrire sur WhatsApp pour la commande.':'Invitez des amis : le prix baisse pour tout le monde quand le groupe est complet.')+'</div>'
  :'<form class="stack" data-f="pxJoin" style="gap:8px"><input type="hidden" name="gid" value="'+gr.id+'"><div class="grid2"><input class="in" name="nom" placeholder="Votre nom" maxlength="60" value="'+esc(g.getClient().nom||'')+'"><input class="in" name="tel" type="tel" required placeholder="Votre WhatsApp" value="'+esc(g.getClient().tel||'')+'"></div><button class="btn btn-o btn-block" type="submit">Je rejoins le groupe</button></form>')+
  '<a class="btn btn-g btn-block" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(txt)+'">'+g.ic('wa',18,'#fff')+'Inviter sur mon statut WhatsApp</a></section>';
}
function vGroupes(){
  const g=G(),L=(g.S.groupes||[]).filter(x=>live(x)&&shopOk(g.shopById(x.shop_id))&&g.prodById(x.product_id));
  return '<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">👥 Achats groupés</h1></div><p class="muted" style="margin:0">Le prix baisse quand assez de personnes rejoignent. Rejoignez, puis invitez vos amis sur votre statut.</p>'+
  (L.length?L.map(x=>{const p=g.prodById(x.product_id),s=g.shopById(x.shop_id),nb=g.S.gNb[x.id]||0;return '<a class="card row mg-gl" href="#produit-'+p.id+'"><div style="width:72px;flex:none">'+g.tile(p,72,30)+'</div><div class="grow stack" style="gap:4px;min-width:0"><b class="ell">'+esc(p.nom)+'</b><span class="small muted">'+esc(s.nom)+' · ⏳ '+reste(x.fin)+'</span><span><b style="color:#C2410C">'+fmt(x.prix_groupe)+' F</b> <s class="small muted">'+fmt(g.prix(p))+' F</s></span><div class="mg-bar sm"><i style="width:'+Math.min(100,nb/x.objectif*100)+'%"></i></div><span class="small">'+nb+' / '+x.objectif+' personnes</span></div></a>';}).join(''):'<div class="card muted">Aucun achat groupé en ce moment. Revenez bientôt !</div>')+'</div>';
}

/* ---------- 10. Traduction de la fiche ---------- */
const EUR=655.957,USD=600;
function tradBox(p){
  const g=G(),k='gbairai-tr-'+p.id,tr=LS(k,null),on=X.tr===p.id;
  const btn='<button type="button" class="chip'+(on?' on':'')+'" data-a="pxTr" data-id="'+p.id+'">🌍 '+(on?'Français':'English')+'</button>';
  if(!on)return '<div class="row" style="gap:6px">'+btn+'<span class="small muted">≈ '+(g.prix(p)/EUR).toFixed(0)+' € · ≈ '+(g.prix(p)/USD).toFixed(0)+' $</span></div>';
  return '<div class="card stack mg-tr">'+'<div class="row between">'+btn+'<span class="small muted">Translated automatically</span></div>'+
    (tr?'<b style="font-size:17px">'+esc(tr[0])+'</b>'+(tr[1]?'<p style="margin:0;white-space:pre-line">'+esc(tr[1])+'</p>':'')+'<b style="color:#C2410C">'+fmt(g.prix(p))+' FCFA · ≈ '+(g.prix(p)/EUR).toFixed(0)+' € · ≈ '+(g.prix(p)/USD).toFixed(0)+' $</b><span class="small muted">Order on WhatsApp: the seller will reply. Write in English, '+'messages can be translated.</span>':'<span class="muted">✨ Translating…</span>')+'</div>';
}
async function pxTr(t){
  const id=t.dataset.id;if(X.tr===id){X.tr=null;return rerender();}
  X.tr=id;rerender();const k='gbairai-tr-'+id;if(LS(k,null))return;
  const p=G().prodById(id);
  try{const d=await ia('traduire',{textes:[p.nom,p.description||''],vers:'en'});LSset(k,d.textes);rerender();}
  catch(e){X.tr=null;rerender();toast(iaMsg(e));}
}

/* ---------- 3. Vente en direct ---------- */
function embed(url){
  let m=url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if(m)return '<iframe src="https://www.youtube.com/embed/'+m[1]+'?autoplay=1&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Direct"></iframe>';
  if(/facebook\.com|fb\.watch/i.test(url))return '<iframe src="https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(url)+'&show_text=false&autoplay=true" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Direct"></iframe>';
  return '';
}
const plateforme=u=>/tiktok/i.test(u)?'TikTok':/facebook|fb\.watch/i.test(u)?'Facebook':/youtu/i.test(u)?'YouTube':/instagram/i.test(u)?'Instagram':'le direct';
function vLive(id){
  const g=G(),l=(g.S.lives||[]).find(x=>x.id===id),s=l&&g.shopById(l.shop_id);
  if(!l||!shopOk(s))return '<div class="wrap">'+g.back('#lives')+'<div class="card"><h2>Ce direct est terminé</h2><p class="muted">Revenez au prochain direct de la boutique.</p></div></div>';
  const prods=(l.produits||[]).map(g.prodById).filter(p=>p&&p.visible),nC=g.getCart().reduce((a,x)=>a+x.qty,0),em=embed(l.url);
  return '<div class="wrap"><div class="row between">'+g.back('#boutique-'+esc(s.slug),esc(s.nom))+'<span class="mg-red">● EN DIRECT</span></div>'+
  '<div class="mg-video">'+(em||'<div class="mg-ext"><span style="font-size:44px">🔴</span><b>'+esc(s.nom)+' est en direct sur '+plateforme(l.url)+'</b><a class="btn btn-o" target="_blank" rel="noopener" href="'+esc(l.url)+'">Regarder le direct</a><span class="small">Revenez ici pour commander en 1 clic pendant le direct.</span></div>')+'</div>'+
  '<div class="row" style="gap:10px">'+g.avatar(s,40)+'<div><b>'+esc(l.titre||'Direct de '+s.nom)+'</b><div class="small muted">'+esc(g.place(s))+'</div></div></div>'+
  '<div class="sec-title"><h2>Articles du direct</h2><span class="cnt-pill">'+prods.length+'</span></div>'+
  (prods.length?prods.map(p=>'<div class="card row" style="gap:10px"><a href="#produit-'+p.id+'" style="width:64px;flex:none">'+g.tile(p,64,28)+'</a><div class="grow" style="min-width:0"><b class="ell">'+esc(p.nom)+'</b><div class="small muted">'+fmt(g.prix(p))+' F · reste '+p.stock+'</div></div>'+(p.stock>0?'<button type="button" class="btn btn-o btn-s" data-a="pxPrends" data-id="'+p.id+'">Je prends</button>':'<span class="badge b-grey">Épuisé</span>')+'</div>').join(''):'<p class="muted">Le vendeur montre ses articles dans la vidéo. Écrivez-lui sur WhatsApp.</p>')+
  (nC?'<a class="btn btn-g btn-block mg-sticky" href="#panier">'+g.ic('wa',18,'#fff')+'Commander mon panier ('+nC+')</a>':'')+'</div>';
}
function vLives(){
  const g=G(),L=livesActifs();
  return '<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">🔴 Ventes en direct</h1></div>'+(L.length?L.map(l=>{const s=g.shopById(l.shop_id);return '<a class="card row" style="gap:12px;text-decoration:none;color:inherit" href="#live-'+l.id+'">'+g.avatar(s,48)+'<div class="grow"><span class="mg-red">● EN DIRECT</span><b style="display:block">'+esc(s.nom)+'</b><span class="small muted">'+esc(l.titre||'Regardez et commandez')+'</span></div></a>';}).join(''):'<div class="card muted">Aucun direct en ce moment. Les vendeurs annoncent leurs directs sur leurs statuts.</div>')+'</div>';
}
function boutique(s){
  const l=livesActifs().find(x=>x.shop_id===s.id);
  return l?'<a class="card row mg-livebar" href="#live-'+l.id+'"><span class="mg-red">● EN DIRECT</span><b class="grow">'+esc(l.titre||'La boutique est en direct')+'</b><span>Regarder ›</span></a>':'';
}

/* ---------- 8. Près de moi ---------- */
function dist(a,b){const R=6371e3,r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r,x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
const dTxt=m=>m<1000?Math.round(m/10)*10+' m':(m/1000).toFixed(m<10000?1:0).replace('.',',')+' km';
function vPres(){
  const g=G(),pos=X.pos;
  let h='<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">📍 Près de moi</h1></div>';
  if(!pos)return h+'<div class="card stack" style="text-align:center;padding:26px"><span style="font-size:44px">📍</span><b>Trouvez les boutiques autour de vous</b><span class="small muted">Votre position reste sur votre téléphone : elle sert seulement à calculer les distances.</span><button type="button" class="btn btn-v" data-a="pxPos">Utiliser ma position</button></div></div>';
  const best={};(g.S.points||[]).forEach(pt=>{if(pt.lat==null||pt.lng==null)return;const s=g.shopById(pt.shop_id);if(!shopOk(s))return;const d=dist(pos,{lat:+pt.lat,lng:+pt.lng});if(!best[s.id]||d<best[s.id].d)best[s.id]={s,d,pt};});
  const L=Object.values(best).sort((a,b)=>a.d-b.d).slice(0,40),far=L.length?Math.max(1500,Math.min(20000,L[Math.min(L.length-1,9)].d)):5000;
  const dots=L.slice(0,12).map((x,i)=>{const ang=Math.atan2(+x.pt.lat-pos.lat,(+x.pt.lng-pos.lng)*Math.cos(pos.lat*Math.PI/180)),r=Math.min(1,Math.sqrt(x.d/far))*44;const cx=50+r*Math.cos(ang),cy=50-r*Math.sin(ang);return '<a href="#boutique-'+esc(x.s.slug)+'"><circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="3.4" fill="'+['#5B21B6','#FF7A1A','#0E7A5F'][i%3]+'" stroke="#fff" stroke-width="1"/><text x="'+cx.toFixed(1)+'" y="'+(cy-5).toFixed(1)+'" font-size="3.6" text-anchor="middle" font-weight="700" fill="#1B1033">'+esc(x.s.nom.slice(0,14))+'</text></a>';}).join('');
  h+='<div class="card mg-radar"><svg viewBox="0 0 100 100" role="img" aria-label="Carte des boutiques autour de vous"><circle cx="50" cy="50" r="44" fill="#EEF5E8"/><circle cx="50" cy="50" r="29" fill="none" stroke="#C9DDBD" stroke-dasharray="1.5 1.5"/><circle cx="50" cy="50" r="15" fill="none" stroke="#C9DDBD" stroke-dasharray="1.5 1.5"/>'+dots+'<circle cx="50" cy="50" r="3" fill="#3B82F6" stroke="#fff" stroke-width="1.2"/></svg><span class="small muted">Cercle extérieur ≈ '+dTxt(far)+'</span></div>';
  if(!L.length)return h+'<div class="card muted">Aucune boutique n\'a encore enregistré sa position. Les vendeurs l\'ajoutent dans Équipe › Points de vente.</div></div>';
  return h+L.map(x=>{const s=x.s,msg='Bonjour '+s.nom+', je suis à '+dTxt(x.d)+' de votre boutique. Je peux passer récupérer ma commande ?';
    return '<div class="card stack" style="gap:10px"><a class="row" style="gap:10px;text-decoration:none;color:inherit" href="#boutique-'+esc(s.slug)+'">'+g.avatar(s,46)+'<div class="grow" style="min-width:0"><b class="ell">'+esc(s.nom)+'</b>'+g.verifBadge(s)+'<div class="small muted">à <b style="color:#1B1033">'+dTxt(x.d)+'</b> · '+esc(x.pt.nom||g.place(s))+'</div>'+(g.presenceHTML(s)||'')+'</div></a>'+
    '<div class="grid2"><a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+x.pt.lat+','+x.pt.lng+'">🧭 Itinéraire</a><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+g.waNum(s.whatsapp)+'?text='+encodeURIComponent(msg)+'">🚶 Retrait sur place</a></div></div>';}).join('')+'</div>';
}

/* ---------- 9. Chasse aux codes ---------- */
const mesGains=()=>LS('gbairai-codes',[]).filter(c=>new Date(c.expire)>Date.now());
function vCodes(){
  const g=G(),W=mesGains();
  return '<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">🎁 Chasse aux codes</h1></div>'+
  '<div class="card stack mg-hunt"><b>Comment jouer ?</b><span class="small">Les boutiques cachent des codes secrets dans leurs statuts WhatsApp, TikTok et Facebook. Trouvez-en un, entrez-le ici : la réduction s\'ajoute à votre commande chez cette boutique.</span>'+
  '<form class="row" data-f="pxCode" style="gap:8px"><input class="in mg-codein" name="code" required maxlength="20" placeholder="EX. : AWA-7K2Q" autocapitalize="characters" autocomplete="off"><button class="btn btn-o" type="submit">OK</button></form></div>'+
  (X.gagne?'<div class="card mg-win"><span style="font-size:40px">🎉</span><b>-'+X.gagne.pct+' % chez '+esc((g.shopById(X.gagne.shop)||{}).nom||'la boutique')+' !</b><span class="small">Valable '+reste(X.gagne.expire)+'. La réduction est ajoutée à votre message de commande.</span>'+((g.shopById(X.gagne.shop))?'<a class="btn btn-w btn-s" href="#boutique-'+esc(g.shopById(X.gagne.shop).slug)+'">Voir la boutique</a>':'')+'</div>':'')+
  '<div class="sec-title"><h2>Mes codes trouvés</h2><span class="cnt-pill">'+W.length+'</span></div>'+
  (W.length?W.map(c=>{const s=g.shopById(c.shop);return '<div class="card row between"><div><b class="num">'+esc(c.code)+'</b><div class="small muted">'+esc(s?s.nom:'Boutique')+' · encore '+reste(c.expire)+'</div></div><span class="badge b-orange">-'+c.pct+' %</span></div>';}).join(''):'<p class="muted">Aucun code pour l\'instant. Regardez les statuts de vos boutiques préférées !</p>')+'</div>';
}
const gainPour=sid=>mesGains().filter(c=>c.shop===sid).sort((a,b)=>b.pct-a.pct)[0];
function panier(s,tot){const c=gainPour(s.id);if(!c)return '';const r=Math.round(tot*c.pct/100);
  return '<div class="card row between mg-codeok"><span>🎁 Code <b>'+esc(c.code)+'</b> (-'+c.pct+' %)</span><span style="text-align:right"><b>-'+fmt(r)+' F</b><br><span class="small">Total : <b>'+fmt(tot-r)+' F</b></span></span></div>';}
function codeLine(s,tot){const c=gainPour(s.id);if(!c)return '';const r=Math.round(tot*c.pct/100);return '\n🎁 Code chasse : '+c.code+' (-'+c.pct+' %) → total après remise : '+fmt(tot-r)+' FCFA';}

/* ---------- Espace vendeur : « Outils magiques » ---------- */
function vendeur(s){
  const g=G(),prods=g.shopProducts(s.id);
  return coachCard(s)+
  '<div class="mg-help card stack" style="gap:6px"><b>✨ Aussi dans vos produits</b><span class="small">📸 <b>Photo → produit</b> : ajoutez une photo, puis « Remplir avec l\'IA ».<br>🎤 <b>Dites votre produit</b> au micro, même en nouchi.<br>🔄 <b>Photo 360°</b> : ouvrez un produit déjà publié, puis « Filmer ».</span><button type="button" class="btn btn-w btn-s" data-a="vtab" data-id="produits" style="align-self:flex-start">Aller à mes produits</button></div>'+
  liveCard(s,prods)+groupesCard(s,prods)+codesCard(s);
}
function coachCard(s){
  const c=LS('gbairai-coach-'+s.id,null),sem=semaine();
  const L=c&&c.sem===sem?c.conseils:null,ACT={relancer:['clients','Relancer mes clients'],stock:['stock','Voir mon stock'],prix:['produits','Modifier les prix'],photo:['produits','Ajouter des photos'],statut:['produits','Partager sur mon statut']};
  return '<section class="card stack mg-coach"><div class="row between"><b style="font-size:16px">🧠 Votre coach IA</b><span class="small" style="opacity:.8">Semaine '+sem.split('-')[1]+'</span></div>'+
  (L?L.map(x=>'<div class="mg-tip"><b>'+esc(x.icone||'💡')+' '+esc(x.titre)+'</b><span>'+esc(x.texte)+'</span>'+(ACT[x.action]?'<button type="button" class="btn btn-w btn-s" data-a="vtab" data-id="'+ACT[x.action][0]+'">'+ACT[x.action][1]+'</button>':'')+'</div>').join('')+'<button type="button" class="linkbtn" style="color:#fff" data-a="pxCoach" data-force="1">Recalculer</button>'
  :'<span class="small" style="opacity:.9">Chaque semaine, l\'IA lit vos chiffres (commandes, stock, clients) et vous dit quoi faire pour vendre plus.</span><button type="button" class="btn btn-o" data-a="pxCoach"'+(X.coachBusy?' disabled':'')+'>'+(X.coachBusy?'Je lis vos chiffres…':'Recevoir mes conseils')+'</button>')+'</section>';
}
function semaine(){const d=new Date(),j=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=(j.getUTCDay()+6)%7;j.setUTCDate(j.getUTCDate()-n+3);const y=new Date(Date.UTC(j.getUTCFullYear(),0,4));return j.getUTCFullYear()+'-'+(1+Math.round(((j-y)/864e5-3+((y.getUTCDay()+6)%7))/7));}
function chiffres(s){
  const g=G(),now=Date.now(),D=864e5,O=g.S.orders.filter(o=>o.shop_id===s.id),P=g.shopProducts(s.id);
  const per=(a,b)=>O.filter(o=>{const t=now-new Date(o.created_at);return t>=a*D&&t<b*D;});
  const sem=x=>({commandes:x.length,confirmees:x.filter(o=>o.statut==='confirmee').length,ca:x.filter(o=>o.statut==='confirmee').reduce((a,o)=>a+o.total,0)});
  const vente={};O.filter(o=>now-new Date(o.created_at)<30*D).forEach(o=>(o.items||[]).forEach(i=>{vente[i.pid]=(vente[i.pid]||0)+(i.qty||1);}));
  const heures={};O.forEach(o=>{const h=new Date(o.created_at).getHours();heures[h]=(heures[h]||0)+1;});
  const cli={};O.forEach(o=>{const t=String(o.client_tel||'').replace(/\D/g,'');if(!t)return;const d=new Date(o.created_at);if(!cli[t]||d>cli[t])cli[t]=d;});
  return {boutique:s.nom,ville:g.villeOf(s),abonnes:g.S.nbAb||0,cette_semaine:sem(per(0,7)),semaine_passee:sem(per(7,14)),
    produits:P.slice(0,40).map(p=>({nom:p.nom,prix:g.prix(p),stock:p.stock,visible:p.visible,photos:(p.photo?1:0)+(p.photos||[]).length,vendus_30j:vente[p.id]||0,en_ligne_depuis_jours:Math.round((now-new Date(p.created_at))/D)})),
    heures_des_commandes:heures,clients_total:Object.keys(cli).length,clients_sans_commande_depuis_30j:Object.values(cli).filter(d=>now-d>30*D).length,
    commandes_en_attente:O.filter(o=>o.statut==='envoyee').length};
}
async function pxCoach(t){
  const g=G(),s=g.myShop();if(!s||X.coachBusy)return;
  if(t&&t.dataset.force){try{localStorage.removeItem('gbairai-coach-'+s.id);}catch(e){}}
  X.coachBusy=true;rerender();
  try{const d=await ia('coach',{chiffres:chiffres(s)});LSset('gbairai-coach-'+s.id,{sem:semaine(),conseils:(d.conseils||[]).slice(0,4)});}
  catch(e){toast(iaMsg(e));}
  X.coachBusy=false;rerender();
}
function liveCard(s,prods){
  const g=G(),l=(g.S.lives||[]).find(x=>x.shop_id===s.id&&x.actif),lien=l?origin()+'/#live-'+l.id:'';
  if(l)return '<section class="card stack"><div class="row between"><b style="font-size:16px">🔴 Vente en direct</b><span class="mg-red">● EN COURS</span></div><span class="small">'+esc(l.titre||'Votre direct')+' · '+(l.produits||[]).length+' articles montrés</span>'+
    '<div class="grid2"><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('🔴 Je suis en direct ! Regardez et commandez en 1 clic : '+lien)+'">'+g.ic('wa',16,'#fff')+'Annoncer</a><button type="button" class="btn btn-w btn-s" data-a="pxLiveFin" data-id="'+l.id+'">Terminer le direct</button></div></section>';
  return '<section class="card stack"><b style="font-size:16px">🔴 Vente en direct</b><span class="small muted">Lancez votre direct sur TikTok, Facebook ou YouTube comme d\'habitude, puis collez le lien ici : vos clients regardent sur Gbairai et touchent « Je prends ».</span>'+
  '<form class="stack" data-f="pxLive" style="gap:8px"><input class="in" name="url" type="url" required placeholder="Lien du direct (https://…)"><input class="in" name="titre" maxlength="80" placeholder="Titre (ex. : Arrivage du vendredi 🔥)">'+
  (prods.length?'<details><summary class="small" style="font-weight:700;cursor:pointer">Articles à montrer ('+prods.filter(p=>p.visible).length+')</summary><div class="mg-picks">'+prods.filter(p=>p.visible).slice(0,60).map(p=>'<label><input type="checkbox" name="p_'+p.id+'"> '+esc(p.nom)+'</label>').join('')+'</div></details>':'')+
  '<button class="btn btn-o btn-block" type="submit">Lancer le direct sur Gbairai</button></form></section>';
}
function groupesCard(s,prods){
  const g=G(),L=(g.S.groupes||[]).filter(x=>x.shop_id===s.id&&(x.actif||new Date(x.fin)>Date.now()-7*864e5));
  return '<section class="card stack"><b style="font-size:16px">👥 Achats groupés</b><span class="small muted">Proposez un prix plus bas si plusieurs personnes achètent : elles invitent leurs amis pour vous.</span>'+
  L.map(x=>{const p=g.prodById(x.product_id),M=(g.S.gMembres||[]).filter(m=>m.groupe_id===x.id),ok=M.length>=x.objectif,on=live(x);
    return '<div class="mg-gs"><div class="row between"><b class="ell">'+esc(p?p.nom:'Produit')+'</b><span class="badge '+(ok?'b-green':on?'b-orange':'b-grey')+'">'+(ok?'Complet':on?'⏳ '+reste(x.fin):'Terminé')+'</span></div><span class="small">'+fmt(x.prix_groupe)+' F · '+M.length+' / '+x.objectif+' personnes</span>'+
    (M.length?'<details><summary class="small" style="cursor:pointer;font-weight:700">Voir les membres</summary>'+M.map(m=>'<div class="row between small" style="padding:4px 0"><span>'+esc(m.nom||'Client')+' · '+esc(m.tel)+'</span><a target="_blank" rel="noopener" style="font-weight:700;color:#0E7A5F" href="https://wa.me/'+g.waNum(m.tel)+'?text='+encodeURIComponent('Bonjour'+(m.nom?' '+m.nom:'')+', l\'achat groupé « '+(p?p.nom:'')+' » '+(ok?'est complet 🎉 Votre prix : '+fmt(x.prix_groupe)+' F. On organise la livraison ?':'avance : '+M.length+' / '+x.objectif+'. Invitez vos amis pour avoir le prix de '+fmt(x.prix_groupe)+' F !'))+'">Écrire</a></div>').join('')+'</details>':'')+
    (on?'<button type="button" class="btn btn-w btn-s" data-a="pxGFin" data-id="'+x.id+'" style="align-self:flex-start">Arrêter</button>':'')+'</div>';}).join('')+
  (prods.length?'<form class="stack" data-f="pxGroupe" style="gap:8px"><select class="in" name="pid" required><option value="">Choisir le produit…</option>'+prods.filter(p=>p.visible&&!groupeDe(p.id)).map(p=>'<option value="'+p.id+'">'+esc(p.nom)+' ('+fmt(g.prix(p))+' F)</option>').join('')+'</select>'+
  '<div class="grid2"><label class="lbl">Prix du groupe (F)<input class="in" name="prix" inputmode="numeric" required placeholder="9000"></label><label class="lbl">Nombre de personnes<input class="in" name="obj" type="number" min="2" max="50" value="5" required></label></div>'+
  '<label class="lbl">Durée<select class="in" name="h"><option value="24">24 heures</option><option value="48" selected>2 jours</option><option value="72">3 jours</option><option value="168">1 semaine</option></select></label><button class="btn btn-v btn-block" type="submit">Créer l\'achat groupé</button></form>':'<span class="small muted">Ajoutez d\'abord des produits.</span>')+'</section>';
}
function codesCard(s){
  const g=G(),C=g.S.mesCodes||[];
  return '<section class="card stack"><b style="font-size:16px">🎁 Chasse aux codes</b><span class="small muted">Créez un code secret, cachez-le dans votre statut : les clients qui le trouvent ont une réduction. Ils regardent vos statuts jusqu\'au bout !</span>'+
  C.map(c=>{const on=c.actif&&new Date(c.fin)>Date.now(),txt='🎁 CHASSE AUX CODES ! Code secret : '+c.code+' → -'+c.remise+' % chez '+s.nom+'. Entrez-le sur '+origin()+'/#codes avant '+new Date(c.fin).toLocaleDateString('fr-FR');
    return '<div class="mg-gs"><div class="row between"><b class="num">'+esc(c.code)+'</b><span class="badge '+(on?'b-orange':'b-grey')+'">-'+c.remise+' %'+(on?'':' · fini')+'</span></div><span class="small">Trouvé '+c.trouves+' fois · '+(on?'encore '+reste(c.fin):'terminé')+'</span>'+
    (on?'<div class="grid2"><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(txt)+'">'+g.ic('wa',16,'#fff')+'Mettre en statut</a><button type="button" class="btn btn-w btn-s" data-a="pxCodeFin" data-id="'+c.id+'">Arrêter</button></div>':'')+'</div>';}).join('')+
  '<form class="stack" data-f="pxCodeNew" style="gap:8px"><div class="grid2"><label class="lbl">Réduction (%)<input class="in" name="pct" type="number" min="1" max="90" value="10" required></label><label class="lbl">Durée<select class="in" name="j"><option value="1">1 jour</option><option value="3" selected>3 jours</option><option value="7">1 semaine</option></select></label></div><button class="btn btn-o btn-block" type="submit">Créer un code secret</button></form></section>';
}
function nouveauCode(s){const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789',p=norm(s.nom).replace(/[^a-z]/g,'').toUpperCase().slice(0,4)||'GBAI';let r='';const a=new Uint32Array(5);(crypto.getRandomValues?crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.random()*1e9));a.forEach(x=>r+=A[x%A.length]);return p+'-'+r;}

/* ---------- Actions et formulaires ---------- */
function brancher(){
  const g=G();if(!g||X.ok)return;X.ok=true;
  Object.assign(g.A,{
    pxFill:()=>pxFill(),
    pxV360del:t=>g.act(()=>g.q(g.sb.from('products').update({vue360:[]}).eq('id',t.dataset.id)),'Photo 360° retirée'),
    pxTr:t=>pxTr(t),
    pxPrends:t=>{g.addToCart(t.dataset.id);rerender();},
    pxPos:()=>g.geo(p=>{X.pos=p;rerender();}),
    pxCoach:t=>pxCoach(t),
    pxLiveFin:t=>g.act(()=>g.q(g.sb.from('lives').update({actif:false}).eq('id',t.dataset.id)),'Direct terminé'),
    pxGFin:t=>g.act(()=>g.q(g.sb.from('groupes').update({actif:false}).eq('id',t.dataset.id)),'Achat groupé arrêté'),
    pxCodeFin:t=>g.act(()=>g.q(g.sb.from('codes_chasse').update({actif:false}).eq('id',t.dataset.id)),'Code arrêté'),
  });
  Object.assign(g.FORMS,{
    pxJoin:async d=>{const tel=String(d.tel||'').replace(/\D/g,'');if(tel.length<8)return toast('Numéro WhatsApp invalide');
      try{const nb=await g.q(g.sb.rpc('groupe_rejoindre',{gid:d.gid,n:String(d.nom||'').slice(0,60),t:tel}));const m=LS('gbairai-groupes',{});m[d.gid]={tel:d.tel,ts:Date.now()};LSset('gbairai-groupes',m);g.S.gNb[d.gid]=nb;rerender();toast('👥 Vous êtes dans le groupe ! Invitez vos amis');}
      catch(e){toast(g.errMsg(e));}},
    pxLive:(d,f)=>{const s=g.myShop(),url=String(d.url||'').trim();if(!/^https:\/\//i.test(url))return toast('Collez le lien complet du direct (https://…)');
      const ids=[...f.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.name.slice(2));
      g.act(async()=>{await g.safe(g.sb.from('lives').update({actif:false}).eq('shop_id',s.id).eq('actif',true));await g.q(g.sb.from('lives').insert({shop_id:s.id,url:url.slice(0,300),titre:String(d.titre||'').slice(0,80),produits:ids}));},'🔴 Direct lancé ! Annoncez-le sur votre statut');},
    pxGroupe:d=>{const s=g.myShop(),p=g.prodById(d.pid),pr=parseInt(String(d.prix).replace(/\D/g,''),10),ob=parseInt(d.obj,10);
      if(!p)return toast('Choisissez un produit');if(!pr||pr>=g.prix(p))return toast('Le prix du groupe doit être plus bas que '+fmt(g.prix(p))+' F');if(!(ob>=2&&ob<=50))return toast('Entre 2 et 50 personnes');
      g.act(()=>g.q(g.sb.from('groupes').insert({shop_id:s.id,product_id:p.id,prix_groupe:pr,objectif:ob,fin:new Date(Date.now()+(+d.h||48)*3600e3).toISOString()})),'👥 Achat groupé créé');},
    pxCodeNew:d=>{const s=g.myShop(),pct=parseInt(d.pct,10);if(!(pct>=1&&pct<=90))return toast('Réduction entre 1 et 90 %');
      g.act(()=>g.q(g.sb.from('codes_chasse').insert({shop_id:s.id,code:nouveauCode(s),remise:pct,fin:new Date(Date.now()+(+d.j||3)*864e5).toISOString()})),'🎁 Code créé : mettez-le dans votre statut');},
    pxCode:async d=>{const c=String(d.code||'').toUpperCase().replace(/\s/g,'');if(c.length<4)return toast('Code trop court');
      try{const r=await g.q(g.sb.rpc('code_trouve',{c}));const x=Array.isArray(r)?r[0]:r;if(!x)throw new Error('Code inconnu ou expiré.');
        const W=LS('gbairai-codes',[]).filter(k=>k.code!==c);W.push({code:c,shop:x.boutique,pct:x.pct,expire:x.expire});LSset('gbairai-codes',W);X.gagne={code:c,shop:x.boutique,pct:x.pct,expire:x.expire};rerender();}
      catch(e){toast(g.errMsg(e));}},
  });
}
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.px||!t.files||!t.files[0])return;
  if(t.dataset.px==='rphoto')photoSearch(t.files[0]);
  else if(t.dataset.px==='v360'){if(t.files[0].size>200e6)return toast('Vidéo trop lourde : filmez 10 secondes');v360(t.files[0],t.dataset.id);}
});

function route(h){
  if(h==='photo')return vPhoto();if(h==='pres')return vPres();if(h==='codes')return vCodes();
  if(h==='groupes')return vGroupes();if(h==='lives')return vLives();if(h.startsWith('live-'))return vLive(h.slice(5));
  return null;
}
window.GBX={load,route,home,homeSearch,produit,boutique,vendeur,formProduit,voixIA,panier,codeLine};
// Si l'appli a déjà fini de charger avant ce fichier : charger nos données, puis redessiner la page
function demarrer(){brancher();const g=G();if(g&&g.S.loaded)load().catch(()=>{}).then(()=>g.render(true));}
if(G())demarrer();else{const t=setInterval(()=>{if(G()){clearInterval(t);demarrer();}},300);}
})();
