/* Gbairai Market : les 10 nouvelles idées.
   1 Studio photo automatique · 2 Vidéo TikTok en 1 clic · 3 Vendeur IA 24 h/24 · 4 Essayage avec la caméra · 5 Cagnotte cadeau
   6 Payer en 3 fois · 7 Gbairai Coins · 8 L'heure magique (20 h) · 9 Livreur suivi en direct · 10 Prévisions de stock
   Ce fichier se branche après plus.js : il complète window.GBX (pages, boutons) et utilise window.GB (outils de l'appli). */
(function(){
'use strict';
const G=()=>window.GB;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const fmt=n=>Math.round(n||0).toLocaleString('fr-FR').replace(/[  ]/g,' ');
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const toast=t=>{const g=G();if(!g)return;const l=document.getElementById('layer');if(l&&l.querySelector('.modal')){const m=l.querySelector('[data-py-msg]');if(m){m.textContent=t;return;}}g.toast(t);};
const rerender=()=>{const g=G();if(g)g.render(true);};
const Y={chat:{},cg:{},cgOrg:{},pos:{},tr3:LS('gbairai-tr3',{}),coins:null};
const base=()=>location.origin+'/';
const D=864e5;
const jourFr=d=>new Date(d).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const dCourt=d=>new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
const shopOk=s=>s&&s.statut==='actif';
const layer=()=>document.getElementById('layer');
function modal(html,cls){layer().innerHTML='<div class="modal py-modal'+(cls?' '+cls:'')+'" data-a="closeModal"><div class="card stack py-sheet" data-stop="1">'+html+'</div></div>';return layer().querySelector('.py-sheet');}
function closeModal(){layer().innerHTML='';}
const waBtn=(num,txt,label,cls)=>'<a class="btn '+(cls||'btn-g')+' btn-s" target="_blank" rel="noopener" href="https://wa.me/'+(num?G().waNum(num):'')+'?text='+encodeURIComponent(txt)+'">'+G().ic('wa',16,'#fff')+label+'</a>';

/* ---------- IA (même passage que plus.js : /api/ia, la clé reste dans Vercel) ---------- */
async function ia(kind,body){
  const g=G(),h={'Content-Type':'application/json'};if(g.S.token)h.Authorization='Bearer '+g.S.token;
  let r;try{r=await fetch('/api/ia',{method:'POST',headers:h,body:JSON.stringify(Object.assign({kind},body))});}catch(e){throw new Error('Pas de connexion internet');}
  let j={};try{j=await r.json();}catch(e){}
  if(j.cle===false)throw new Error('IA_OFF');
  if(!r.ok||!j.ok)throw new Error(j.error||'L\'IA ne répond pas pour le moment');
  return j.data;
}
const iaMsg=e=>e&&e.message==='IA_OFF'?'L\'IA n\'est pas encore activée sur le site (clé à ajouter dans Vercel)':(e&&e.message)||'Erreur';

/* ---------- Vision sur le téléphone (MediaPipe, gratuit, rien n'est envoyé) ---------- */
const MP=window.GB_MP||{lib:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21',
  seg:'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite',
  face:'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'};
let mpLib=null,mpFs=null,segP=null,faceP=null;
async function vision(){if(!mpLib){mpLib=await import(MP.lib+'/vision_bundle.mjs');mpFs=await mpLib.FilesetResolver.forVisionTasks(MP.lib+'/wasm');}return mpLib;}
function segmenter(){if(!segP)segP=vision().then(v=>v.InteractiveSegmenter.createFromOptions(mpFs,{baseOptions:{modelAssetPath:MP.seg,delegate:'CPU'},outputCategoryMask:false,outputConfidenceMasks:true})).catch(e=>{segP=null;throw e;});return segP;}
function faceDet(){if(!faceP)faceP=vision().then(v=>v.FaceDetector.createFromOptions(mpFs,{baseOptions:{modelAssetPath:MP.face,delegate:'CPU'},runningMode:'VIDEO',minDetectionConfidence:.5})).catch(e=>{faceP=null;throw e;});return faceP;}
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>rej(new Error('Photo illisible'));i.src=src;});}
async function imgFromUrl(u){try{const r=await fetch(u,{mode:'cors'});if(!r.ok)throw 0;const b=await r.blob();return await loadImg(URL.createObjectURL(b));}catch(e){return loadImg(u);}}
// Détourer l'objet au centre de la photo : renvoie un canvas transparent recadré, ou null si l'objet n'est pas net
async function detourer(img){
  const seg=await segmenter(),W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,k=Math.min(1,768/Math.max(W,H));
  const src=canvas(Math.round(W*k),Math.round(H*k));src.getContext('2d').drawImage(img,0,0,src.width,src.height);
  const r=seg.segment(src,{keypoint:{x:.5,y:.5}}),m=r.confidenceMasks[0],f=m.getAsFloat32Array(),mw=m.width,mh=m.height;
  const x=src.getContext('2d'),id=x.getImageData(0,0,src.width,src.height),d=id.data;
  let x0=mw,y0=mh,x1=0,y1=0,n=0;
  for(let yy=0;yy<src.height;yy++)for(let xx=0;xx<src.width;xx++){
    const mi=Math.floor(yy*mh/src.height)*mw+Math.floor(xx*mw/src.width),a=Math.max(0,Math.min(1,(f[mi]-.25)/.5));
    d[(yy*src.width+xx)*4+3]=Math.round(a*255);
    if(a>.5){n++;if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy;}}
  r.close&&r.close();
  const frac=n/(src.width*src.height);if(frac<.03||frac>.95)return null;
  x.putImageData(id,0,0);
  const pad=6;x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(src.width-1,x1+pad);y1=Math.min(src.height-1,y1+pad);
  const out=canvas(x1-x0+1,y1-y0+1);out.getContext('2d').drawImage(src,x0,y0,out.width,out.height,0,0,out.width,out.height);
  return out;
}

/* =====================================================================
   1. STUDIO PHOTO : fond enlevé, fond propre, lumière, ombre, nom de la boutique
   ===================================================================== */
const FONDS=[['blanc','Blanc'],['orange','Orange'],['wax','Wax'],['nuit','Nuit']];
function peindreFond(x,w,h,f){
  if(f==='blanc'){const g=x.createRadialGradient(w/2,h*.45,w*.1,w/2,h/2,w*.75);g.addColorStop(0,'#FFFFFF');g.addColorStop(1,'#F1EEF7');x.fillStyle=g;x.fillRect(0,0,w,h);}
  else if(f==='orange'){const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#FFD9B0');g.addColorStop(1,'#FF9A4D');x.fillStyle=g;x.fillRect(0,0,w,h);}
  else if(f==='nuit'){const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#3B1A78');g.addColorStop(1,'#140A2B');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<5;i++){x.beginPath();x.arc(w*(.1+i*.22),h*(.15+(i%2)*.7),w*.12,0,7);x.fill();}}
  else{ // wax : motif géométrique en losanges et cercles
    x.fillStyle='#1E3A8A';x.fillRect(0,0,w,h);const s=w/6,C=['#F59E0B','#DC2626','#FBBF24','#0E7A5F'];
    for(let i=-1;i<7;i++)for(let j=-1;j<7;j++){const cx=i*s+(j%2?s/2:0),cy=j*s;x.fillStyle=C[(i+j+8)%4];x.beginPath();x.moveTo(cx,cy-s/2);x.lineTo(cx+s/2,cy);x.lineTo(cx,cy+s/2);x.lineTo(cx-s/2,cy);x.closePath();x.fill();
      x.fillStyle='#1E3A8A';x.beginPath();x.arc(cx,cy,s*.2,0,7);x.fill();x.fillStyle='#FFF7E6';x.beginPath();x.arc(cx,cy,s*.09,0,7);x.fill();}
    x.fillStyle='rgba(20,10,43,.18)';x.fillRect(0,0,w,h);}
}
function studioRendu(st){
  const W=1080,c=canvas(W,W),x=c.getContext('2d');peindreFond(x,W,W,st.fond);
  const sombre=st.fond==='nuit'||st.fond==='wax';
  if(st.cut){
    const o=st.cut,k=Math.min(W*.74/o.width,W*.7/o.height),w=o.width*k,h=o.height*k,px=(W-w)/2,py=(W-h)/2-W*.02;
    if(st.ombre){x.save();x.fillStyle=sombre?'rgba(0,0,0,.45)':'rgba(40,20,80,.22)';x.filter='blur(18px)';x.beginPath();x.ellipse(W/2,py+h+W*.015,w*.42,W*.028,0,0,7);x.fill();x.restore();}
    x.save();if(st.lumiere)x.filter='brightness(1.07) contrast(1.08) saturate(1.12)';x.drawImage(o,px,py,w,h);x.restore();
  }else{ // fond non enlevé : la photo devient une carte propre, éclairée, sur le fond choisi
    const im=st.img,iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,k=Math.min(W*.8/iw,W*.8/ih),w=iw*k,h=ih*k,px=(W-w)/2,py=(W-h)/2;
    x.save();if(st.ombre){x.shadowColor='rgba(20,10,43,.35)';x.shadowBlur=40;x.shadowOffsetY=18;}x.beginPath();x.roundRect?x.roundRect(px,py,w,h,36):x.rect(px,py,w,h);x.fillStyle='#fff';x.fill();x.restore();
    x.save();x.beginPath();x.roundRect?x.roundRect(px,py,w,h,36):x.rect(px,py,w,h);x.clip();if(st.lumiere)x.filter='brightness(1.08) contrast(1.08) saturate(1.12)';x.drawImage(im,px,py,w,h);x.restore();
  }
  if(st.logo&&st.nom){x.font='700 30px Sora, Inter, Arial, sans-serif';const t='🛍 '+st.nom,tw=x.measureText(t).width+40;
    x.fillStyle=sombre?'rgba(255,255,255,.9)':'rgba(27,16,51,.82)';x.beginPath();x.roundRect?x.roundRect(W-tw-30,W-78,tw,50,25):x.rect(W-tw-30,W-78,tw,50);x.fill();
    x.fillStyle=sombre?'#1B1033':'#fff';x.textBaseline='middle';x.fillText(t,W-tw-10,W-53);}
  return c;
}
async function studioOuvrir(){
  const g=G();g.keepForm();
  let src=null;if(g.ui.photo&&g.ui.photo.url)src=g.ui.photo.url;else{const p=g.prodById(g.ui.edit);if(p&&p.photo)src=p.photo;}
  if(!src)return toast('Ajoutez d\'abord une photo');
  const s=g.myShop();
  const st=Y.st={fond:'blanc',lumiere:true,ombre:true,logo:true,nom:s?s.nom:'',cut:null,etat:'load'};
  studioDessin();
  try{st.img=src.startsWith('blob:')?await loadImg(src):await imgFromUrl(src);studioDessin();}catch(e){st.etat='err';studioDessin();return;}
  try{st.cut=await detourer(st.img);st.etat=st.cut?'ok':'sans';}catch(e){st.etat='sans';}
  if(Y.st===st)studioDessin();
}
function studioDessin(){
  const st=Y.st;if(!st)return;
  const msg=st.etat==='load'?'✨ Je détoure votre article… (la 1re fois, quelques secondes)':st.etat==='err'?'Photo illisible : essayez une autre photo.':st.etat==='sans'?'Le fond n\'a pas pu être enlevé (photo floue ou objet au bord). La photo est quand même embellie.':'✔ Fond enlevé';
  const box=modal('<div class="row between"><b style="font-size:17px">🪄 Studio photo</b><button type="button" class="linkbtn" data-a="closeModal">Fermer</button></div>'+
    '<div class="grid2 py-ba"><div><span class="small muted">Avant</span><div class="py-ba-img" id="py-avant"></div></div><div><span class="small" style="color:#7C3AED;font-weight:700">Après ✨</span><div class="py-ba-img" id="py-apres"></div></div></div>'+
    '<span class="small muted" data-py-msg>'+esc(msg)+'</span>'+
    '<div class="stack" style="gap:6px"><b class="small">Choisir le fond</b><div class="row" style="gap:10px">'+FONDS.map(f=>'<button type="button" class="py-fond py-f-'+f[0]+(st.fond===f[0]?' on':'')+'" data-a="pyFond" data-id="'+f[0]+'" aria-label="Fond '+f[1]+'"></button>').join('')+'</div><span class="small muted">'+FONDS.map(f=>f[1]).join(' · ')+'</span></div>'+
    '<div class="py-opts">'+[['lumiere','Lumière corrigée'],['ombre','Ombre douce'],['logo','Nom de la boutique']].map(o=>'<label class="row between"><span>'+o[1]+'</span><input type="checkbox" data-py-opt="'+o[0]+'"'+(st[o[0]]?' checked':'')+'></label>').join('')+'</div>'+
    '<button type="button" class="btn btn-o btn-block" data-a="pyStudioOk"'+(st.img&&st.etat!=='load'?'':' disabled')+'>✔ Utiliser cette photo</button>');
  if(st.img){const a=box.querySelector('#py-avant');const im=new Image();im.src=st.img.src;a.appendChild(im);
    if(st.etat!=='load'){const c=studioRendu(st);c.className='py-canvas';box.querySelector('#py-apres').appendChild(c);}else box.querySelector('#py-apres').innerHTML='<div class="py-spin"></div>';}
}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.pyOpt&&Y.st){Y.st[t.dataset.pyOpt]=t.checked;studioDessin();}});
async function studioOk(){
  const g=G(),st=Y.st;if(!st||!st.img)return;
  const c=studioRendu(st);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.86));if(!blob)return toast('Échec');
  Y.st=null;closeModal();g.keepForm();g.ui.photo={blob,url:URL.createObjectURL(blob)};rerender();g.restoreForm();g.toast('🪄 Photo du studio prête : enregistrez le produit');
}

/* =====================================================================
   2. VIDÉO TIKTOK EN 1 CLIC : 15 secondes, photos animées, prix, musique
   ===================================================================== */
const STYLES_TXT={nouveau:'NOUVEAU 🔥',promo:'PROMO ⚡',arrivage:'ARRIVAGE 📦',dispo:'DISPONIBLE ✅'};
function videoOuvrir(pid){
  const g=G(),p=g.prodById(pid);if(!p)return;
  Y.vid={pid,txt:Y.vid&&Y.vid.txt||'nouveau',musique:Y.vid&&Y.vid.musique||'coupe',etat:'pret'};videoDessin();
}
function videoDessin(){
  const g=G(),v=Y.vid,p=g.prodById(v.pid);if(!p)return;
  let h='<div class="row between"><b style="font-size:17px">🎬 Vidéo TikTok en 1 clic</b><button type="button" class="linkbtn" data-a="pyVidStop">Fermer</button></div>';
  if(v.etat==='fini'){
    h+='<video class="py-vid" src="'+v.url+'" controls playsinline autoplay loop></video><span class="small muted" data-py-msg>Vidéo prête ('+(v.ext==='mp4'?'MP4':'WebM')+', 15 s). Publiez-la sur TikTok, votre statut WhatsApp ou Facebook.</span>'+
      '<div class="grid2"><a class="btn btn-w" href="'+v.url+'" download="'+esc((p.nom||'video').replace(/[^\w\- ]+/g,'').slice(0,40)||'video')+'.'+v.ext+'">⬇ Télécharger</a><button type="button" class="btn btn-g" data-a="pyVidShare">Partager</button></div>'+
      '<button type="button" class="linkbtn" data-a="pyVidRedo">Refaire avec un autre style</button>';
  }else{
    h+='<div class="py-vid-wrap"><canvas id="py-vcan" width="720" height="1280" class="py-vid"></canvas>'+(v.etat==='rec'?'<span class="py-rec">● REC</span>':'')+'</div>'+
      '<span class="small muted" data-py-msg>'+(v.etat==='rec'?'Enregistrement… gardez cette page ouverte (15 s).':'Les photos de l\'article deviennent une vidéo animée avec le prix et la musique.')+'</span>';
    if(v.etat==='pret')h+='<div class="stack" style="gap:6px"><b class="small">Texte</b><div class="row wrapx" style="gap:6px">'+Object.keys(STYLES_TXT).map(k=>'<button type="button" class="chip'+(v.txt===k?' on':'')+'" data-a="pyVidTxt" data-id="'+k+'">'+STYLES_TXT[k]+'</button>').join('')+'</div>'+
      '<b class="small">Musique</b><div class="row wrapx" style="gap:6px">'+[['coupe','🎵 Coupé-décalé'],['doux','🎶 Douce'],['aucune','🔇 Sans musique']].map(m=>'<button type="button" class="chip'+(v.musique===m[0]?' on':'')+'" data-a="pyVidMus" data-id="'+m[0]+'">'+m[1]+'</button>').join('')+'</div></div>'+
      '<button type="button" class="btn btn-o btn-block" data-a="pyVidGo">🎬 Créer la vidéo</button>';
  }
  modal(h,'py-dark');
  if(v.etat==='pret')videoApercu();
}
async function videoImages(p){
  const g=G(),urls=g.photosOf(p).slice(0,5),out=[];
  for(const u of urls){try{out.push(await imgFromUrl(u));}catch(e){}}
  return out;
}
// Dessine l'image t (en secondes) de la vidéo
function videoFrame(x,t,o){
  const W=720,H=1280,T=15,imgs=o.imgs,p=o.p,s=o.s,beat=(t*2)%1;
  x.fillStyle='#140A2B';x.fillRect(0,0,W,H);
  const fin=T-3.2;
  if(imgs.length){
    const n=imgs.length,dur=fin/n,i=Math.min(n-1,Math.floor(Math.min(t,fin-.01)/dur)),lt=(Math.min(t,fin)-i*dur)/dur;
    const draw=(im,a,z)=>{const iw=im.naturalWidth,ih=im.naturalHeight,k=Math.max(W/iw,H/ih)*z,w=iw*k,h=ih*k;x.globalAlpha=a;x.drawImage(im,(W-w)/2+(i%2?-1:1)*20*z,(H-h)/2,w,h);x.globalAlpha=1;};
    draw(imgs[i],1,1+.14*lt);
    if(lt>.85&&i<n-1)draw(imgs[i+1],(lt-.85)/.15,1);
  }
  // dégradés haut et bas pour lire le texte
  let gr=x.createLinearGradient(0,0,0,H*.35);gr.addColorStop(0,'rgba(20,10,43,.75)');gr.addColorStop(1,'rgba(20,10,43,0)');x.fillStyle=gr;x.fillRect(0,0,W,H*.35);
  gr=x.createLinearGradient(0,H*.55,0,H);gr.addColorStop(0,'rgba(20,10,43,0)');gr.addColorStop(1,'rgba(20,10,43,.9)');x.fillStyle=gr;x.fillRect(0,H*.55,W,H*.45);
  x.textAlign='center';x.textBaseline='middle';
  // titre qui arrive en zoom
  if(t<fin){
    const a=Math.min(1,t/.6),z=1+(1-a)*.6+(t<2?0:.03*Math.sin(t*Math.PI*2));
    x.save();x.translate(W/2,H*.36);x.scale(z,z);x.globalAlpha=a;
    x.font='800 84px Sora, Inter, Arial, sans-serif';x.fillStyle='#fff';x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=18;x.fillText(STYLES_TXT[o.txt]||STYLES_TXT.nouveau,0,0);
    x.font='800 64px Sora, Inter, Arial, sans-serif';x.fillStyle='#FF8A2B';
    const nom=p.nom.length>22?p.nom.slice(0,21)+'…':p.nom;x.fillText(nom,0,92);x.restore();
  }
  // prix qui bat au rythme
  if(t>1.2&&t<fin){
    const a=Math.min(1,(t-1.2)/.4),z=1+.06*(1-beat)*(o.musique!=='aucune'?1:0);
    x.save();x.translate(W/2-120+(1-a)*-300,H*.8);x.scale(z,z);x.globalAlpha=a;
    x.textAlign='left';x.font='800 96px Sora, Inter, Arial, sans-serif';x.fillStyle='#fff';x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=14;x.fillText(fmt(G().prix(p))+' F',-150,0);x.restore();
    x.globalAlpha=a;x.textAlign='left';x.font='600 36px Inter, Arial, sans-serif';x.fillStyle='#fff';x.fillText(s.nom+' · '+(s.quartier||s.ville||''),60,H*.8+80);
    x.fillStyle='rgba(255,255,255,.2)';x.beginPath();x.roundRect?x.roundRect(60,H*.8+120,330,52,26):x.rect(60,H*.8+120,330,52);x.fill();
    x.fillStyle='#fff';x.font='600 28px Inter, Arial, sans-serif';x.fillText((o.musique==='aucune'?'🛍 ':'🎵 ')+'Commandez sur WhatsApp',80,H*.8+147);x.globalAlpha=1;
  }
  // fin : carte de la boutique
  if(t>=fin){
    const a=Math.min(1,(t-fin)/.5);x.globalAlpha=a;const g2=x.createLinearGradient(0,0,W,H);g2.addColorStop(0,'#5B21B6');g2.addColorStop(1,'#FF7A1A');x.fillStyle=g2;x.fillRect(0,0,W,H);
    x.textAlign='center';x.fillStyle='#fff';x.font='800 70px Sora, Inter, Arial, sans-serif';x.fillText(s.nom.length>18?s.nom.slice(0,17)+'…':s.nom,W/2,H*.38);
    x.font='600 40px Inter, Arial, sans-serif';x.fillText('📍 '+(s.quartier?s.quartier+', ':'')+(s.ville||''),W/2,H*.38+80);
    x.font='800 56px Sora, Inter, Arial, sans-serif';x.fillText(fmt(G().prix(p))+' FCFA',W/2,H*.55);
    x.fillStyle='#fff';x.beginPath();x.roundRect?x.roundRect(W/2-300,H*.66,600,96,48):x.rect(W/2-300,H*.66,600,96);x.fill();
    x.fillStyle='#5B21B6';x.font='800 38px Sora, Inter, Arial, sans-serif';x.fillText('Commandez sur Gbairai Market',W/2,H*.66+50);
    x.fillStyle='#fff';x.font='600 30px Inter, Arial, sans-serif';x.fillText(location.host+'/b/'+s.slug,W/2,H*.66+150);x.globalAlpha=1;
  }
}
// Petite musique faite sur le téléphone (aucun droit d'auteur) : rythme coupé-décalé ou ambiance douce
function musique(ac,dest,style,t0,T){
  if(style==='aucune')return;
  const bpm=style==='doux'?92:122,b=60/bpm,master=ac.createGain();master.gain.value=style==='doux'?.5:.42;master.connect(dest);
  const env=(g,t,a,d,v)=>{g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);};
  const osc=(type,f,t,a,d,v,f2)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+a+d);env(g,t,a,d,v);o.connect(g);g.connect(master);o.start(t);o.stop(t+a+d+.05);};
  const bruit=(t,d,v,hp)=>{const len=Math.floor(ac.sampleRate*d),buf=ac.createBuffer(1,len,ac.sampleRate),c=buf.getChannelData(0);for(let i=0;i<len;i++)c[i]=Math.random()*2-1;
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type='highpass';f.frequency.value=hp;s.buffer=buf;env(g,t,.002,d,v);s.connect(f);f.connect(g);g.connect(master);s.start(t);};
  const gamme=[220,247,277,330,370,440,494,554,659];
  const basse=style==='doux'?[110,110,98,82]:[110,110,147,131,98,98,123,110];
  const melo=style==='doux'?[4,5,7,5,4,3,4,2]:[5,7,8,7,5,4,5,7,8,7,5,3,4,5,4,3];
  for(let i=0;t0+i*b/2<t0+T;i++){const t=t0+i*b/2,beat=i%8;
    if(style==='doux'){if(beat%4===0)osc('sine',60,t,.005,.35,.7,40);if(i%2===0)osc('triangle',basse[(i/2|0)%basse.length],t,.02,b*.9,.25);if(i%2===0)osc('sine',gamme[melo[(i/2|0)%melo.length]],t,.03,b*.8,.12);bruit(t,.03,.05,7000);}
    else{if(beat===0||beat===3||beat===6)osc('sine',70,t,.003,.22,.95,40);if(beat===2||beat===6)bruit(t,.12,.35,1500);bruit(t,.04,i%2?.12:.2,6000);
      osc('sawtooth',basse[i%basse.length]/2,t,.005,b*.4,.16);osc('square',gamme[melo[i%melo.length]],t,.005,b*.35,.06);
      if(i%4===2)osc('triangle',gamme[melo[(i+3)%melo.length]]*2,t,.005,.12,.05);}
  }
}
let apercuT=null;
async function videoApercu(){
  const g=G(),v=Y.vid,p=g.prodById(v.pid),s=g.shopById(p.shop_id);
  if(!v.imgs)v.imgs=await videoImages(p);
  const c=document.getElementById('py-vcan');if(!c)return;const x=c.getContext('2d'),t0=performance.now();
  cancelAnimationFrame(apercuT);
  const loop=()=>{const cc=document.getElementById('py-vcan');if(!cc||!Y.vid||Y.vid.etat!=='pret')return;videoFrame(x,((performance.now()-t0)/1000)%15,{imgs:v.imgs,p,s,txt:v.txt,musique:v.musique});apercuT=requestAnimationFrame(loop);};loop();
}
async function videoGo(){
  const g=G(),v=Y.vid,p=g.prodById(v.pid),s=g.shopById(p.shop_id);
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return toast('Ce téléphone ne sait pas créer de vidéo. Essayez avec Chrome.');
  if(!v.imgs)v.imgs=await videoImages(p);
  if(!v.imgs.length)return toast('Ajoutez une photo à cet article');
  v.etat='rec';cancelAnimationFrame(apercuT);videoDessin();
  const c=document.getElementById('py-vcan'),x=c.getContext('2d'),T=15;
  let ac=null,dest=null;
  try{if(v.musique!=='aucune'){ac=new (window.AudioContext||window.webkitAudioContext)();await ac.resume();dest=ac.createMediaStreamDestination();}}catch(e){ac=null;}
  const stream=c.captureStream(30);if(dest)dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const type=types.find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
  let rec;try{rec=new MediaRecorder(stream,type?{mimeType:type,videoBitsPerSecond:3e6}:undefined);}catch(e){v.etat='pret';videoDessin();return toast('Enregistrement impossible sur ce téléphone');}
  const parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data);};
  const done=new Promise(r=>rec.onstop=r);
  if(ac)musique(ac,dest,v.musique,ac.currentTime+.05,T);
  rec.start(500);const t0=performance.now();
  await new Promise(res=>{const step=()=>{const t=(performance.now()-t0)/1000;if(!Y.vid||Y.vid.etat!=='rec'){res();return;}videoFrame(x,Math.min(t,T),{imgs:v.imgs,p,s,txt:v.txt,musique:v.musique});if(t>=T){res();return;}requestAnimationFrame(step);};step();});
  try{rec.stop();}catch(e){}await done;if(ac)ac.close();
  if(!Y.vid||Y.vid.etat!=='rec')return;
  const mime=(rec.mimeType||type||'video/webm').split(';')[0];v.blob=new Blob(parts,{type:mime});v.ext=/mp4/.test(mime)?'mp4':'webm';v.url=URL.createObjectURL(v.blob);v.etat='fini';videoDessin();
}
async function videoShare(){
  const g=G(),v=Y.vid;if(!v||!v.blob)return;const p=g.prodById(v.pid);
  const f=new File([v.blob],'gbairai-'+(p?p.id.slice(0,6):'video')+'.'+v.ext,{type:v.blob.type});
  const txt=p?p.nom+' à '+fmt(g.prix(p))+' F 🔥 Commandez ici : '+g.prodUrl(p):'';
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:txt});return;}}catch(e){if(e&&e.name==='AbortError')return;}
  toast('Partage direct impossible : touchez « Télécharger », puis publiez la vidéo depuis votre galerie.');
}

/* =====================================================================
   3. VENDEUR IA 24 H/24 : répond aux clients de la boutique, même la nuit
   ===================================================================== */
function assistantCarte(s){
  if(s.assistant===false)return '';
  return '<a class="card row py-iacard" href="#assistant-'+esc(s.slug)+'"><span class="py-bot">🤖</span><span class="grow" style="min-width:0"><b>Posez vos questions à l\'assistant</b><span class="small">Tailles, prix, livraison… il répond tout de suite, 24 h/24</span></span><span class="py-online">● en ligne</span></a>';
}
const chatKey=s=>'gbairai-ia-'+s.id;
function vAssistant(slug){
  const g=G(),s=g.S.shops.find(x=>x.slug===slug);
  if(!s||!shopOk(s)||s.assistant===false)return '<div class="wrap">'+g.back('#accueil')+'<div class="card"><h2>Assistant indisponible</h2><p class="muted">Écrivez directement au vendeur sur WhatsApp.</p></div></div>';
  const C=Y.chat[s.id]||(Y.chat[s.id]=LS(chatKey(s),[]));
  const nC=g.getCart().reduce((a,x)=>{const p=g.prodById(x.pid);return a+(p&&p.shop_id===s.id?x.qty:0);},0);
  const sugg=['Qu\'est-ce que vous avez de nouveau ?','Vous livrez dans quel quartier ?','Qu\'est-ce qui est en promo ?','Comment je paie ?'];
  let h='<div class="wrap narrow py-chatpage"><div class="row between">'+g.back('#boutique-'+esc(s.slug),esc(s.nom))+'<span class="py-online">● en ligne</span></div>'+
    '<div class="row" style="gap:10px">'+g.avatar(s,44)+'<div><b>🤖 Assistant de '+esc(s.nom)+'</b><div class="small muted">Répond à la place du vendeur, même la nuit. Le vendeur confirme ensuite.</div></div></div>'+
    '<div class="py-chat" id="py-chat">'+
    '<div class="py-msg ia">Bonjour 👋 Je suis l\'assistant de <b>'+esc(s.nom)+'</b>. Posez-moi vos questions sur les articles, les tailles, les prix ou la livraison.</div>'+
    C.map(m=>'<div class="py-msg '+(m.r==='client'?'moi':'ia')+'">'+esc(m.t).replace(/\n/g,'<br>')+'</div>'+(m.p&&m.p.length?'<div class="py-prods">'+m.p.map(id=>{const p=g.prodById(id);return p&&p.visible?'<div class="py-prod"><a href="#produit-'+p.id+'" style="width:52px;flex:none">'+g.tile(p,52,22)+'</a><a href="#produit-'+p.id+'" class="grow" style="min-width:0;text-decoration:none;color:inherit"><b class="ell" style="display:block">'+esc(p.nom)+'</b><span class="small" style="color:#C2410C;font-weight:800">'+fmt(g.prix(p))+' F</span></a>'+(p.stock>0?'<button type="button" class="btn btn-o btn-s" data-a="pxPrends" data-id="'+p.id+'" aria-label="Ajouter au panier">+</button>':'')+'</div>':'';}).join('')+'</div>':'')).join('')+
    (Y.chatBusy===s.id?'<div class="py-msg ia py-typing"><i></i><i></i><i></i></div>':'')+'</div>'+
    (C.length?'':'<div class="row wrapx" style="gap:6px">'+sugg.map(q=>'<button type="button" class="chip" data-a="pyAsk" data-q="'+esc(q)+'" data-id="'+s.id+'">'+esc(q)+'</button>').join('')+'</div>')+
    '<form class="row py-chatin" data-f="pyAsk" data-id="'+s.id+'"><input class="in" name="q" maxlength="400" autocomplete="off" placeholder="Votre question…" required><button class="btn btn-v" type="submit"'+(Y.chatBusy?' disabled':'')+'>Envoyer</button></form>'+
    '<div class="grid2">'+(nC?'<a class="btn btn-o btn-s" href="#panier">🛒 Voir mon panier ('+nC+')</a>':'<a class="btn btn-w btn-s" href="#boutique-'+esc(s.slug)+'">Voir la boutique</a>')+waBtn(s.whatsapp,'Bonjour '+s.nom+', ','Le vendeur')+'</div>'+
    (C.length?'<button type="button" class="linkbtn" data-a="pyChatRaz" data-id="'+s.id+'">Effacer la discussion</button>':'')+'</div>';
  setTimeout(()=>{const b=document.getElementById('py-chat');if(b)b.scrollTop=b.scrollHeight;},30);
  return h;
}
async function assistantDemande(sid,q){
  const g=G(),s=g.shopById(sid);q=String(q||'').trim().slice(0,400);if(!s||!q||Y.chatBusy)return;
  const C=Y.chat[sid]||(Y.chat[sid]=LS(chatKey(s),[]));C.push({r:'client',t:q});Y.chatBusy=sid;rerender();
  const prods=g.shopProducts(s.id).filter(p=>p.visible).slice(0,150).map(p=>({id:p.id,nom:p.nom,prix:g.prix(p),prix_habituel:g.prixBase(p)!==g.prix(p)?g.prixBase(p):undefined,stock:p.stock,tailles:p.tailles||'',rayon:p.categorie,type:p.type||'',description:String(p.description||'').slice(0,220)}));
  const now=new Date();
  try{
    const d=await ia('assistant',{boutique:{nom:s.nom,ville:s.ville||'',quartier:s.quartier||'',description:String(s.description||'').slice(0,400),livraison_zones:s.livraison_zones||'',livraison_frais:s.livraison_frais||'',paiement_a_la_livraison:s.paiement_livraison!==false,paiement_en_3_fois:!!s.tranches,accepte_coins:!!s.coins_ok,consignes:s.assistant_info||''},
      produits:prods,historique:C.slice(-11,-1).map(m=>({role:m.r,texte:m.t})),question:q,heure:now.getHours()+'h'+String(now.getMinutes()).padStart(2,'0')});
    const ok=new Set(prods.map(p=>p.id));const montrer=(d.produits||[]).filter(id=>ok.has(id)).slice(0,6);
    let t=String(d.reponse||'').slice(0,1200);
    (d.ajouter_au_panier||[]).filter(a=>ok.has(a.id)).slice(0,5).forEach(a=>{const p=g.prodById(a.id);if(p&&p.stock>0){g.addToCart(p.id,a.taille||null);if(!montrer.includes(p.id))montrer.push(p.id);}});
    C.push({r:'ia',t,p:montrer});
  }catch(e){C.push({r:'ia',t:e.message==='IA_OFF'?'Je ne suis pas encore activé. Écrivez au vendeur sur WhatsApp, il vous répond vite.':'Désolé, je n\'arrive pas à répondre maintenant ('+iaMsg(e)+'). Réessayez ou écrivez au vendeur.'});}
  Y.chat[sid]=C.slice(-30);LSset(chatKey(s),Y.chat[sid]);Y.chatBusy=null;rerender();
}

/* =====================================================================
   4. ESSAYAGE AVEC LA CAMÉRA : lunettes, boucles, colliers, chapeaux, montres
   ===================================================================== */
function genreEssai(p){
  const t=norm(p.nom+' '+(p.type||'')+' '+(p.categorie||''));
  if(/lunette/.test(t))return 'lunettes';
  if(/boucle|oreille|creole/.test(t))return 'boucles';
  if(/collier|chaine|pendentif|sautoir|parure/.test(t))return 'collier';
  if(/chapeau|casquette|bonnet|perruque|foulard|turban|bob\b/.test(t))return 'tete';
  if(/montre|bracelet|bague|jonc/.test(t))return 'main';
  if(p.categorie==='bijoux'||p.categorie==='montres')return p.categorie==='montres'?'main':'collier';
  return null;
}
const ESSAI_TXT={lunettes:'Lunettes',boucles:'Boucles d\'oreilles',collier:'Collier',tete:'Sur la tête',main:'Au poignet ou à la main'};
const T_={};
async function essaiOuvrir(pid){
  const g=G(),p=g.prodById(pid);if(!p)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return toast('La caméra n\'est pas disponible sur ce téléphone');
  const s=g.shopById(p.shop_id),autres=g.shopProducts(s.id).filter(x=>x.visible&&x.photo&&genreEssai(x)).slice(0,8);if(!autres.find(x=>x.id===p.id))autres.unshift(p);
  T_.pid=p.id;T_.autres=autres.map(x=>x.id);T_.k=1;T_.dx=0;T_.dy=0;T_.cut={};
  modal('<div class="py-try"><video id="py-tv" playsinline muted autoplay></video><canvas id="py-tc"></canvas><span class="py-tlabel">📷 Caméra avant · en direct</span><button type="button" class="py-tclose" data-a="pyTryStop" aria-label="Fermer">✕</button><span class="py-thint" data-py-msg>Ouverture de la caméra…</span></div>'+
    '<div class="stack py-tbar" style="gap:8px"><div class="row between"><b id="py-tnom" class="ell"></b><b id="py-tprix" style="color:#C2410C"></b></div>'+
    '<div class="py-tpick">'+autres.map(x=>'<button type="button" data-a="pyTryPick" data-id="'+x.id+'" class="'+(x.id===p.id?'on':'')+'">'+g.tile(x,54,24)+'</button>').join('')+'</div>'+
    '<label class="row small" style="gap:8px">Taille<input type="range" min="0.5" max="2" step="0.05" value="1" id="py-tk" style="flex:1"></label>'+
    '<div class="grid2"><button type="button" class="btn btn-v" data-a="pyTryShot">📸 Photo</button><button type="button" class="btn btn-o" data-a="pyTryCart">Ajouter au panier</button></div></div>','py-dark py-full');
  essaiInfos();
  try{T_.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:720},height:{ideal:960}},audio:false});}
  catch(e){toast('Caméra refusée : autorisez-la dans les réglages du navigateur');return;}
  const v=document.getElementById('py-tv');if(!v){essaiStop();return;}v.srcObject=T_.stream;await v.play().catch(()=>{});
  toast(genreEssai(p)==='main'?'Montrez votre poignet, puis glissez l\'article dessus':'Regardez la caméra…');
  essaiPrepare(p.id);faceDet().then(f=>{T_.face=f;}).catch(()=>{T_.face=null;});
  const k=document.getElementById('py-tk');if(k)k.oninput=()=>{T_.k=+k.value;};
  const c=document.getElementById('py-tc');let drag=null;
  c.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,dx:T_.dx,dy:T_.dy};try{c.setPointerCapture(e.pointerId);}catch(_){}};
  c.onpointermove=e=>{if(!drag)return;const r=c.getBoundingClientRect();T_.dx=drag.dx+(e.clientX-drag.x)/r.width;T_.dy=drag.dy+(e.clientY-drag.y)/r.height;};
  c.onpointerup=c.onpointercancel=()=>{drag=null;};
  essaiBoucle();
}
function essaiInfos(){const g=G(),p=g.prodById(T_.pid);const n=document.getElementById('py-tnom'),pr=document.getElementById('py-tprix');if(n)n.textContent=(ESSAI_TXT[genreEssai(p)]||'')+' · '+p.nom;if(pr)pr.textContent=fmt(g.prix(p))+' F';
  document.querySelectorAll('.py-tpick button').forEach(b=>b.classList.toggle('on',b.dataset.id===T_.pid));}
async function essaiPrepare(pid){
  if(T_.cut[pid])return;const p=G().prodById(pid);T_.cut[pid]={etat:'load'};
  try{const im=await imgFromUrl(p.photo);T_.cut[pid]={etat:'photo',img:im};
    const c=await detourer(im).catch(()=>null);if(c)T_.cut[pid]={etat:'ok',img:c};}
  catch(e){T_.cut[pid]={etat:'err'};}
}
function essaiBoucle(){
  const v=document.getElementById('py-tv'),c=document.getElementById('py-tc');if(!v||!c){essaiStop();return;}
  if(v.videoWidth){if(c.width!==v.videoWidth){c.width=v.videoWidth;c.height=v.videoHeight;}
    const x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);
    const p=G().prodById(T_.pid),genre=genreEssai(p)||'main',cut=T_.cut[T_.pid];
    let kp=null;
    if(T_.face&&genre!=='main'){try{const r=T_.face.detectForVideo(v,performance.now());const d=r.detections&&r.detections[0];if(d&&d.keypoints&&d.keypoints.length>=6)kp=d.keypoints.map(k=>({x:k.x*W,y:k.y*H}));}catch(e){}}
    const hint=document.querySelector('[data-py-msg]');
    if(hint)hint.textContent=!cut||cut.etat==='load'?'Préparation de l\'article…':genre==='main'?'Glissez l\'article sur votre poignet · réglez la taille':kp?'Bougez la tête : l\'article suit':(T_.face===undefined?'Chargement de la détection du visage…':'Placez votre visage dans l\'écran');
    if(cut&&cut.img){
      const im=cut.img,iw=im.width||im.naturalWidth,ih=im.height||im.naturalHeight,ar=ih/iw;
      const put=(img,sx,sy,sw,sh,cx,cy,w,ang)=>{const h=w*(sh/sw);x.save();x.translate(cx,cy);x.rotate(ang||0);if(cut.etat!=='ok')x.globalCompositeOperation='multiply';x.drawImage(img,sx,sy,sw,sh,-w/2,-h/2,w,h);x.restore();};
      const ox=-T_.dx*W,oy=T_.dy*H;
      if(kp){
        const re=kp[0],le=kp[1],dE=Math.hypot(le.x-re.x,le.y-re.y),ang=Math.atan2(le.y-re.y,le.x-re.x),mx=(re.x+le.x)/2,my=(re.y+le.y)/2;
        const nx=-Math.sin(ang),ny=Math.cos(ang); // vers le bas du visage
        if(genre==='lunettes')put(im,0,0,iw,ih,mx+ox,my+oy+dE*.08,dE*2.3*T_.k,ang);
        else if(genre==='tete')put(im,0,0,iw,ih,mx+ox-nx*dE*1.25,my+oy-ny*dE*1.25-dE*ar*.3,dE*2.9*T_.k,ang);
        else if(genre==='collier')put(im,0,0,iw,ih,mx+ox+nx*dE*2.3,my+oy+ny*dE*2.3,dE*2.6*T_.k,ang);
        else if(genre==='boucles'){const paire=iw>ih*1.25,w=dE*(paire?.42:.5)*T_.k,ears=[kp[4],kp[5]];
          ears.forEach((e,i)=>{const cx=e.x+ox+nx*dE*.55,cy=e.y+oy+ny*dE*.55;if(paire)put(im,i?iw/2:0,0,iw/2,ih,cx,cy,w,ang);else put(im,0,0,iw,ih,cx,cy,w,ang);});}
      }else{
        const w=W*(genre==='main'?.38:.45)*T_.k;put(im,0,0,iw,ih,W/2+ox,H*(genre==='main'?.62:.45)+oy,w,0);
      }
    }
  }
  T_.raf=requestAnimationFrame(essaiBoucle);
}
function essaiStop(){cancelAnimationFrame(T_.raf);if(T_.stream)T_.stream.getTracks().forEach(t=>t.stop());T_.stream=null;closeModal();}
async function essaiPhoto(){
  const v=document.getElementById('py-tv'),c=document.getElementById('py-tc');if(!v||!v.videoWidth)return;
  const o=canvas(v.videoWidth,v.videoHeight),x=o.getContext('2d');x.translate(o.width,0);x.scale(-1,1);x.drawImage(v,0,0);x.drawImage(c,0,0);
  const g=G(),p=g.prodById(T_.pid);x.setTransform(1,0,0,1,0,0);x.fillStyle='rgba(20,10,43,.7)';x.fillRect(0,o.height-64,o.width,64);x.fillStyle='#fff';x.font='700 26px Inter, Arial, sans-serif';x.textBaseline='middle';x.fillText(p.nom.slice(0,30)+' · '+fmt(g.prix(p))+' F',20,o.height-32);
  const blob=await new Promise(r=>o.toBlob(r,'image/jpeg',.9));if(!blob)return;
  const f=new File([blob],'essayage.jpg',{type:'image/jpeg'});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:'Ça me va ? '+p.nom+' : '+g.prodUrl(p)});return;}}catch(e){if(e&&e.name==='AbortError')return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='essayage.jpg';document.body.appendChild(a);a.click();a.remove();toast('📸 Photo enregistrée');
}

/* =====================================================================
   5. CAGNOTTE CADEAU : les amis cotisent ensemble pour offrir un article
   ===================================================================== */
const OCCAS=['Anniversaire','Mariage','Naissance','Fête des mères','Diplôme','Départ','Noël','Juste pour faire plaisir'];
function cagnotteForm(pid){
  const g=G(),p=g.prodById(pid);if(!p)return;const c=g.getClient();
  modal('<form class="stack" data-f="pyCagNew" data-id="'+p.id+'" style="gap:10px"><div class="row between"><b style="font-size:17px">🎁 Cagnotte cadeau</b><button type="button" class="linkbtn" data-a="closeModal">Fermer</button></div>'+
    '<div class="row" style="gap:10px"><div style="width:56px;flex:none">'+g.tile(p,56,24)+'</div><div><b>'+esc(p.nom)+'</b><div class="small muted">'+fmt(g.prix(p))+' F · les amis cotisent ensemble</div></div></div>'+
    '<div class="grid2"><label class="lbl">C\'est pour qui ?<input class="in" name="pour" required maxlength="60" placeholder="Ex. : Mariam"></label><label class="lbl">Occasion<select class="in" name="occ">'+OCCAS.map(o=>'<option>'+o+'</option>').join('')+'</select></label></div>'+
    '<label class="lbl">Date (facultatif)<input class="in" type="date" name="date"></label>'+
    '<div class="grid2"><label class="lbl">Votre prénom<input class="in" name="nom" required maxlength="60" value="'+esc(c.nom||'')+'"></label><label class="lbl">Votre Mobile Money<input class="in" name="tel" type="tel" required value="'+esc(c.tel||'')+'" placeholder="07 XX XX XX XX"></label></div>'+
    '<span class="small muted">Les amis vous envoient leur part sur ce numéro. Quand le total est atteint, vous commandez l\'article à la boutique.</span>'+
    '<button class="btn btn-o btn-block" type="submit">Créer la cagnotte</button></form>');
}
function cagCharger(id,force){
  if(Y.cg[id]!==undefined&&!force)return;Y.cg[id]=Y.cg[id]||null;
  G().sb.rpc('cagnotte_voir',{cid:id}).then(r=>{Y.cg[id]=r.data||false;rerender();},()=>{Y.cg[id]=false;rerender();});
  const k=LS('gbairai-cagnottes',{})[id];
  if(k)G().sb.rpc('cagnotte_parts_org',{cid:id,k}).then(r=>{Y.cgOrg[id]=r.data||[];rerender();},()=>{});
}
function vCagnotte(id){
  const g=G();cagCharger(id);const c=Y.cg[id];
  let h='<div class="wrap narrow"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">🎁 Cagnotte cadeau</h1></div>';
  if(!c)return h+'<div class="card muted">'+(c===false?'Cagnotte introuvable. Vérifiez le lien reçu.':'Chargement…')+'</div></div>';
  const p=g.prodById(c.product_id),s=g.shopById(c.shop_id),parts=c.parts||[],tot=parts.reduce((a,x)=>a+x.montant,0),pc=Math.min(100,Math.round(tot/c.objectif*100)),ok=tot>=c.objectif;
  const cle=LS('gbairai-cagnottes',{})[id],moi=LS('gbairai-mes-parts',{})[id],lien=base()+'#cagnotte-'+id;
  const titre='Cagnotte pour '+c.pour;
  h+='<section class="card stack py-cag"><b style="font-size:19px">'+esc(titre)+'</b>'+(p?'<a href="#produit-'+p.id+'" class="py-cagimg">'+g.tile(p,320,120)+'</a>':'')+
    '<span class="badge b-violet" style="align-self:flex-start">🎂 '+esc(c.occasion||'Cadeau')+(c.date_evt?' · '+esc(jourFr(c.date_evt)):'')+'</span>'+
    '<div class="row between"><b>'+esc(p?p.nom:'Article')+'</b><b>'+fmt(c.objectif)+' F</b></div>'+
    '<div class="mg-bar"><i style="width:'+pc+'%;background:linear-gradient(90deg,#10B981,#0E7A5F)"></i></div>'+
    '<div class="row between small" style="font-weight:700"><span style="color:#0E7A5F">'+fmt(tot)+' F</span><span>'+(ok?'🎉 Objectif atteint !':'reste '+fmt(c.objectif-tot)+' F')+'</span></div>'+
    (c.statut!=='ouverte'?'<div class="note">'+(c.statut==='commandee'?'✔ Le cadeau a été commandé. Merci à tous !':'Cette cagnotte a été annulée.')+'</div>':'')+'</section>';
  h+='<div class="card stack" style="gap:2px">'+(parts.length?parts.map(x=>'<div class="row between py-part"><span>'+(x.nom==='Anonyme'?'🙈 ':'🙂 ')+esc(x.nom||'Un ami')+'</span><b>'+fmt(x.montant)+' F</b></div>').join(''):'<span class="muted small">Personne n\'a encore participé. Soyez le premier !</span>')+'</div>';
  if(c.statut==='ouverte'){
    if(moi)h+='<div class="good"><b>💚 Merci '+esc(moi.nom||'')+' !</b><br>Envoyez maintenant votre part de <b>'+fmt(moi.montant)+' F</b> à <b>'+esc(c.org_nom)+'</b> par Wave, Orange Money, MTN ou Moov au <b>'+esc(c.org_tel)+'</b>.</div>';
    else{const cl=g.getClient();h+='<form class="card stack" data-f="pyCagPart" data-id="'+id+'" style="gap:8px"><b>Je participe</b><div class="row wrapx" style="gap:6px">'+[2000,5000,10000].map(m=>'<button type="button" class="chip" data-a="pyCagM" data-v="'+m+'">'+fmt(m)+' F</button>').join('')+'</div>'+
      '<label class="lbl">Montant (F)<input class="in" name="montant" inputmode="numeric" required placeholder="5000" id="py-cagm"></label>'+
      '<div class="grid2"><input class="in" name="nom" maxlength="60" placeholder="Votre prénom" value="'+esc(cl.nom||'')+'"><input class="in" name="tel" type="tel" required placeholder="Votre WhatsApp" value="'+esc(cl.tel||'')+'"></div>'+
      '<label class="row small" style="gap:8px"><input type="checkbox" name="anonyme"> Ne pas afficher mon prénom (anonyme)</label>'+
      '<button class="btn btn-g btn-block" type="submit">💚 Je participe</button><span class="small muted">Vous envoyez votre part à '+esc(c.org_nom)+' ('+esc(c.org_tel)+') par Mobile Money. Gbairai ne touche pas l\'argent.</span></form>';}
    h+='<a class="btn btn-v btn-block" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('🎁 On offre « '+(p?p.nom:'un cadeau')+' » à '+c.pour+(c.occasion?' pour son '+c.occasion.toLowerCase():'')+' ! Déjà '+fmt(tot)+' F sur '+fmt(c.objectif)+' F. Participe ici : '+lien)+'">Partager sur WhatsApp</a>';
  }
  if(cle){const O=Y.cgOrg[id]||[];
    h+='<section class="card stack"><b>👑 Vous organisez cette cagnotte</b><span class="small muted">Vous seul voyez les numéros. Relancez ceux qui n\'ont pas encore envoyé leur part.</span>'+
      O.map(x=>'<div class="row between small py-part"><span>'+esc(x.nom||'Ami')+(x.anonyme?' (anonyme)':'')+' · '+fmt(x.montant)+' F</span><a target="_blank" rel="noopener" style="font-weight:700;color:#0E7A5F" href="https://wa.me/'+g.waNum(x.tel)+'?text='+encodeURIComponent('Coucou '+(x.nom||'')+' 🙂 merci pour la cagnotte de '+c.pour+' ! Tu peux m\'envoyer tes '+fmt(x.montant)+' F par Mobile Money au '+c.org_tel+' ?')+'">Relancer</a></div>').join('')+
      (c.statut==='ouverte'&&s?'<a class="btn '+(ok?'btn-o':'btn-w')+' btn-block" target="_blank" rel="noopener" href="https://wa.me/'+g.waNum(s.whatsapp)+'?text='+encodeURIComponent('Bonjour '+s.nom+', je veux commander « '+(p?p.nom:'')+' » ('+fmt(c.objectif)+' F) en cadeau pour '+c.pour+'. Nous avons fait une cagnotte entre amis : '+lien)+'">'+(ok?'🎉 Commander le cadeau':'Commander quand même')+'</a><div class="grid2"><button type="button" class="btn btn-w btn-s" data-a="pyCagSt" data-id="'+id+'" data-v="commandee">✔ Marquer commandée</button><button type="button" class="btn btn-w btn-s" data-a="pyCagSt" data-id="'+id+'" data-v="annulee">Annuler</button></div>':'')+'</section>';}
  return h+'</div>';
}

/* =====================================================================
   6. PAYER EN 3 FOIS
   ===================================================================== */
const MIN3=15000;
function tranches(tot,n,depuis){n=n||3;const a=Math.ceil(tot/n/100)*100,L=[];for(let i=0;i<n;i++)L.push({n:i+1,m:i<n-1?a:tot-a*(n-1),le:new Date(new Date(depuis||Date.now()).getTime()+i*30*D)});return L;}
function tr3Carte(s,tot){
  if(!s.tranches||tot<MIN3)return '';const on=!!Y.tr3[s.id],T=tranches(tot);
  return '<label class="card row py-tr3'+(on?' on':'')+'"><input type="checkbox" data-a="pyTr3" data-id="'+s.id+'"'+(on?' checked':'')+'><span class="grow"><b>💳 Payer en 3 fois</b><span class="small">soit 3 × '+fmt(T[0].m)+' F : aujourd\'hui, le '+dCourt(T[1].le)+' et le '+dCourt(T[2].le)+'. Le vendeur vous rappelle avant chaque tranche.</span></span></label>';
}
function tr3Ligne(s,tot){if(!s.tranches||tot<MIN3||!Y.tr3[s.id])return '';const T=tranches(tot);return '\n💳 Je souhaite payer en 3 fois : '+T.map(t=>fmt(t.m)+' F '+(t.n===1?'aujourd\'hui':'le '+dCourt(t.le))).join(', ');}
function tr3Vendeur(o,s){
  if(!(o.tranches>1))return '';const T=tranches(o.total,o.tranches,o.created_at),k=o.tranches_payees||0,next=T[k];
  const msg=next?'Bonjour '+(o.client_nom||'')+' 🙂 petit rappel : votre '+(next.n===2?'2e':next.n+'e')+' tranche de '+fmt(next.m)+' F pour la commande n° '+String(o.id).slice(0,8).toUpperCase()+' chez '+s.nom+' est prévue le '+dCourt(next.le)+'. Merci !':'';
  return '<div class="stack py-trv" style="gap:6px"><b class="small">💳 Paiement en '+o.tranches+' fois · '+k+'/'+o.tranches+' payée'+(k>1?'s':'')+'</b>'+T.map(t=>'<div class="row between small"><span>'+(t.n<=k?'✅':'⏳')+' '+t.n+(t.n===1?'re':'e')+' tranche · '+dCourt(t.le)+'</span><b>'+fmt(t.m)+' F</b></div>').join('')+
    (next?'<div class="grid2"><button type="button" class="btn btn-w btn-s" data-a="pyTrPaye" data-id="'+o.id+'" data-v="'+(k+1)+'">✔ Tranche '+next.n+' reçue</button>'+(o.client_tel?waBtn(o.client_tel,msg,'Rappel'):'')+'</div>':'<div class="good small">✔ Tout est payé.</div>')+'</div>';
}
function rappelsDuJour(s){
  const g=G(),now=Date.now();
  return (g.S.orders||[]).filter(o=>o.shop_id===s.id&&o.tranches>1&&o.statut!=='annulee').map(o=>{const T=tranches(o.total,o.tranches,o.created_at),nx=T[o.tranches_payees||0];return nx?{o,nx}:null;}).filter(x=>x&&x.nx.le-now<3*D).sort((a,b)=>a.nx.le-b.nx.le);
}

/* =====================================================================
   7. GBAIRAI COINS
   ===================================================================== */
const NIV=[[0,'Bronze','🥉'],[1000,'Argent','🥈'],[5000,'Or','🥇']];
function niveau(n){let i=0;NIV.forEach((x,k)=>{if(n>=x[0])i=k;});return {cur:NIV[i],next:NIV[i+1]};}
function coinsCharger(force){
  const g=G();if(!g.S.user)return;if(Y.coins&&!force&&Date.now()-Y.coinsT<60000)return;Y.coinsT=Date.now();
  g.sb.rpc('mes_coins').then(r=>{Y.coins=r.data||{solde:0,gagnes:0,historique:[],bons:[]};LSset('gbairai-bons',Y.coins.bons||[]);rerender();},()=>{});
}
const mesBons=()=>(Y.coins&&Y.coins.bons||LS('gbairai-bons',[])).filter(b=>new Date(b.expire)>Date.now());
const bonPour=sid=>mesBons().filter(b=>b.shop_id===sid).sort((a,b)=>b.montant-a.montant)[0];
function vCoins(){
  const g=G();let h='<div class="wrap narrow"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">🪙 Mes Gbairai Coins</h1></div>';
  const regles='<section class="card stack" style="gap:4px"><b>Gagner des Coins</b>'+[['🛍️','Chaque achat confirmé','1 🪙 / 100 F'],['🎉','Premier achat','+100 🪙'],['🥇','Niveau Or (5 000 Coins gagnés)','Badge doré']].map(r=>'<div class="row between small py-part"><span>'+r[0]+' '+r[1]+'</span><b>'+r[2]+'</b></div>').join('')+'<span class="small muted">1 Coin = 1 F de remise chez les boutiques qui acceptent les Coins. Le numéro de votre compte doit être celui donné à la commande.</span></section>';
  if(!g.S.user)return h+'<section class="py-coins"><span>Chaque achat vous rapporte des Coins</span><b>🪙 0</b><span class="small">Créez un compte gratuit avec votre numéro pour les garder.</span></section><a class="btn btn-o btn-block" href="#compte">Créer mon compte</a>'+regles+'</div>';
  coinsCharger();const c=Y.coins;
  if(!c)return h+'<div class="card muted">Chargement…</div></div>';
  const nv=niveau(c.gagnes||0),pc=nv.next?Math.min(100,(c.gagnes-nv.cur[0])/(nv.next[0]-nv.cur[0])*100):100;
  h+='<section class="py-coins"><span>Mon solde</span><b>'+fmt(c.solde)+' 🪙</b><span>= '+fmt(c.solde)+' F de remise</span><div class="py-cbar"><i style="width:'+pc+'%"></i></div><span class="small">Niveau '+nv.cur[1]+' '+nv.cur[2]+(nv.next?' · encore '+fmt(nv.next[0]-c.gagnes)+' 🪙 pour '+nv.next[1]+' '+nv.next[2]:'')+'</span></section>';
  const B=mesBons();
  if(B.length)h+='<section class="card stack"><b>Mes bons de réduction</b>'+B.map(b=>{const s=g.shopById(b.shop_id);return '<div class="row between py-part"><span><b class="num">'+esc(b.code)+'</b><br><span class="small muted">'+esc(s?s.nom:'Boutique')+' · jusqu\'au '+dCourt(b.expire)+'</span></span><span class="badge b-orange">-'+fmt(b.montant)+' F</span></div>';}).join('')+'<span class="small muted">Le bon s\'ajoute tout seul à votre message de commande chez cette boutique.</span></section>';
  const S_=g.S.shops.filter(s=>shopOk(s)&&s.coins_ok);
  h+='<form class="card stack" data-f="pyCoinsBon" style="gap:8px"><b>Utiliser mes Coins</b>'+(S_.length?'<select class="in" name="sid" required><option value="">Choisir la boutique…</option>'+S_.map(s=>'<option value="'+s.id+'">'+esc(s.nom)+'</option>').join('')+'</select><label class="lbl">Combien de Coins ?<input class="in" name="m" type="number" min="100" step="50" max="'+Math.max(100,c.solde)+'" value="'+Math.min(c.solde,1000)+'" required></label><button class="btn btn-o btn-block" type="submit"'+(c.solde<100?' disabled':'')+'>Créer mon bon de réduction</button>'+(c.solde<100?'<span class="small muted">Il faut au moins 100 Coins.</span>':''):'<span class="small muted">Aucune boutique n\'accepte encore les Coins. Bientôt !</span>')+'</form>';
  h+=regles;
  const H_=c.historique||[];if(H_.length)h+='<section class="card stack" style="gap:2px"><b>Historique</b>'+H_.map(x=>'<div class="row between small py-part"><span>'+esc(x.libelle)+' · '+dCourt(x.le)+'</span><b style="color:'+(x.coins<0?'#C2410C':'#0E7A5F')+'">'+(x.coins>0?'+':'')+fmt(x.coins)+' 🪙</b></div>').join('')+'</section>';
  return h+'</div>';
}

/* =====================================================================
   8. L'HEURE MAGIQUE : chaque soir de 20 h à 21 h (heure d'Abidjan), des prix fous
   ===================================================================== */
const HM=20;
const testMagique=()=>/[?&]magique=1/.test(location.search)||LS('gbairai-magique-test',0)===1;
function magiqueMaintenant(){return new Date().getUTCHours()===HM||testMagique();}
function magique(p){return !!(p&&p.prix_magique>0&&p.prix_magique<p.prix&&p.stock>0&&magiqueMaintenant());}
function prochaine(){const d=new Date();d.setUTCHours(HM,0,0,0);if(Date.now()>=d.getTime())d.setUTCDate(d.getUTCDate()+1);return d;}
function finMagique(){const d=new Date();d.setUTCHours(HM+1,0,0,0);if(testMagique()&&Date.now()>=d.getTime())return new Date(Date.now()+3600e3-((Date.now()/1000|0)%3600)*1000);return d;}
function produitsMagiques(){const g=G();return g.S.products.filter(p=>p.visible&&p.prix_magique>0&&p.prix_magique<p.prix&&p.stock>0&&shopOk(g.shopById(p.shop_id)));}
const remise=p=>Math.round((1-p.prix_magique/G().prixBase(p))*100);
function magiqueTuile(p){const g=G();return '<a class="py-mtile" href="#produit-'+p.id+'"><span class="py-mpct">-'+remise(p)+' %</span>'+g.tile(p,120,40)+'<b class="ell">'+esc(p.nom)+'</b><span><s>'+fmt(g.prixBase(p))+'</s> <b>'+fmt(p.prix_magique)+' F</b></span><small>🔥 '+p.stock+' restant'+(p.stock>1?'s':'')+'</small></a>';}
function magiqueBanniere(page){
  const L=produitsMagiques();if(!L.length&&!page)return '';
  const on=magiqueMaintenant(),cd='<span class="cd" data-end="'+(on?finMagique():prochaine()).toISOString()+'"></span>';
  let h='<section class="py-magic"><span class="py-moon">🌙✨</span><b class="py-mt">L\'HEURE MAGIQUE</b>'+
    (on?'<span>se termine dans</span><div class="py-mcd">'+cd+'</div>':'<span>Chaque soir de 20 h à 21 h : '+(L.length?L.length+' article'+(L.length>1?'s':'')+' à prix fous':'des prix fous')+'</span><div class="py-mcd small">Commence dans '+cd+'</div>');
  if(on&&L.length)h+='<div class="py-mgrid">'+L.slice(0,page?60:4).map(magiqueTuile).join('')+'</div>'+(page||L.length<=4?'':'<a class="btn btn-o btn-block" href="#magique">Voir les '+L.length+' articles</a>');
  else if(!on)h+=(LS('gbairai-magique-alerte',0)?'<span class="small">🔔 Vous serez prévenu(e) à 20 h</span>':'<button type="button" class="btn btn-o btn-block" data-a="pyMagAlerte">🔔 Me prévenir à 20 h</button>')+(page?'':'<a class="small" href="#magique" style="color:#fff;font-weight:700">Voir le programme ›</a>');
  return h+'</section>';
}
function vMagique(){const g=G();return '<div class="wrap"><div class="row">'+g.back('#accueil')+'<h1 style="font-size:20px">🌙 L\'heure magique</h1></div>'+magiqueBanniere(true)+
  (magiqueMaintenant()?'':'<p class="muted small">Ce soir, ces articles passent à prix fou pendant 1 heure seulement :</p><div class="pgrid">'+produitsMagiques().slice(0,30).map(p=>g.pCard(p)).join('')+'</div>')+'</div>';}
async function magiqueAlerte(){
  const g=G();if(!g.pushOK())return toast('Ce téléphone ne permet pas les alertes');
  const ok=await g.pushEnable();if(!ok)return;
  try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(sub){await g.sb.rpc('push_magique',{ep:sub.endpoint,oui:true});LSset('gbairai-magique-alerte',1);rerender();toast('🔔 On vous prévient chaque soir avant 20 h');}}catch(e){}
}
setInterval(()=>{const on=magiqueMaintenant();if(Y.magOn!==undefined&&Y.magOn!==on)rerender();Y.magOn=on;},20000);

/* =====================================================================
   9. LIVREUR SUIVI EN DIRECT
   ===================================================================== */
function livreurBloc(o,s){
  const lv=o.livraison||'attente';if(o.statut!=='confirmee'||lv==='livree'||lv==='echec')return '';
  return '<div class="stack py-livgps" style="gap:6px"><b class="small">📍 Suivi GPS du livreur</b><span class="small muted">Envoyez un lien au livreur : son téléphone partage sa position, le client voit la moto arriver sur la carte (statut « En route »).</span>'+
    '<button type="button" class="btn btn-w btn-s" data-a="pyLivLien" data-id="'+o.id+'">'+(o.livreur_cle?'Renvoyer le lien au livreur':'Envoyer le lien GPS au livreur')+'</button></div>';
}
async function livreurLien(oid){
  const g=G(),o=(g.S.orders||[]).find(x=>x.id===oid);if(!o)return;
  let cle=o.livreur_cle;
  if(!cle){cle=g.uuid();try{await g.q(g.sb.from('orders').update({livreur_cle:cle}).eq('id',oid));o.livreur_cle=cle;}catch(e){return toast(g.errMsg(e));}}
  const lien=base()+'#livreur-'+oid+'.'+cle,txt='🛵 Course Gbairai Market : commande n° '+String(oid).slice(0,8).toUpperCase()+(o.client_adresse?' pour '+o.client_adresse:'')+'.\nOuvrez ce lien et touchez « Démarrer » pour que le client vous suive :\n'+lien;
  if(o.livreur_tel)window.open('https://wa.me/'+g.waNum(o.livreur_tel)+'?text='+encodeURIComponent(txt),'_blank','noopener');else g.copy(txt,'Lien copié : envoyez-le au livreur');
  rerender();
}
const LV={};
function vLivreur(arg){
  const g=G(),[oid,cle]=String(arg).split('.');
  if(LV.oid!==oid){LV.oid=oid;LV.cle=cle;LV.d=undefined;g.sb.rpc('livreur_course',{oid,cle}).then(r=>{LV.d=(r.data&&r.data[0])||false;rerender();},()=>{LV.d=false;rerender();});}
  let h='<div class="wrap narrow"><h1 style="font-size:20px">🛵 Ma course</h1>';
  if(!LV.d)return h+'<div class="card muted">'+(LV.d===false?'Lien invalide ou course terminée. Demandez un nouveau lien au vendeur.':'Chargement…')+'</div></div>';
  const d=LV.d;
  h+='<section class="card stack"><div class="row between"><b>'+esc(d.boutique)+'</b><span class="badge b-violet">n° '+esc(oid.slice(0,8).toUpperCase())+'</span></div>'+
    '<div class="small">👤 <b>'+esc(d.client_nom||'Client')+'</b>'+(d.client_adresse?'<br>📍 '+esc(d.client_adresse):'')+'</div>'+
    (d.items||[]).map(it=>'<div class="row between small"><span>'+it.qty+' × '+esc(it.nom)+'</span></div>').join('')+'<div class="row between"><b>À encaisser (si paiement à la livraison)</b><b>'+fmt(d.total)+' F</b></div>'+
    '<div class="grid2">'+(d.client_tel?'<a class="btn btn-g btn-s" href="tel:'+esc(String(d.client_tel).replace(/\s/g,''))+'">📞 Appeler</a>':'')+(d.client_adresse?'<a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(d.client_adresse+', Côte d\'Ivoire')+'">🧭 Itinéraire</a>':'')+'</div></section>';
  h+='<section class="card stack py-livgo'+(LV.watch!=null?' on':'')+'">'+(LV.watch!=null?'<b style="font-size:18px">🟢 Position partagée</b><span class="small" id="py-livst">'+esc(LV.st||'Recherche du GPS…')+'</span><span class="small muted">Gardez cette page ouverte pendant la course. Le client voit votre moto sur sa carte.</span><button type="button" class="btn btn-w" data-a="pyLivStop">Arrêter</button>':
    '<b style="font-size:18px">Partager ma position</b><span class="small muted">Le client voit seulement votre position pendant cette course, rien d\'autre.</span><button type="button" class="btn btn-o btn-block" data-a="pyLivGo">▶ Démarrer</button>')+'</section>';
  return h+'</div>';
}
async function livreurGo(){
  const g=G();if(!navigator.geolocation)return toast('GPS non disponible sur ce téléphone');
  let last=0;LV.st='Recherche du GPS…';
  try{if(navigator.wakeLock)LV.lock=await navigator.wakeLock.request('screen');}catch(e){}
  LV.watch=navigator.geolocation.watchPosition(p=>{const now=Date.now();if(now-last<10000)return;last=now;
    g.sb.rpc('livreur_position',{oid:LV.oid,cle:LV.cle,la:p.coords.latitude,lo:p.coords.longitude,v:p.coords.speed||null}).then(r=>{
      LV.st=r.data?'Position envoyée à '+new Date().toLocaleTimeString('fr-FR')+' (précision '+Math.round(p.coords.accuracy)+' m)':'Course terminée : merci !';const el=document.getElementById('py-livst');if(el)el.textContent=LV.st;if(r.data===false)livreurStop();},()=>{});},
    e=>{LV.st=e.code===1?'GPS refusé : autorisez la position dans les réglages':'GPS indisponible, réessai…';const el=document.getElementById('py-livst');if(el)el.textContent=LV.st;},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
  rerender();
}
function livreurStop(){if(LV.watch!=null)navigator.geolocation.clearWatch(LV.watch);LV.watch=null;try{LV.lock&&LV.lock.release();}catch(e){}LV.lock=null;rerender();}
function dist(a,b){const R=6371e3,r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r,x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function suiviCarte(id,step){
  if(step!==3)return '';const P=Y.pos[id];
  if(P===undefined){Y.pos[id]=null;posCharger(id);}
  if(!P)return '';
  const z=.006,bbox=[P.lng-z,P.lat-z*.8,P.lng+z,P.lat+z*.8].join(','),age=Math.round((Date.now()-new Date(P.maj))/60000);
  let eta='';if(Y.moi){const m=dist(Y.moi,{lat:P.lat,lng:P.lng}),v=Math.max(4,P.vitesse||0,5.5);eta=m<150?'Le livreur est tout près !':'Arrive dans ~'+Math.max(2,Math.round(m*1.35/v/60))+' min';}
  return '<section class="card stack py-livmap"><div class="row between"><b>🛵 Ma livraison arrive</b><span class="badge b-green">'+(eta?esc(eta):'En direct')+'</span></div>'+
    '<iframe title="Position du livreur" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox='+bbox+'&layer=mapnik&marker='+P.lat+','+P.lng+'"></iframe>'+
    '<span class="small muted">Position mise à jour '+(age<1?'à l\'instant':'il y a '+age+' min')+'. La carte se rafraîchit toute seule.</span>'+
    (Y.moi?'':'<button type="button" class="btn btn-w btn-s" data-a="pyMoi">📍 Calculer l\'heure d\'arrivée</button>')+'</section>';
}
function posCharger(id){G().sb.rpc('position_livreur',{oid:id}).then(r=>{const p=r.data&&r.data[0];const old=Y.pos[id];Y.pos[id]=p||false;
  if(p&&(!old||dist(old,p)>25||!document.querySelector('.py-livmap')))rerender();},()=>{});}
setInterval(()=>{const h=location.hash.slice(1);if(h.startsWith('suivi-')&&Y.pos[h.slice(6)]!==undefined&&!document.hidden)posCharger(h.slice(6));},15000);
function suiviTranches(id){
  if(Y.trS===undefined)Y.trS={};if(Y.trS[id]===undefined){Y.trS[id]=null;G().sb.rpc('suivi_tranches',{oid:id}).then(r=>{Y.trS[id]=(r.data&&r.data[0])||false;if(Y.trS[id]&&Y.trS[id].tranches>1)rerender();},()=>{Y.trS[id]=false;});}
  const t=Y.trS[id];if(!t||!(t.tranches>1))return '';const T=tranches(t.total,t.tranches,t.created_at);
  return '<section class="card stack" style="gap:6px"><b>💳 Paiement en '+t.tranches+' fois</b>'+T.map(x=>'<div class="row between small"><span>'+(x.n<=t.payees?'✅':'⏳')+' '+x.n+(x.n===1?'re':'e')+' tranche · '+dCourt(x.le)+'</span><b>'+fmt(x.m)+' F</b></div>').join('')+'</section>';
}

/* =====================================================================
   10. PRÉVISIONS DE STOCK
   ===================================================================== */
function previsions(s){
  const g=G(),now=Date.now(),O=(g.S.orders||[]).filter(o=>o.shop_id===s.id&&o.statut!=='annulee'),P=g.shopProducts(s.id);
  const sem=[0,0,0,0],vente={};
  O.forEach(o=>{const age=now-new Date(o.created_at);if(age>28*D)return;const w=3-Math.min(3,Math.floor(age/(7*D)));(o.items||[]).forEach(i=>{const q=i.qty||1;sem[w]+=q;vente[i.pid]=(vente[i.pid]||0)+q;});});
  const tend=sem[2]+sem[3]>0&&sem[0]+sem[1]>0?(sem[2]+sem[3])/(sem[0]+sem[1]):1;
  const L=P.filter(p=>p.visible).map(p=>{const v=vente[p.id]||0,parJour=v/28*Math.max(.7,Math.min(1.6,tend)),jours=parJour>0?Math.floor(p.stock/parJour):null,age=(now-new Date(p.created_at))/D;
    return {p,v,parJour,jours,rachat:parJour>0?Math.max(0,Math.ceil(parJour*30-p.stock)):0,lent:v===0&&age>21&&p.stock>0};});
  return {sem,tend,L,urg:L.filter(x=>x.jours!=null&&x.jours<=10).sort((a,b)=>a.jours-b.jours),ok:L.filter(x=>x.jours!=null&&x.jours>10).sort((a,b)=>a.jours-b.jours),lents:L.filter(x=>x.lent)};
}
function stockCarte(s){
  const g=G(),R=previsions(s),mx=Math.max(1,...R.sem),ia_=LS('gbairai-stockia-'+s.id,null);
  const bars='<svg viewBox="0 0 220 92" class="py-bars" role="img" aria-label="Ventes des 4 dernières semaines">'+R.sem.map((v,i)=>{const h=Math.max(3,v/mx*52),x=14+i*52;return '<rect x="'+x+'" y="'+(70-h)+'" width="34" height="'+h+'" rx="6" fill="'+(i===3?'#FF7A1A':'#8B5CF6')+'"/><text x="'+(x+17)+'" y="'+(66-h)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#1B1033">'+v+'</text><text x="'+(x+17)+'" y="86" text-anchor="middle" font-size="10" fill="#6B5B8C">S'+(i+1)+'</text>';}).join('')+'</svg>';
  const ligne=(x,etat,col)=>'<div class="row between small py-part"><span class="ell">'+esc(x.p.nom)+'</span><b style="color:'+col+';white-space:nowrap">'+etat+'</b></div>';
  let h='<section class="card stack"><div class="row between"><b style="font-size:16px">🔮 Prévisions de stock</b><span class="small muted">4 dernières semaines</span></div>'+bars+
    '<span class="small muted">Articles vendus par semaine'+(R.tend>1.15?' · 📈 les ventes montent':R.tend<.85?' · 📉 les ventes baissent':'')+'</span>';
  if(R.urg.length){const u=R.urg[0];h+='<div class="py-alert"><b>'+esc(u.p.nom)+'</b><span>⚠ '+(u.jours<=0?'Rupture imminente':'Plus de stock dans '+u.jours+' jour'+(u.jours>1?'s':''))+'</span><span class="small">✨ Rachetez <b>'+Math.max(1,u.rachat)+'</b> pièces pour tenir un mois.</span></div>';}
  h+=R.urg.slice(1,6).map(x=>ligne(x,x.jours<=0?'rupture':x.jours+' jours','#C2410C')).join('')+R.ok.slice(0,3).map(x=>ligne(x,'OK · '+(x.jours>=21?Math.floor(x.jours/7)+' semaines':x.jours+' jours'),'#0E7A5F')).join('')+R.lents.slice(0,3).map(x=>ligne(x,'vend peu · −10 % ?','#6B5B8C')).join('');
  if(!R.L.some(x=>x.v>0))h+='<span class="small muted">Pas encore assez de ventes pour prévoir. Les prévisions apparaissent après vos premières commandes.</span>';
  if(ia_&&ia_.sem===semaineNo())h+='<div class="py-iaconseil"><b>🧠 '+esc(ia_.d.resume)+'</b>'+(ia_.d.rachats||[]).map(r=>'<span class="small">• '+esc(r.produit)+' : '+esc(String(r.quantite))+' — '+esc(r.raison)+'</span>').join('')+'</div>';
  const liste=R.L.filter(x=>x.rachat>0).sort((a,b)=>(a.jours||0)-(b.jours||0)).map(x=>'• '+x.p.nom+' : '+x.rachat+' pièces').join('\n');
  h+='<div class="grid2"><button type="button" class="btn btn-v btn-s" data-a="pyStockIA"'+(Y.stockBusy?' disabled':'')+'>'+(Y.stockBusy?'Je réfléchis…':'🧠 Conseil de l\'IA')+'</button>'+(liste?'<a class="btn btn-o btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('📝 Ma liste de rachat ('+s.nom+') :\n'+liste)+'">📝 Ma liste de rachat</a>':'<button type="button" class="btn btn-w btn-s" disabled>📝 Rien à racheter</button>')+'</div></section>';
  return h;
}
function semaineNo(){const d=new Date();return d.getFullYear()+'-'+Math.floor((d-new Date(d.getFullYear(),0,1))/(7*D));}
async function stockIA(){
  const g=G(),s=g.myShop();if(!s||Y.stockBusy)return;const R=previsions(s);Y.stockBusy=true;rerender();
  try{const d=await ia('stock',{boutique:s.nom,mois:new Date().toLocaleDateString('fr-FR',{month:'long'}),ventes_par_semaine:R.sem,
    produits:R.L.slice(0,60).map(x=>({nom:x.p.nom,stock:x.p.stock,vendus_28j:x.v,jours_avant_rupture:x.jours,prix:g.prix(x.p)}))});
    LSset('gbairai-stockia-'+s.id,{sem:semaineNo(),d});}catch(e){toast(iaMsg(e));}
  Y.stockBusy=false;rerender();
}

/* =====================================================================
   Espace vendeur : les réglages et cartes des 10 idées
   ===================================================================== */
function vendeurNouveaux(s){
  const g=G(),prods=g.shopProducts(s.id).filter(p=>p.visible),R=rappelsDuJour(s);
  const interr=(champ,on,titre,txt)=>'<label class="row between py-switch"><span><b>'+titre+'</b><span class="small muted" style="display:block">'+txt+'</span></span><input type="checkbox" data-a="pyShopOpt" data-id="'+champ+'"'+(on?' checked':'')+'></label>';
  let h='<div class="sec-title"><h2>✨ Nouveaux outils</h2></div>';
  // 2. Vidéo TikTok
  h+='<section class="card stack"><b style="font-size:16px">🎬 Vidéo TikTok en 1 clic</b><span class="small muted">Vos photos deviennent une vidéo de 15 s avec le prix et la musique, prête pour TikTok et le statut.</span>'+
    (prods.length?'<form class="row" data-f="pyVidPick" style="gap:8px"><select class="in" name="pid" style="flex:1">'+prods.slice(0,80).map(p=>'<option value="'+p.id+'">'+esc(p.nom)+'</option>').join('')+'</select><button class="btn btn-o btn-s" type="submit">Créer</button></form>':'<span class="small muted">Ajoutez d\'abord des produits.</span>')+'</section>';
  // 10. Stock
  h+=stockCarte(s);
  // 6. Tranches : rappels
  h+='<section class="card stack"><b style="font-size:16px">💳 Paiement en 3 fois</b>'+interr('tranches',s.tranches,'Proposer le paiement en 3 fois','Pour les paniers de '+fmt(MIN3)+' F et plus. Conseil : remettez l\'article selon la confiance (par ex. après la 2e tranche).')+
    (R.length?'<b class="small">🔔 À rappeler ('+R.length+')</b>'+R.map(x=>{const o=x.o,m='Bonjour '+(o.client_nom||'')+' 🙂 petit rappel : votre tranche de '+fmt(x.nx.m)+' F (commande n° '+String(o.id).slice(0,8).toUpperCase()+' chez '+s.nom+') est prévue le '+dCourt(x.nx.le)+'. Merci !';
      return '<div class="row between small py-part"><span>'+esc(o.client_nom||o.client_tel||'Client')+' · '+fmt(x.nx.m)+' F · '+dCourt(x.nx.le)+'</span>'+(o.client_tel?'<a target="_blank" rel="noopener" style="font-weight:700;color:#0E7A5F" href="https://wa.me/'+g.waNum(o.client_tel)+'?text='+encodeURIComponent(m)+'">Rappeler</a>':'')+'</div>';}).join(''):'')+'</section>';
  // 8. Heure magique
  const nM=prods.filter(p=>p.prix_magique).length;
  h+='<section class="card stack py-vmagic"><b style="font-size:16px">🌙 L\'heure magique · 20 h</b><span class="small">Chaque soir de 20 h à 21 h, vos articles choisis passent à prix fou sur la page d\'accueil. Les clients reviennent tous les soirs.</span>'+
    (prods.length?'<details'+(nM?'':' open')+'><summary class="small" style="font-weight:700;cursor:pointer">Choisir les prix magiques ('+nM+' article'+(nM>1?'s':'')+')</summary><form class="stack" data-f="pyMagPrix" style="gap:6px;margin-top:8px">'+prods.slice(0,60).map(p=>'<label class="row between small" style="gap:8px"><span class="ell grow">'+esc(p.nom)+' <span class="muted">('+fmt(g.prixBase(p))+' F)</span></span><input class="in" style="width:110px" name="m_'+p.id+'" inputmode="numeric" placeholder="Prix 20 h" value="'+(p.prix_magique||'')+'"></label>').join('')+
    '<button class="btn btn-o btn-block" type="submit">Enregistrer les prix magiques</button><span class="small muted">Laissez vide pour ne pas participer. Le prix magique doit être plus bas que le prix normal.</span></form></details>':'')+'</section>';
  // 3. Vendeur IA
  h+='<section class="card stack"><b style="font-size:16px">🤖 Vendeur IA 24 h/24</b>'+interr('assistant',s.assistant!==false,'Activer l\'assistant sur ma boutique','Il répond aux clients avec vos vrais articles, prix et stock. Il ne négocie jamais les prix.')+
    '<form class="stack" data-f="pyIaInfo" style="gap:6px"><label class="lbl">Ce que l\'assistant doit savoir<textarea class="in" name="info" rows="3" maxlength="800" placeholder="Ex. : Livraison Yopougon 1 000 F, Cocody 1 500 F. Ouvert 8 h-20 h. Échange possible sous 3 jours.">'+esc(s.assistant_info||'')+'</textarea></label><button class="btn btn-w btn-s" type="submit" style="align-self:flex-start">Enregistrer</button></form>'+
    '<a class="small" style="font-weight:700" href="#assistant-'+esc(s.slug)+'">Essayer mon assistant ›</a></section>';
  // 7. Coins
  h+='<section class="card stack"><b style="font-size:16px">🪙 Gbairai Coins</b>'+interr('coins_ok',s.coins_ok,'J\'accepte les Gbairai Coins','Les clients fidèles paient une partie avec leurs Coins (1 Coin = 1 F de remise que vous offrez). Ils viennent chez vous en priorité.')+
    (s.coins_ok?'<form class="row" data-f="pyCoinsVal" style="gap:8px"><input class="in" name="code" required placeholder="Code du bon (GC-XXXXXX)" autocapitalize="characters" style="flex:1"><button class="btn btn-o btn-s" type="submit">Valider</button></form><span class="small muted">Le code est dans le message de commande du client. Validez-le avant de livrer, puis faites la remise.</span>':'')+'</section>';
  // 5. Cagnottes
  if(Y.cgShop===undefined){Y.cgShop=null;g.sb.from('cagnottes').select('*').eq('shop_id',s.id).order('created_at',{ascending:false}).limit(20).then(r=>{Y.cgShop=r.data||[];if(Y.cgShop.length)rerender();},()=>{Y.cgShop=[];});}
  if(Y.cgShop&&Y.cgShop.length)h+='<section class="card stack"><b style="font-size:16px">🎁 Cagnottes sur vos articles</b>'+Y.cgShop.map(c=>{const p=g.prodById(c.product_id);return '<a class="row between small py-part" href="#cagnotte-'+c.id+'"><span>Pour '+esc(c.pour)+' · '+esc(p?p.nom:'')+'</span><b>'+(c.statut==='ouverte'?'en cours ›':c.statut)+'</b></a>';}).join('')+'</section>';
  // 1, 4, 9 : rappels d'utilisation
  h+='<div class="mg-help card stack" style="gap:6px"><b>Aussi pour vous</b><span class="small">🪄 <b>Studio photo</b> : dans un produit, après la photo, touchez « Studio photo ».<br>🪞 <b>Essayage caméra</b> : apparaît tout seul sur vos lunettes, bijoux, montres et chapeaux.<br>🛵 <b>Livreur en direct</b> : dans une commande confirmée, « Envoyer le lien GPS au livreur ».<br>🎁 <b>Cagnotte</b> : les clients la créent depuis la page d\'un article.</span></div>';
  return h;
}

/* ---------- Branchement sur plus.js et app.js ---------- */
function brancher(){
  const g=G(),X=window.GBX;if(!g||!X||Y.ok)return false;Y.ok=true;
  const wrap=(k,f)=>{const old=X[k];X[k]=function(){return f(old?old.apply(null,arguments):'',...arguments);};};
  X.magique=magique;
  wrap('home',(h)=>magiqueBanniere(false)+h+'<div class="mg-row py-row2"><a class="mg-tile" href="#coins"><span class="mg-ico">🪙</span><b>Mes Coins</b><small>Chaque achat rapporte</small></a><a class="mg-tile" href="#magique"><span class="mg-ico">🌙</span><b>Heure magique</b><small>Chaque soir à 20 h</small></a></div>');
  wrap('boutique',(h,s)=>h+assistantCarte(s));
  wrap('produit',(h,p,s)=>{const mine=g.myShop(),own=mine&&mine.id===p.shop_id;
    return h+'<div class="row wrapx py-pbtns">'+(genreEssai(p)&&p.photo?'<button type="button" class="btn btn-v btn-s" data-a="pyTry" data-id="'+p.id+'">🪞 Essayer avec la caméra</button>':'')+
      (p.stock>0?'<button type="button" class="btn btn-w btn-s" data-a="pyCag" data-id="'+p.id+'">🎁 Offrir avec une cagnotte</button>':'')+
      (own?'<button type="button" class="btn btn-o btn-s" data-a="pyVid" data-id="'+p.id+'">🎬 Vidéo TikTok</button>':'')+'</div>'+
      (magique(p)?'<div class="py-magline">🌙 Prix de l\'heure magique jusqu\'à 21 h · <span class="cd" data-end="'+finMagique().toISOString()+'"></span></div>':'');});
  wrap('formProduit',(h,p)=>{const has=g.ui.photo?true:(g.ui.photo===undefined&&!!p.photo);
    return h+'<div class="mg-ai"><div class="row" style="gap:10px"><span style="font-size:26px">🪄</span><div class="grow"><b>Studio photo</b><div class="small muted">'+(has?'Le fond disparaît, la photo devient pro (fond blanc, orange, wax ou nuit).':'Ajoutez d\'abord une photo.')+'</div></div><button type="button" class="btn btn-v btn-s" data-a="pyStudio"'+(has?'':' disabled')+'>Studio</button></div></div>';});
  wrap('panier',(h,s,tot)=>{const b=bonPour(s.id);return h+tr3Carte(s,tot)+(b&&s.coins_ok?'<div class="card row between py-coinok"><span>🪙 Bon Coins <b>'+esc(b.code)+'</b></span><b>-'+fmt(b.montant)+' F</b></div>':'');});
  wrap('codeLine',(h,s,tot)=>{const b=bonPour(s.id);return h+tr3Ligne(s,tot)+(b&&s.coins_ok?'\n🪙 Bon Gbairai Coins : '+b.code+' (-'+fmt(b.montant)+' F)':'');});
  X.orderRow=(row,sid,single)=>{const s=g.shopById(sid);if(!s)return;if(!single&&s.tranches&&Y.tr3[sid]&&row.total>=MIN3)row.tranches=3;const b=bonPour(sid);if(b&&s.coins_ok)row.coins_bon=b.code;};
  X.livBlock=(o,s)=>tr3Vendeur(o,s)+livreurBloc(o,s)+(o.coins_bon?'<div class="note small">🪙 Bon Coins dans cette commande : <b>'+esc(o.coins_bon)+'</b>. Validez-le dans ✨ Outils magiques.</div>':'');
  X.suivi=(id,d,step)=>suiviCarte(id,step)+suiviTranches(id);
  wrap('vendeur',(h,s)=>vendeurNouveaux(s)+h);
  wrap('route',(h,r)=>{if(h!=null&&h!=='')return h;
    if(r.startsWith('assistant-'))return vAssistant(r.slice(10));if(r.startsWith('cagnotte-'))return vCagnotte(r.slice(9));if(r.startsWith('livreur-'))return vLivreur(r.slice(8));
    if(r==='coins')return vCoins();if(r==='magique')return vMagique();return null;});
  Object.assign(g.A,{
    pyStudio:()=>studioOuvrir(),pyFond:t=>{if(Y.st){Y.st.fond=t.dataset.id;studioDessin();}},pyStudioOk:()=>studioOk(),
    pyVid:t=>videoOuvrir(t.dataset.id),pyVidTxt:t=>{Y.vid.txt=t.dataset.id;videoDessin();},pyVidMus:t=>{Y.vid.musique=t.dataset.id;videoDessin();},pyVidGo:()=>videoGo(),pyVidShare:()=>videoShare(),
    pyVidRedo:()=>{Y.vid.etat='pret';videoDessin();},pyVidStop:()=>{if(Y.vid)Y.vid.etat='stop';cancelAnimationFrame(apercuT);closeModal();},
    pyAsk:t=>assistantDemande(t.dataset.id,t.dataset.q),pyChatRaz:t=>{const s=g.shopById(t.dataset.id);Y.chat[t.dataset.id]=[];if(s)LSset(chatKey(s),[]);rerender();},
    pyTry:t=>essaiOuvrir(t.dataset.id),pyTryStop:()=>essaiStop(),pyTryShot:()=>essaiPhoto(),pyTryCart:()=>{g.addToCart(T_.pid);},
    pyTryPick:t=>{T_.pid=t.dataset.id;T_.dx=0;T_.dy=0;essaiInfos();essaiPrepare(T_.pid);},
    pyCag:t=>cagnotteForm(t.dataset.id),pyCagM:t=>{const i=document.getElementById('py-cagm');if(i)i.value=t.dataset.v;},
    pyCagSt:t=>{const k=LS('gbairai-cagnottes',{})[t.dataset.id];if(!k)return;g.sb.rpc('cagnotte_statut',{cid:t.dataset.id,k,s:t.dataset.v}).then(()=>{cagCharger(t.dataset.id,true);toast('C\'est noté');},()=>toast('Pas de connexion internet'));},
    pyTr3:t=>{Y.tr3[t.dataset.id]=t.checked;LSset('gbairai-tr3',Y.tr3);rerender();},
    pyTrPaye:t=>g.act(()=>g.q(g.sb.from('orders').update({tranches_payees:+t.dataset.v}).eq('id',t.dataset.id)),'Tranche enregistrée ✔'),
    pyMagAlerte:()=>magiqueAlerte(),
    pyLivLien:t=>livreurLien(t.dataset.id),pyLivGo:()=>livreurGo(),pyLivStop:()=>livreurStop(),
    pyMoi:()=>g.geo(p=>{Y.moi=p;rerender();}),
    pyStockIA:()=>stockIA(),
    pyShopOpt:t=>{const s=g.myShop();if(!s)return;const ch={};ch[t.dataset.id]=t.checked;g.act(()=>g.q(g.sb.from('shops').update(ch).eq('id',s.id)),t.checked?'Activé ✔':'Désactivé');},
  });
  const closeOld=g.A.closeModal;g.A.closeModal=(t,e)=>{if(T_.stream)essaiStop();if(Y.vid)Y.vid.etat='stop';cancelAnimationFrame(apercuT);Y.st=null;return closeOld?closeOld(t,e):closeModal();};
  Object.assign(g.FORMS,{
    pyAsk:(d,f)=>{assistantDemande(f.dataset.id,d.q);},
    pyVidPick:d=>videoOuvrir(d.pid),
    pyCagNew:async(d,f)=>{try{const r=await g.q(g.sb.rpc('cagnotte_creer',{pid:f.dataset.id,p_pour:d.pour,p_occasion:d.occ,p_date:d.date||null,p_nom:d.nom,p_tel:d.tel}));const x=Array.isArray(r)?r[0]:r;
      const m=LS('gbairai-cagnottes',{});m[x.id]=x.cle;LSset('gbairai-cagnottes',m);closeModal();location.hash='cagnotte-'+x.id;toast('🎁 Cagnotte créée : partagez-la sur WhatsApp');}catch(e){toast(g.errMsg(e));}},
    pyCagPart:async(d,f)=>{const m=parseInt(String(d.montant).replace(/\D/g,''),10),id=f.dataset.id;if(!(m>=100))return toast('Au moins 100 F');
      try{await g.q(g.sb.rpc('cagnotte_participer',{cid:id,p_nom:d.nom||'',p_tel:d.tel,p_montant:m,p_anonyme:!!d.anonyme}));const P=LS('gbairai-mes-parts',{});P[id]={nom:d.nom||'',montant:m};LSset('gbairai-mes-parts',P);cagCharger(id,true);toast('💚 Merci pour votre participation !');}catch(e){toast(g.errMsg(e));}},
    pyCoinsBon:async d=>{const m=parseInt(d.m,10);try{await g.q(g.sb.rpc('coins_bon',{sid:d.sid,m}));coinsCharger(true);toast('🪙 Bon créé : il s\'ajoute à votre commande');}catch(e){toast(g.errMsg(e));}},
    pyCoinsVal:async(d,f)=>{try{const m=await g.q(g.sb.rpc('coins_valider',{c:String(d.code||'').toUpperCase().trim()}));f.reset();toast('✔ Bon valide : faites une remise de '+fmt(m)+' F');}catch(e){toast(g.errMsg(e));}},
    pyMagPrix:(d,f)=>{const s=g.myShop(),ch=[];
      for(const k of Object.keys(d)){if(!k.startsWith('m_'))continue;const p=g.prodById(k.slice(2));if(!p||p.shop_id!==s.id)continue;const v=parseInt(String(d[k]).replace(/\D/g,''),10)||null;
        if(v&&v>=p.prix)return toast('« '+p.nom+' » : le prix magique doit être plus bas que '+fmt(p.prix)+' F');if((p.prix_magique||null)!==v)ch.push([p.id,v]);}
      if(!ch.length)return toast('Rien à changer');
      g.act(async()=>{for(const c of ch)await g.q(g.sb.from('products').update({prix_magique:c[1]}).eq('id',c[0]));},'🌙 Prix magiques enregistrés');},
    pyIaInfo:d=>{const s=g.myShop();g.act(()=>g.q(g.sb.from('shops').update({assistant_info:String(d.info||'').slice(0,800)}).eq('id',s.id)),'Consignes enregistrées');},
  });
  return true;
}
function demarrer(){if(!brancher())return false;const g=G();if(g.S.loaded)g.render(true);return true;}
const t=setInterval(()=>{if(window.GB&&window.GBX&&window.GBX.route&&demarrer())clearInterval(t);},150);
})();
