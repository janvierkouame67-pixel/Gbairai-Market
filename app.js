/* Gbairai : appli web (clients, vendeurs, administrateur) branchée sur Supabase. */
(function(){
'use strict';
const CFG=window.BOUTIK_CONFIG||{};
const app=document.getElementById('app');
if(!CFG.supabaseUrl||!CFG.supabaseAnonKey||!window.supabase){
  app.innerHTML='<div class="wrap"><div class="card stack"><h1 style="font-size:20px">Configuration manquante</h1><p class="muted" style="margin:0">Remplissez config.js avec le Project URL et la clé anon de Supabase.</p></div></div>';
  return;
}
const sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey);
const CART_KEY='gbairai-panier';
const EMAIL_DOMAIN='vendeur.gbairai.app';

const PAL=[['#FBCFE8','#EC4899','#9D174D'],['#DDD6FE','#8B5CF6','#4C1D95'],['#FFE1B8','#FB923C','#C2410C'],['#A7F3D0','#10B981','#065F46'],['#BFDBFE','#3B82F6','#1E3A8A'],['#FDE68A','#EAB308','#854D0E']];
const ICON={
  mode:'<path d="M9 3h6l-1 5 4 12H6l4-12-1-5z"/>',
  beaute:'<rect x="6" y="9" width="12" height="12" rx="3"/><path d="M10 9V6h4v3"/>',
  tel:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  chaussures:'<path d="M3 16v-4l5-1 3 3 6 1a3 3 0 0 1 3 3v1H3z"/>',
  maison:'<path d="M4 11h16M6 11l1 9h10l1-9M9 11V7a3 3 0 0 1 6 0v4"/>',
  sacs:'<path d="M6 9h12l-1 11H7L6 9z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="M9 13h6"/>',
  bijoux:'<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
  electronique:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  autre:'<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  mode_homme:'<path d="M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4z"/>',
  montres:'<circle cx="12" cy="12" r="5"/><path d="M9 7l1-4h4l1 4M9 17l1 4h4l1-4M12 10v2l1.5 1"/>',
  enfants:'<circle cx="12" cy="8" r="4"/><path d="M6 21c0-4 2.7-7 6-7s6 3 6 7"/><path d="M10.5 8h.01M13.5 8h.01"/>',
  sport:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',
  bag:'<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  home:'<path d="M4 11l8-7 8 7v9H4z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  wa:'<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z"/>',
  tg:'<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  link:'<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  card:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
  megaphone:'<path d="M3 10v4h4l7 5V5L7 10z"/><path d="M18 9a4 4 0 0 1 0 6"/>'
};
function ic(n,size,color,sw){return '<svg width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24" fill="none" stroke="'+(color||'currentColor')+'" stroke-width="'+(sw||2.2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[n]||'')+'</svg>';}
const VERIF='<svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-label="Vendeur vérifié"><path d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1.1 3 1.1 3-2.8 1.6-.9 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.9-3.1-2.8-1.6 1.1-3-1.1-3 2.8-1.6.9-3.1 3.2.3z" fill="#2563EB"/><path d="M8 12.2l2.6 2.6L16 9.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function n0(v){const n=Number(String(v).replace(/[^\d.-]/g,''));return isFinite(n)?n:0;}
function fmtN(n){return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function F(n){return fmtN(n)+' F';}
function slugify(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'boutique';}
function initials(s){return String(s).split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');}
function pal(i){return PAL[Math.abs(i||0)%PAL.length];}
function grad(i){const p=pal(i);return 'radial-gradient(circle at 30% 25%,'+p[0]+','+p[1]+' 60%,'+p[2]+')';}
function lin(i){const p=pal(i);return 'linear-gradient(135deg,'+p[1]+','+p[2]+')';}
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function waNum(s){let d=String(s||'').replace(/\D/g,'');if(d.length===10)d='225'+d;return d;}
function phoneEmail(p){return waNum(p)+'@'+EMAIL_DOMAIN;}
function monthOf(d){return String(d).slice(0,7);}

/* ---------- STATE ---------- */
const S={settings:{nom:'Gbairai Market',limite_gratuit:20,quartiers:[],categories:[],paiement:{}},shops:[],products:[],orders:[],txs:[],priv:{},reviews:[],banners:[],payments:[],reports:[],blacklist:[],conf:{},clientReports:[],user:null,role:'visiteur',loaded:false,error:null};
let cart=[];try{cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]')||[];}catch(e){cart=[];}
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch(e){}}
function lsGet(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}if(SYNC_KEYS.includes(k))clientSaveSoon();}
const SYNC_KEYS=['gbairai-favoris','gbairai-suivis','gbairai-mes-commandes'];
let favs=lsGet('gbairai-favoris',[]);if(!Array.isArray(favs))favs=[];
let client=lsGet('gbairai-client',{nom:'',tel:'',adresse:''})||{nom:'',tel:'',adresse:''};
let myOrders=lsGet('gbairai-mes-commandes',[]);if(!Array.isArray(myOrders))myOrders=[];
let follows=lsGet('gbairai-suivis',[]);if(!Array.isArray(follows))follows=[];
let seen=lsGet('gbairai-vus',{})||{};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
let ck=lsGet('gbairai-ck',null);if(!/^[0-9a-f-]{36}$/i.test(String(ck||''))){ck=uuid();lsSet('gbairai-ck',ck);}
let convMap=lsGet('gbairai-convs',{})||{};
const orderIds={};const oid=k=>orderIds[k]||(orderIds[k]=uuid());
const ui={nbAb:{},chat:{},vmsgs:{},conv:null,lit:null,gal:0,suivi:{},mes:null,fiab:{},verif:null,pay:{type:'pro',duree:1,op:''},extras:undefined,bannerImg:undefined,aPwd:null,pwdHelp:false,per:30,q:'',quartier:'Tous',cat:null,taille:null,vTab:'accueil',aTab:'tableau',edit:null,photo:undefined,adminShop:null,confirm:null,caissePeriode:'mois',aFilter:'tous',aQ:'',busy:false,authMode:'creer'};

const shopById=id=>S.shops.find(s=>s.id===id);
const prodById=id=>S.products.find(p=>p.id===id);
const RAYONS=[
  ['mode','Mode femme',['Robes','Pagnes & wax','Hauts','Jupes','Pantalons','Ensembles','Lingerie','Tenues traditionnelles']],
  ['mode_homme','Mode homme',['Chemises','T-shirts & polos','Pantalons & jeans','Costumes','Tenues traditionnelles','Vestes']],
  ['chaussures','Chaussures',['Baskets','Talons','Sandales & claquettes','Chaussures de ville','Chaussures enfant']],
  ['sacs','Sacs',['Sacs à main','Sacs à dos','Pochettes','Valises','Portefeuilles']],
  ['bijoux','Bijoux',['Colliers','Bracelets','Boucles d\'oreilles','Bagues','Bijoux en or']],
  ['montres','Montres & accessoires',['Montres','Lunettes','Ceintures','Chapeaux & casquettes']],
  ['beaute','Beauté & parfums',['Parfums','Soins du visage','Maquillage','Soins du corps','Cheveux & perruques']],
  ['tel','Téléphones',['Smartphones','Téléphones simples','Coques & protections','Chargeurs & câbles','Écouteurs']],
  ['electronique','Électronique',['Ordinateurs','TV & écrans','Audio & enceintes','Accessoires informatiques','Électroménager']],
  ['maison','Maison & déco',['Meubles','Décoration','Cuisine & vaisselle','Linge de maison','Plantes']],
  ['enfants','Enfants & bébé',['Vêtements enfant','Jouets','Puériculture']],
  ['sport','Sport',['Tenues de sport','Chaussures de sport','Équipements']],
  ['autre','Autres',[]]];
const uniqA=a=>a.filter((x,i)=>x&&a.indexOf(x)===i);
function CATS(){const st=S.settings.categories||[],by={};st.forEach(c=>{if(c&&c.id)by[c.id]=c;});
  const base=RAYONS.map(r=>{const c=by[r[0]]||{};return {id:r[0],nom:r[1],photo:c.photo||(r[0]==='autre'?null:'icons/rayons/'+r[0]+'.jpg'),types:uniqA(r[2].concat(c.types||[])),extra:c.types||[],own:!!c.photo,base:true};});
  const ids=new Set(RAYONS.map(r=>r[0]));
  const extra=st.filter(c=>c&&c.id&&!ids.has(c.id)).map(c=>({id:c.id,nom:c.nom,photo:c.photo||null,types:uniqA(c.types||[]),extra:c.types||[],own:!!c.photo,base:false}));
  return base.slice(0,-1).concat(extra,base.slice(-1));}
const catName=id=>{const c=CATS().find(c=>c.id===id);return c?c.nom:'Autre';};
const typeOpts=(cid,cur)=>{const c=CATS().find(x=>x.id===cid),t=c?c.types.slice():[];if(cur&&!t.includes(cur))t.push(cur);
  return '<option value="">'+(t.length?'Choisir…':'(aucun)')+'</option>'+t.map(x=>'<option'+(x===cur?' selected':'')+'>'+esc(x)+'</option>').join('');};
function rImg(c,i){return c.photo?'<img src="'+esc(c.photo)+'" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'r-ico\'}))">':'<span class="r-ico" style="background:'+grad(i||0)+'">'+ic(ICON[c.id]?c.id:'autre',34,'#fff',1.8)+'</span>';}
function rayonProds(id){const ok=new Set(S.shops.filter(s=>s.statut==='actif').map(s=>s.id));return S.products.filter(p=>p.visible&&p.stock>0&&ok.has(p.shop_id)&&(p.categorie||'autre')===id);}
function rayonsHTML(){
  const tiles=dup=>CATS().map((c,i)=>{const n=rayonProds(c.id).length;if(c.id==='autre'&&!n)return '';
    return '<a class="rayon" href="#rayon-'+esc(c.id)+'"'+(dup?' aria-hidden="true" tabindex="-1"':'')+'>'+rImg(c,i)+(n?'<small>'+n+'</small>':'')+'<b>'+esc(c.nom)+'</b></a>';}).join('');
  return '<div class="sec-title"><h2>Tous les rayons</h2><a href="#rayons" class="small" style="font-weight:700;margin-left:auto">Voir tout ›</a></div><div class="rail" data-rail><div class="rail-track">'+tiles(false)+tiles(true)+'</div></div>';}
function vRayons(){return '<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Tous les rayons</h1></div><div class="rayons">'+CATS().map((c,i)=>{const n=rayonProds(c.id).length;
  return '<a class="rayon" href="#rayon-'+esc(c.id)+'">'+rImg(c,i)+(n?'<small>'+n+'</small>':'')+'<b>'+esc(c.nom)+'</b></a>';}).join('')+'</div></div>';}
(function railLoop(){let el=null,pos=0,last=0,pause=0;const red=matchMedia('(prefers-reduced-motion: reduce)');
  const step=t=>{const r=document.querySelector('[data-rail]'),tr=r&&r.firstElementChild,k=tr?tr.children.length/2:0;
    if(r&&k>=1){if(r!==el){el=r;pos=r.scrollLeft;}
      const per=tr.children[k].offsetLeft-tr.children[0].offsetLeft;
      if(Math.abs(r.scrollLeft-pos)>2)pos=r.scrollLeft;
      if(t>pause&&!red.matches&&!document.hidden)pos+=Math.min(50,t-last)*0.035;
      if(per>0&&pos>=per)pos-=per;
      if(Math.abs(r.scrollLeft-pos)>=.5)r.scrollLeft=pos;}
    last=t;requestAnimationFrame(step);};
  ['pointerdown','pointermove','touchstart','wheel','focusin'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target&&e.target.closest&&e.target.closest('[data-rail]'))pause=performance.now()+2500;},{capture:true,passive:true}));
  requestAnimationFrame(step);})();
function vRayon(id){
  const cs=CATS(),i=cs.findIndex(x=>x.id===id),c=cs[i];
  if(!c)return '<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Rayon introuvable</h1></div></div>';
  const all=rayonProds(id),sh=new Set(all.map(p=>p.shop_id));
  S.shops.forEach(s=>{if(s.statut==='actif'&&s.categorie===id)sh.add(s.id);});
  const tc={};all.forEach(p=>{if(p.type)tc[p.type]=(tc[p.type]||0)+1;});
  const types=uniqA(c.types.concat(Object.keys(tc)));
  if(ui.type&&!types.includes(ui.type))ui.type=null;
  const list=ui.type?all.filter(p=>p.type===ui.type):all;
  const shops=S.shops.filter(s=>sh.has(s.id)).sort((a,b)=>(b.vedette-a.vedette)||((b.verification==='verifie')-(a.verification==='verifie')));
  return '<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">'+esc(c.nom)+'</h1></div>'+
  '<div class="rcover">'+rImg(c,i)+'<div><h2>'+esc(c.nom)+'</h2><p>'+all.length+' article'+(all.length>1?'s':'')+' · '+shops.length+' boutique'+(shops.length>1?'s':'')+'</p></div></div>'+
  (types.length?'<div class="chips">'+[['','Tout',all.length]].concat(types.map(t=>[t,t,tc[t]||0])).map(x=>'<button type="button" class="chip'+((ui.type||'')===x[0]?' on':'')+'" data-a="rtype" data-id="'+esc(x[0])+'">'+esc(x[1])+(x[2]?' <small>'+x[2]+'</small>':'')+'</button>').join('')+'</div>':'')+
  (list.length?'<div class="pgrid">'+list.map(pCard).join('')+'</div>':'<div class="card stack" style="text-align:center;padding:24px"><b>Pas encore d\'article ici</b><span class="muted small">Les vendeurs ajoutent de nouveaux articles chaque jour. Revenez bientôt !</span></div>')+
  (shops.length?'<div class="sec-title"><h2>Boutiques de ce rayon</h2><span class="cnt-pill">'+shops.length+'</span></div><div class="shops">'+shops.map(shopCard).join('')+'</div>':'')+'</div>';
}
const shopProducts=id=>S.products.filter(p=>p.shop_id===id);
const myShop=()=>S.user?S.shops.find(s=>s.owner===S.user.id):null;
const VILLES=['Abidjan','Bouaké','Yamoussoukro','San-Pédro','Daloa','Korhogo','Man','Gagnoa','Divo','Abengourou','Soubré','Grand-Bassam','Bingerville','Anyama','Dabou','Agboville','Adzopé','Aboisso','Bondoukou','Séguéla','Odienné','Ferkessédougou','Katiola','Dimbokro','Toumodi','Bouaflé','Sinfra','Issia','Duékoué','Guiglo','Sassandra','Tiassalé','Jacqueville','Bonoua','Assinie','Boundiali','Touba','Daoukro','Bongouanou','Agnibilékrou'];
const villes=()=>(Array.isArray(S.settings.villes)&&S.settings.villes.length?S.settings.villes:VILLES);
const place=s=>window.GbStatut?GbStatut.place(s):(s.quartier||s.ville||'');
const villeOf=s=>(s.ville||'Abidjan').trim()||'Abidjan';
function locFields(pref,s){s=s||{};const v=villeOf(s);
  return '<div class="grid2"><label class="lbl">Ville<select class="in" id="'+pref+'-ville" name="ville">'+villes().map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('')+(villes().includes(v)?'':'<option selected>'+esc(v)+'</option>')+'</select></label>'+
  '<label class="lbl">Quartier / commune<input class="in" id="'+pref+'-quartier" name="quartier" list="dl-quartiers" value="'+esc(s.quartier||'')+'" placeholder="Ex. : Cocody, Commerce…"><datalist id="dl-quartiers">'+(S.settings.quartiers||[]).map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist></label></div>';}
const isLocal=()=>!/^https?:$/.test(location.protocol)||/^(localhost|127\.)/.test(location.hostname);
const shopUrl=s=>isLocal()?location.origin+location.pathname+'#boutique-'+s.slug:location.origin+'/b/'+encodeURIComponent(s.slug);
const prodUrl=p=>isLocal()?location.origin+location.pathname+'#produit-'+p.id:location.origin+'/p/'+p.id;
function shopShareText(s){const n=shopProducts(s.id).filter(p=>p.visible).length;
  return '🛍️ *'+s.nom+'* est sur '+(S.settings.nom||'Gbairai Market')+' !\n'+(s.verification==='verifie'?'✅ Boutique vérifiée\n':'')+'📍 '+place(s)+(n?' · '+n+' article'+(n>1?'s':''):'')+'\n🚚 Commande directe sur WhatsApp\n\n👉 '+shopUrl(s);}
function prodShareText(p){const s=shopById(p.shop_id);
  return '🔥 *'+p.nom+'*\n💰 '+fmtN(prix(p))+' FCFA'+(promoOn(p)?' au lieu de '+fmtN(p.prix_barre)+' (-'+pct(p)+' %)':'')+(p.stock>0&&p.stock<=3?' · plus que '+p.stock+' !':'')+'\n🏪 '+(s?s.nom+' · '+place(s):'')+'\n\n👉 Commandez ici : '+prodUrl(p);}
function promoOn(p){return !!(p.prix_barre&&p.prix_barre>p.prix&&(!p.promo_fin||new Date(p.promo_fin)>Date.now()));}
function prix(p){return (p.prix_barre&&p.prix_barre>p.prix&&p.promo_fin&&new Date(p.promo_fin)<=Date.now())?p.prix_barre:p.prix;}
function pct(p){return Math.round((1-p.prix/p.prix_barre)*100);}
function priceHTML(p){return promoOn(p)?'<span class="price num">'+F(p.prix)+'</span> <s class="old num">'+fmtN(p.prix_barre)+'</s>':'<span class="price num">'+F(prix(p))+'</span>';}
function cdHTML(end){return '<span class="cd" data-end="'+esc(end)+'">'+cdText(end)+'</span>';}
function cdText(end){let t=Math.max(0,Math.floor((new Date(end)-Date.now())/1000));const d=Math.floor(t/86400);t%=86400;const h=Math.floor(t/3600),m=Math.floor(t%3600/60),x=t%60;return (d?d+' j ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0');}
setInterval(()=>{const b=document.getElementById('banners');if(!b||b.matches(':hover')||b.children.length<2||document.hidden)return;const w=b.clientWidth+12,i=Math.round(b.scrollLeft/w),n=b.children.length;b.scrollTo({left:((i+1)%n)*w,behavior:'smooth'});},5000);
document.addEventListener('scroll',e=>{const t=e.target;if(!t||!t.id)return;if(t.id==='banners'||t.id==='gal'){const w=t.clientWidth+(t.id==='banners'?12:0),i=Math.round(t.scrollLeft/w),d=t.parentNode.querySelector(t.id==='banners'?'.bn-dots':'.gal-dots')||t.nextElementSibling;if(d&&d.children)Array.from(d.children).forEach((x,k)=>x.classList.toggle('on',k===i));}},true);
setInterval(()=>{document.querySelectorAll('.cd[data-end]').forEach(el=>{el.textContent=cdText(el.dataset.end);});},1000);
const photosOf=p=>[p.photo].concat(p.photos||[]).filter(Boolean);
const isFav=id=>favs.includes(id);
function rating(shopId){const r=S.reviews.filter(x=>x.shop_id===shopId&&x.visible);return {n:r.length,avg:r.length?r.reduce((a,x)=>a+x.note,0)/r.length:0};}
function stars(v,size){size=size||14;let h='<span class="stars" role="img" aria-label="'+v.toFixed(1)+' sur 5">';for(let i=1;i<=5;i++)h+='<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="'+(v>=i-.25?'#F59E0B':v>=i-.75?'#FBD38D':'#E4DCF8')+'"/></svg>';return h+'</span>';}
function ratingHTML(shopId,small){const r=rating(shopId);return r.n?'<span class="rating">'+stars(r.avg,small?12:15)+' <b class="num">'+r.avg.toFixed(1)+'</b> <span class="muted">('+r.n+')</span></span>':'';}
const trackUrl=id=>(isLocal()?location.origin+location.pathname:location.origin+'/')+'#suivi-'+id;
const cartCount=()=>cart.reduce((a,l)=>a+l.qty,0);
const isAdmin=()=>S.role==='admin';

async function q(promise){const r=await promise;if(r.error)throw r.error;return r.data;}
async function safe(promise){try{const r=await promise;return r.error?[]:(r.data||[]);}catch(e){return [];}}
function errMsg(e){const m=(e&&e.message)||String(e);
  if(/Invalid login credentials/i.test(m))return 'Numéro ou mot de passe incorrect.';
  if(/already registered|already exists/i.test(m))return 'Ce numéro a déjà un compte. Connectez-vous.';
  if(/Password should be/i.test(m))return 'Le mot de passe doit avoir au moins 6 caractères.';
  if(/duplicate key.*slug/i.test(m))return 'Ce nom de boutique est déjà pris.';
  if(/Limite gratuite/i.test(m))return m;
  if(/Failed to fetch|NetworkError/i.test(m))return 'Pas de connexion internet. Réessayez.';
  return m;}

async function loadAll(){
  try{
    const sess=await sb.auth.getSession();S.user=sess.data.session?sess.data.session.user:null;S.token=sess.data.session?sess.data.session.access_token:null;
    if(S.user&&!S.expChecked){S.expChecked=true;await safe(sb.rpc('expirer_abonnements'));}
    const [st,shops,prods]=await Promise.all([q(sb.from('settings').select('*').eq('id',1).single()),q(sb.from('shops').select('*').order('created_at')),q(sb.from('products').select('*').order('created_at',{ascending:false}))]);
    S.settings=st;S.settings.paiement=S.settings.paiement||{};S.shops=shops;S.products=prods;S.role='visiteur';S.orders=[];S.txs=[];S.priv={};S.payments=[];S.reports=[];S.blacklist=[];
    const [rv,bn]=await Promise.all([safe(sb.from('reviews').select('*').order('created_at',{ascending:false}).limit(3000)),safe(sb.from('banners').select('*').order('ordre').order('created_at',{ascending:false}))]);
    S.reviews=rv;S.banners=bn;S.conf={};(await safe(sb.rpc('stats_confiance'))).forEach(x=>S.conf[x.shop_id]=x);
    if(S.user){
      const prof=await q(sb.from('profiles').select('role').eq('id',S.user.id).maybeSingle());
      S.role=prof&&prof.role==='admin'?'admin':'vendeur';
      const mine=myShop();
      if(isAdmin()){
        const [o,p]=await Promise.all([q(sb.from('orders').select('*').order('created_at',{ascending:false})),q(sb.from('shop_private').select('*'))]);
        S.orders=o;p.forEach(x=>S.priv[x.shop_id]=x);
        const [pay,rep_,bl]=await Promise.all([safe(sb.from('payments').select('*').order('created_at',{ascending:false})),safe(sb.from('reports').select('*').order('created_at',{ascending:false})),safe(sb.from('blacklist').select('*').order('created_at',{ascending:false}))]);
        S.payments=pay;S.reports=rep_;S.blacklist=bl;S.clientReports=await safe(sb.from('client_reports').select('*').order('created_at',{ascending:false}));S.litiges=await safe(sb.from('conversations').select('*').eq('signale',true).order('last_at',{ascending:false}));
        if(mine)S.txs=await q(sb.from('txs').select('*').eq('shop_id',mine.id).order('date',{ascending:false}));
      }else if(mine){
        const [o,t,p]=await Promise.all([q(sb.from('orders').select('*').eq('shop_id',mine.id).order('created_at',{ascending:false})),q(sb.from('txs').select('*').eq('shop_id',mine.id).order('date',{ascending:false})),q(sb.from('shop_private').select('*').eq('shop_id',mine.id))]);
        S.orders=o;S.txs=t;p.forEach(x=>S.priv[x.shop_id]=x);
        S.payments=await safe(sb.from('payments').select('*').eq('shop_id',mine.id).order('created_at',{ascending:false}));
        S.nbAb=await sb.rpc('nb_abonnes',{sid:mine.id}).then(r=>typeof r.data==='number'?r.data:0,()=>0);
        try{await loadConvs(mine.id);}catch(e){}
      }
    }
    S.error=null;
  }catch(e){S.error=errMsg(e);}
  S.loaded=true;
  ping();
  if(S.user&&!S.synced&&!S.syncing){S.syncing=true;clientSync().finally(()=>{S.syncing=false;});}
  if(!S.user){S.synced=false;S.cnom='';}
  cart=cart.filter(l=>prodById(l.pid));saveCart();
  document.title=S.settings.nom||'Gbairai Market';
}
async function act(fn,okMsg){
  if(ui.busy)return;ui.busy=true;
  try{await fn();if(okMsg)toast(okMsg);await loadAll();render(true);}
  catch(e){toast(errMsg(e));}
  finally{ui.busy=false;}
}

/* ---------- PIECES ---------- */
function tile(p,h,iconSize){
  const inner=p.photo?'<img src="'+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">':ic(ICON[p.categorie]?p.categorie:'autre',iconSize||54,'#fff',1.6);
  return '<div class="tile" style="height:'+h+'px;background:'+grad(p.couleur)+'">'+inner+'</div>';
}
function avatar(s,size){return '<div class="avatar'+(s.logo?' has-logo':'')+'" style="background:'+(s.logo?'#fff':lin(s.couleur))+(size?';width:'+size+'px;height:'+size+'px':'')+'">'+(s.logo?'<img src="'+esc(s.logo)+'" alt="Logo '+esc(s.nom)+'" loading="lazy">':esc(initials(s.nom)))+'</div>';}
const verifBadge=s=>s.verification==='verifie'?VERIF:'';
function logoHTML(){const n=S.settings.nom||'Gbairai Market';return '<a class="logo" href="#accueil"><span class="logo-mark img"><img src="icons/logo.svg" alt=""></span><span class="logo-name">'+esc(n)+'<i>.</i></span></a>';}
function trust(s){const c=S.conf[s.id]||{livrees:0,signalements:0},R=rating(s.id),days=Math.max(0,(Date.now()-new Date(s.created_at))/864e5);
  let sc=(s.verification==='verifie'?30:0)+Math.round(25*Math.min(1,Math.log10(1+c.livrees)/2))+(R.n?Math.round(20*(R.avg/5)*Math.min(1,R.n/5)):0)+Math.round(15*Math.min(1,days/180))+(c.signalements?-15*c.signalements:10);
  sc=Math.max(0,Math.min(100,sc));
  const lab=sc>=80?['Très fiable','#0E7A5F']:sc>=60?['Fiable','#0E7A5F']:sc>=40?['À confirmer','#B45309']:['Prudence','#B91C1C'];
  return {sc,lab:lab[0],col:lab[1],c,R,days,nouveau:days<14&&s.verification!=='verifie'};}
function moisTxt(d){d=Math.floor(d);return d<1?'aujourd\'hui':d<31?d+' jour'+(d>1?'s':''):d<365?Math.floor(d/30)+' mois':Math.floor(d/365)+' an'+(d>=730?'s':'');}
function trustHTML(s){const t=trust(s);
  const it=(e,b,x)=>'<div class="ck"><i>'+e+'</i><span><b>'+b+'</b>'+(x?' · '+x:'')+'</span></div>';
  return '<section class="card stack trustcard"><div class="row" style="gap:14px"><div class="score" style="--p:'+t.sc+'%;--c:'+t.col+'"><b>'+t.sc+'</b></div><div><h2 style="font-size:16px">Indice de confiance</h2><div class="small" style="color:'+t.col+';font-weight:700">'+t.lab+'</div><div class="small muted">Calculé par '+esc(S.settings.nom||'Gbairai Market')+'</div></div></div>'+
  (t.nouveau?'<div class="warn small"><b>⚠ Boutique nouvelle, pas encore vérifiée.</b> Payez seulement à la livraison.</div>':'')+
  '<div class="stack" style="gap:8px">'+
  (s.verification==='verifie'?it('🪪','Identité vérifiée','pièce d\'identité contrôlée'):it('🪪','Identité pas encore vérifiée'))+
  it('📦',t.c.livrees+' commande'+(t.c.livrees>1?'s':'')+' livrée'+(t.c.livrees>1?'s':''),'confirmées par le code du client')+
  (t.R.n?it('⭐',String(t.R.avg.toFixed(1)).replace('.',',')+' / 5',t.R.n+' avis'):it('⭐','Pas encore d\'avis'))+
  it('📅','Sur '+esc(S.settings.nom||'Gbairai Market')+' depuis '+moisTxt(t.days))+
  it('🛡️',t.c.signalements?t.c.signalements+' signalement'+(t.c.signalements>1?'s':'')+' confirmé'+(t.c.signalements>1?'s':''):'0 signalement')+
  (s.paiement_livraison!==false?it('💵','Paiement à la livraison accepté'):it('💵','Paiement avant livraison demandé','soyez prudent'))+
  '</div></section>';}
function tipsHTML(){return '<div class="warn small"><b>Conseils pour acheter sans risque</b><br>• Préférez le paiement à la livraison.<br>• Ne payez jamais tout à l\'avance à un inconnu.<br>• Donnez votre code de livraison seulement quand vous avez l\'article en main.<br>• Un doute ? <a href="#verifier">Vérifiez le numéro</a>.</div>';}
function back(href,label){return '<a class="icon-btn" href="'+href+'" aria-label="'+(label||'Retour')+'">'+ic('back')+'</a>';}

/* ---------- GRAPHIQUES ---------- */
const DAY=864e5;
function dayKey(d){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}
const enLigne=s=>!!(s&&s.vu_le&&Date.now()-new Date(s.vu_le)<5*6e4);
function presenceHTML(s,admin){if(enLigne(s))return '<span class="pres on">En ligne</span>';
  if(s.vu_le&&(admin||Date.now()-new Date(s.vu_le)<864e5))return '<span class="pres">'+(admin?'Vu ':'Actif ')+ago(s.vu_le)+'</span>';
  return admin?'<span class="pres off">Jamais connecté</span>':'';}
function ago(d){const m=Math.round((Date.now()-new Date(d))/6e4);return m<1?'à l\'instant':m<60?'il y a '+m+' min':m<1440?'il y a '+Math.round(m/60)+' h':'il y a '+Math.round(m/1440)+' j';}
function ticker(items,dark){if(!items.length)return '';const one=items.map(t=>'<span class="tk-item">'+t+'</span>').join('<span class="tk-dot" aria-hidden="true">✦</span>');
  const dur=Math.max(18,items.length*5);
  return '<div class="ticker'+(dark?' dark':'')+'" role="marquee" aria-label="Infos en direct"><div class="tk-track" style="animation-duration:'+dur+'s">'+one+'<span class="tk-dot" aria-hidden="true">✦</span>'+one+'<span class="tk-dot" aria-hidden="true">✦</span></div></div>';}
function inPer(d,days){return !days||Date.now()-new Date(d)<days*DAY;}
function trend(cur,prev){if(!prev)return cur?'<em class="up">nouveau</em>':'';const v=Math.round((cur-prev)/prev*100);return '<em class="'+(v>=0?'up':'down')+'">'+(v>=0?'▲ ':'▼ ')+Math.abs(v)+' %</em>';}
function kpi(v,l,t,c){return '<div class="kpi'+(c?' '+c:'')+'"><span>'+l+'</span><b class="num">'+v+'</b>'+(t||'')+'</div>';}
function vchart(days,orders){const n=Math.min(days||30,30),keys=[];for(let i=n-1;i>=0;i--)keys.push(dayKey(Date.now()-i*DAY));
  const val=keys.map(k=>orders.filter(o=>o.statut==='confirmee'&&dayKey(o.created_at)===k).reduce((a,o)=>a+o.total,0));
  const cnt=keys.map(k=>orders.filter(o=>dayKey(o.created_at)===k).length);
  const m=Math.max(1,...val),tot=val.reduce((a,b)=>a+b,0);
  return '<section class="card stack"><div class="row between"><h2 style="font-size:17px">Ventes confirmées par jour</h2><b class="num small">'+F(tot)+'</b></div><div class="vchart" style="--n:'+n+'">'+keys.map((k,i)=>'<div class="vcol" title="'+k.slice(8)+'/'+k.slice(5,7)+' : '+F(val[i])+' · '+cnt[i]+' commande(s)"><span style="height:'+Math.max(val[i]?4:0,val[i]/m*100)+'%"></span>'+(cnt[i]&&!val[i]?'<i></i>':'')+'</div>').join('')+'</div><div class="row between small muted"><span>'+keys[0].slice(8)+'/'+keys[0].slice(5,7)+'</span><span>Aujourd\'hui</span></div></section>';}
function donut(title,parts){const tot=parts.reduce((a,x)=>a+x[1],0);let acc=0;
  const g=tot?parts.map(x=>{const a=acc/tot*360;acc+=x[1];return x[2]+' '+a+'deg '+(acc/tot*360)+'deg';}).join(','):'#EEE9FB 0deg 360deg';
  return '<section class="card stack"><h2 style="font-size:17px">'+title+'</h2><div class="row" style="gap:18px"><div class="donut" style="background:conic-gradient('+g+')"><b class="num">'+tot+'</b></div><div class="stack" style="gap:6px;flex:1;min-width:0">'+parts.map(x=>'<div class="row small between"><span class="row" style="gap:6px"><i class="sw" style="background:'+x[2]+'"></i>'+esc(x[0])+'</span><b class="num">'+x[1]+(tot?' <span class="muted" style="font-weight:500">('+Math.round(x[1]/tot*100)+' %)</span>':'')+'</b></div>').join('')+'</div></div></section>';}
function rankList(title,rows,empty){return '<section class="card stack"><h2 style="font-size:17px">'+title+'</h2>'+(rows.length?rows.map((r,i)=>'<div class="row between rank"><span class="row" style="gap:10px;min-width:0"><b class="rk rk'+i+'">'+(i+1)+'</b><span class="ell">'+r[0]+'</span></span><b class="num small" style="white-space:nowrap">'+r[1]+'</b></div>').join(''):'<p class="muted" style="margin:0">'+(empty||'Pas encore de données.')+'</p>')+'</section>';}
function topProducts(orders,k){const m={};orders.filter(o=>o.statut!=='annulee').forEach(o=>(o.items||[]).forEach(it=>{const key=it.pid||it.nom;m[key]=m[key]||{nom:it.nom,q:0,v:0};m[key].q+=n0(it.qty);m[key].v+=n0(it.qty)*n0(it.prix);}));
  return Object.values(m).sort((a,b)=>b.q-a.q).slice(0,k||5);}
function perChips(cur){return '<div class="row wrapx" style="gap:6px">'+[['7','7 jours'],['30','30 jours'],['0','Tout']].map(x=>'<button type="button" class="chip'+(String(cur)===x[0]?' on':'')+'" data-a="per" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';}

/* ---------- SUIVRE / NOTIFICATIONS / COMPTE CLIENT ---------- */
const isUuid=x=>/^[0-9a-f-]{36}$/i.test(String(x||''));
const isFollow=id=>follows.includes(id);
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const pushOn=()=>pushOK()&&Notification.permission==='granted'&&lsGet('gbairai-push',0)===1;
function b64uBytes(x){x=String(x).replace(/-/g,'+').replace(/_/g,'/');const r=atob(x+'==='.slice((x.length+3)%4));return Uint8Array.from(r,c=>c.charCodeAt(0));}
function b64uStr(bytes){let t='';new Uint8Array(bytes).forEach(b=>t+=String.fromCharCode(b));return btoa(t).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function pushEnable(){
  if(!pushOK()){if(window.GBinstall&&GBinstall.ios&&!GBinstall.installee()){showInstallHelp(true);return false;}toast('Ce navigateur ne permet pas les notifications');return false;}
  const key=S.settings.vapid_public;if(!key){toast('Les alertes seront bientôt disponibles');return false;}
  let perm=Notification.permission;if(perm!=='granted')perm=await Notification.requestPermission();
  if(perm!=='granted'){toast('Alertes refusées. Autorisez-les dans les réglages du navigateur.');return false;}
  try{const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
    if(sub&&sub.options&&sub.options.applicationServerKey&&b64uStr(sub.options.applicationServerKey)!==key){await sub.unsubscribe();sub=null;}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64uBytes(key)});
    lsSet('gbairai-push',1);await pushSync(sub);toast('Alertes activées 🔔');return true;
  }catch(e){toast('Impossible d\'activer les alertes sur ce téléphone');return false;}}
async function pushSync(sub){try{if(!pushOn())return;const reg=await navigator.serviceWorker.ready;sub=sub||await reg.pushManager.getSubscription();if(!sub)return;const j=sub.toJSON();
  await sb.rpc('push_save',{ep:j.endpoint,k:j.keys.p256dh,a:j.keys.auth,sh:follows.filter(isUuid).slice(0,200),ord:myOrders.map(o=>o.id).filter(isUuid).slice(0,50),cv:Object.values(convMap).filter(isUuid).slice(0,50)});}catch(e){}}
async function pushDisable(){try{const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();if(sub){await sb.rpc('push_remove',{ep:sub.endpoint});await sub.unsubscribe();}}catch(e){}lsSet('gbairai-push',0);toast('Alertes désactivées');}
function notify(o){if(!S.token)return;try{fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify(o)}).catch(()=>{});}catch(e){}}
function setFollow(id,on){follows=on?[id].concat(follows.filter(x=>x!==id)):follows.filter(x=>x!==id);lsSet('gbairai-suivis',follows);if(on){seen[id]=new Date().toISOString();lsSet('gbairai-vus',seen);}pushSync();}
const newCount=sid=>{const t=seen[sid];return t?shopProducts(sid).filter(p=>p.visible&&p.stock>0&&p.created_at&&String(p.created_at)>t).length:0;};
function followHTML(s){const f=isFollow(s.id),n=ui.nbAb[s.id];
  if(n===undefined){ui.nbAb[s.id]=null;sb.rpc('nb_abonnes',{sid:s.id}).then(r=>{if(typeof r.data==='number'){ui.nbAb[s.id]=r.data;const el=document.getElementById('nbab');if(el&&r.data)el.textContent=r.data+' abonné'+(r.data>1?'s':'');}},()=>{});}
  return '<div class="row between wrapx" style="gap:8px"><button type="button" class="btn '+(f?'btn-w':'btn-o')+' btn-s" data-a="follow" data-id="'+s.id+'" aria-pressed="'+f+'">'+(f?'✔ Abonné'+(pushOn()?' · 🔔':''):'🔔 Suivre la boutique')+'</button><span class="small muted" id="nbab">'+(n?n+' abonné'+(n>1?'s':''):'')+'</span></div>';}
function mesBoutiquesHTML(){const list=follows.map(shopById).filter(s=>s&&s.statut==='actif');if(!list.length)return '';
  return '<div class="sec-title"><h2>Mes boutiques</h2><a href="#compte" class="small" style="font-weight:700;margin-left:auto">Gérer ›</a></div><div class="mesb">'+list.map(s=>{const n=newCount(s.id);
    return '<a class="mesb-it" href="#boutique-'+esc(s.slug)+'">'+avatar(s,56)+(n?'<span class="mesb-n">+'+n+'</span>':'')+'<b>'+esc(s.nom)+'</b></a>';}).join('')+'</div>';}
function alertCard(txt){
  if(pushOn())return '<div class="good small">🔔 <b>Alertes activées</b> · vous serez prévenu sur ce téléphone.</div>';
  return '<div class="card row between wrapx alertcard" style="gap:10px"><span class="row" style="gap:10px"><span class="bell">🔔</span><span><b>'+txt+'</b><br><span class="small muted">Une notification arrive sur votre téléphone, même site fermé.</span></span></span><button type="button" class="btn btn-v btn-s" data-a="pushOn">Activer</button></div>';}
function installCard(txt){const G=window.GBinstall;if(!G||!G.possible())return '';
  return '<div class="card row between wrapx alertcard" style="gap:10px"><span class="row" style="gap:10px"><img src="icons/logo.svg" alt="" width="40" height="40"><span><b>Installez Gbairai sur votre téléphone</b><br><span class="small muted">'+esc(txt)+'</span></span></span><button type="button" class="btn btn-o btn-s" data-a="install">Installer</button></div>';}
function showInstallHelp(forPush){document.getElementById('layer').innerHTML='<div class="modal" data-a="closeModal"><div class="card stack" data-stop="1"><h2 style="font-size:17px">Installer sur iPhone</h2>'+(forPush?'<p class="small muted" style="margin:0">Sur iPhone, les alertes marchent seulement quand Gbairai est installé.</p>':'')+'<ol class="small" style="margin:0;padding-left:18px;line-height:1.8"><li>Touchez le bouton <b>Partager</b> (carré avec une flèche) en bas de Safari.</li><li>Choisissez <b>« Sur l\'écran d\'accueil »</b>.</li><li>Ouvrez Gbairai depuis l\'écran d\'accueil'+(forPush?', puis activez les alertes':'')+'.</li></ol><button type="button" class="btn btn-v" data-a="closeModal">J\'ai compris</button></div></div>';}
function askAlerts(s){document.getElementById('layer').innerHTML='<div class="modal" data-a="closeModal"><div class="card stack" data-stop="1" style="text-align:center"><div style="font-size:40px">🔔</div><h2 style="font-size:18px">Vous suivez '+esc(s.nom)+'</h2><p class="muted small" style="margin:0">Voulez-vous une alerte quand la boutique ajoute un article ou lance une promo ?</p><button type="button" class="btn btn-v" data-a="pushOn">Oui, activer les alertes</button><button type="button" class="btn btn-w" data-a="closeModal">Plus tard</button></div></div>';}
// Compte client : favoris, boutiques suivies et commandes sur tous les téléphones
let saveT=null;
function clientSaveSoon(){if(!S.user||!S.synced)return;clearTimeout(saveT);saveT=setTimeout(clientSave,800);}
function clientSave(){if(!S.user)return;const m=S.user.user_metadata||{};
  return sb.from('client_data').upsert(Object.assign({user_id:S.user.id,nom:String(S.cnom||m.nom||'').slice(0,80),favs:favs.slice(0,300),follows:follows.slice(0,200),orders:myOrders.slice(0,50),updated_at:new Date().toISOString()},S.hasCk?{ck}:{})).then(()=>{},()=>{});}
async function clientSync(){
  try{const r=await sb.from('client_data').select('*').eq('user_id',S.user.id).maybeSingle();if(r.error)return;const d=r.data||{};
    S.cnom=d.nom||(S.user.user_metadata||{}).nom||'';
    if('ck' in d||r.data===null)S.hasCk='ck' in d;if(d.ck&&d.ck!==ck&&!Object.keys(convMap).length){ck=d.ck;lsSet('gbairai-ck',ck);}
    favs=uniqA(favs.concat(d.favs||[]));follows=uniqA(follows.concat(d.follows||[]));
    const by={};(d.orders||[]).concat(myOrders).forEach(o=>{if(o&&o.id)by[o.id]=Object.assign({},by[o.id],o);});
    myOrders=Object.values(by).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,50);
    S.synced=true;lsSet('gbairai-favoris',favs);lsSet('gbairai-suivis',follows);lsSet('gbairai-mes-commandes',myOrders);await clientSave();pushSync();render(true);
  }catch(e){}}
function vCompte(){
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Mon compte</h1></div>';
  if(!S.user){const t=ui.cTab||'creer';
    return h+'<section class="hero"><span class="ball o" style="right:-46px;top:-46px;width:100px;height:100px"></span><h2 style="color:#fff;font-size:22px;margin:0">Votre compte Gbairai</h2><p style="margin:6px 0 0">Gratuit. Retrouvez vos commandes, vos favoris et vos boutiques sur tous vos téléphones.</p></section>'+
    '<div class="seg2">'+[['creer','Créer mon compte'],['login','Me connecter']].map(x=>'<button type="button" class="chip'+(t===x[0]?' on':'')+'" data-a="cTab" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
    (t==='creer'?'<form class="card stack" data-f="csignup"><label class="lbl">Votre nom<input class="in" name="nom" required maxlength="80" autocomplete="name" value="'+esc(client.nom||'')+'" placeholder="Ex. : Fatou K."></label><label class="lbl">Numéro de téléphone<input class="in" name="phone" type="tel" required autocomplete="tel" value="'+esc(client.tel||'')+'" placeholder="07 XX XX XX XX"></label><label class="lbl">Mot de passe (6 caractères minimum)<input class="in" name="password" type="password" required minlength="6" autocomplete="new-password"></label><button class="btn btn-v btn-block" type="submit">Créer mon compte</button><p class="small muted" style="margin:0">Pas de SMS, pas d\'e-mail : seulement votre numéro et un mot de passe.</p></form>'
    :'<form class="card stack" data-f="clogin"><label class="lbl">Numéro de téléphone<input class="in" name="phone" type="tel" required autocomplete="tel" placeholder="07 XX XX XX XX"></label><label class="lbl">Mot de passe<input class="in" name="password" type="password" required autocomplete="current-password"></label><button class="btn btn-v btn-block" type="submit">Me connecter</button>'+(S.settings.support_whatsapp?'<a class="small" target="_blank" rel="noopener" href="https://wa.me/'+waNum(S.settings.support_whatsapp)+'?text='+encodeURIComponent('Bonjour, j\'ai oublié le mot de passe de mon compte Gbairai.')+'">Mot de passe oublié ?</a>':'')+'</form>')+
    (Object.keys(convMap).length?'<a class="card row between" href="#discussions" style="text-decoration:none;color:var(--ink)"><span>💬 <b>Mes discussions</b></span><span class="small" style="color:#6D28D9;font-weight:700">Ouvrir ›</span></a>':'')+alertCard('Recevoir les alertes sans compte')+installCard('Ouvrez vos boutiques en un geste.')+'</div>';}
  const m=S.user.user_metadata||{},nom=S.cnom||m.nom||'',tel=m.phone||'',sh=myShop();
  const ini=(nom||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const fl=follows.map(shopById).filter(Boolean);
  h+='<section class="card row" style="gap:14px"><span class="av-c">'+esc(ini)+'</span><div style="min-width:0"><b style="font-size:17px">'+esc(nom||'Mon compte')+'</b><div class="small muted">'+esc(tel?'+'+tel:'')+'</div><div class="small" style="color:#0E7A5F;font-weight:700">'+(S.synced?'✔ Synchronisé sur vos téléphones':'Synchronisation…')+'</div></div></section>';
  h+='<a class="card row between" href="#discussions" style="text-decoration:none;color:var(--ink)"><span>💬 <b>Mes discussions</b></span><span class="small" style="color:#6D28D9;font-weight:700">Ouvrir ›</span></a>';
  h+='<div class="grid2"><a class="card stack kpi-l" href="#commandes"><b style="font-size:22px">'+myOrders.length+'</b><span class="small muted">Mes commandes</span></a><a class="card stack kpi-l" href="#favoris"><b style="font-size:22px">'+favs.length+'</b><span class="small muted">Mes favoris</span></a></div>';
  h+=pushOn()?'<div class="card row between" style="gap:10px"><span>🔔 <b>Alertes activées</b><br><span class="small muted">Nouveautés de vos boutiques et étapes de vos commandes</span></span><button type="button" class="btn btn-w btn-s" data-a="pushOff">Désactiver</button></div>':alertCard('Activer les alertes');
  h+='<section class="card stack"><h2 style="font-size:16px">Boutiques que je suis ('+fl.length+')</h2>'+(fl.length?fl.map(s=>'<div class="row between"><a class="row" href="#boutique-'+esc(s.slug)+'" style="gap:10px;min-width:0">'+avatar(s,40)+'<b style="min-width:0">'+esc(s.nom)+'</b></a><button type="button" class="btn btn-w btn-s" data-a="follow" data-id="'+s.id+'">Ne plus suivre</button></div>').join(''):'<p class="small muted" style="margin:0">Touchez « 🔔 Suivre la boutique » sur la page d\'une boutique.</p>')+'</section>';
  h+=installCard('Retrouvez vos commandes en un geste.');
  h+=isAdmin()?'<a class="btn btn-w btn-block" href="#admin">Administration</a>':'<a class="btn btn-w btn-block" href="#vendeur">'+(sh?'Mon espace vendeur':'🏪 Vendre sur Gbairai : créer ma boutique')+'</a>';
  return h+'<button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button></div>';
}

/* ---------- DISCUSSIONS ---------- */
function notifyAnon(o){try{fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)}).catch(()=>{});}catch(e){}}
const hm=d=>{const x=new Date(d),t=new Date();return (x.toDateString()===t.toDateString()?'':x.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' ')+x.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});};
function bubbles(msgs,me,empty){if(!msgs)return '<p class="muted small" style="text-align:center">Chargement…</p>';if(!msgs.length)return empty;
  return msgs.map(m=>'<div class="bub '+(m.de===me?'me':'them')+'"><p>'+esc(m.texte).replace(/\n/g,'<br>')+'</p><small>'+hm(m.created_at)+'</small></div>').join('');}
function chatSt(sid){return ui.chat[sid]||(ui.chat[sid]={msgs:null,busy:false});}
function chatLoad(sid,soft){const st=chatSt(sid),cid=convMap[sid];if(st.busy)return;
  if(!cid){st.msgs=[];if(!soft)render(true);return;}
  st.busy=true;sb.rpc('conv_messages',{cid,k:ck}).then(r=>{st.busy=false;const m=(r.data||[]).slice().reverse();const ch=!st.msgs||st.msgs.length!==m.length;st.msgs=m;if(ch)softRender();},()=>{st.busy=false;if(!st.msgs){st.msgs=[];render(true);}});}
function softRender(){const a=document.activeElement,keep={};document.querySelectorAll('[data-keep]').forEach(el=>keep[el.dataset.keep]=el.value);
  const fid=a&&a.dataset?a.dataset.keep:null;render(true);
  Object.keys(keep).forEach(k=>{const el=document.querySelector('[data-keep="'+k+'"]');if(el)el.value=keep[k];});
  if(fid){const el=document.querySelector('[data-keep="'+fid+'"]');if(el)el.focus();}
  const box=document.getElementById('chatbox');if(box)box.scrollTop=box.scrollHeight;}
function vChat(arg){const sid=arg.split('~')[0],pid=arg.split('~')[1],s=shopById(sid);
  if(!s||s.statut!=='actif')return '<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Boutique introuvable</h1></div></div>';
  const st=chatSt(sid);if(st.msgs===null&&!st.busy)setTimeout(()=>chatLoad(sid),0);
  const p=pid&&prodById(pid),pre=p&&!st.msgs?.length?'Bonjour, à propos de « '+p.nom+' » ('+F(prix(p))+') : ':'';
  const need=!client.nom;
  return '<div class="wrap narrow chatwrap"><div class="row chathead">'+back('#boutique-'+esc(s.slug))+avatar(s,42)+'<div style="min-width:0"><b>'+esc(s.nom)+'</b><div>'+(presenceHTML(s)||'<span class="small muted">Répond ici dès qu\'il voit votre message</span>')+'</div></div></div>'+
  '<div class="chat-note">🔒 Discussion gardée par Gbairai. En cas de litige, notre équipe peut la lire pour vous protéger.</div>'+
  '<div class="chatbox" id="chatbox">'+bubbles(st.msgs,'client','<div class="bub them"><p>Bonjour 👋 Posez votre question à <b>'+esc(s.nom)+'</b> : taille, couleur, prix, livraison… La réponse arrive ici.</p></div>')+'</div>'+
  '<form class="chatform card" data-f="chatSend" data-id="'+s.id+'">'+(need?'<div class="grid2"><input class="in" name="nom" required maxlength="80" placeholder="Votre nom" aria-label="Votre nom" data-keep="cnom"><input class="in" name="tel" type="tel" maxlength="30" placeholder="Téléphone (facultatif)" aria-label="Votre téléphone" data-keep="ctel"></div>':'')+
  '<div class="row" style="gap:8px;align-items:flex-end"><textarea class="in" name="texte" rows="2" required maxlength="1000" placeholder="Votre message…" aria-label="Votre message" data-keep="ctxt" style="flex:1;resize:none">'+esc(pre)+'</textarea><button class="btn btn-v" type="submit" aria-label="Envoyer" style="height:52px;width:56px;padding:0">'+ic('tg',22,'#fff')+'</button></div></form>'+
  (pushOn()?'':alertCard('Être prévenu quand le vendeur répond'))+
  '<div class="row between wrapx small" style="gap:8px"><a target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'">Préférez WhatsApp ? Écrire sur WhatsApp ›</a>'+(convMap[sid]?'<button type="button" class="linkbtn" data-a="convSignal" data-id="'+s.id+'">⚑ Signaler un problème</button>':'')+'</div></div>';}
function vDiscussions(){
  if(ui.dl===undefined){ui.dl=null;sb.rpc('conv_liste',{k:ck}).then(r=>{ui.dl=r.data||[];render(true);},()=>{ui.dl=[];render(true);});}
  const L=ui.dl;let h='<div class="wrap narrow"><div class="row">'+back('#compte')+'<h1 style="font-size:20px">Mes discussions</h1></div>';
  if(!L)return h+'<p class="muted">Chargement…</p></div>';
  if(!L.length)return h+'<div class="card stack" style="text-align:center;padding:26px"><b>Aucune discussion</b><span class="small muted">Sur la page d\'une boutique, touchez « 💬 Discuter ici ».</span></div></div>';
  return h+'<div class="card stack" style="gap:0;padding:6px">'+L.map(c=>{const s=shopById(c.shop_id);if(!s)return '';
    return '<a class="convrow" href="#chat-'+s.id+'">'+avatar(s,44)+'<span class="convtxt"><b>'+esc(s.nom)+'</b><span class="small muted">'+esc(c.last_msg||'')+'</span></span><span class="convmeta"><small>'+hm(c.last_at)+'</small>'+(c.non_lus?'<span class="cnt-pill on">'+c.non_lus+'</span>':'')+'</span></a>';}).join('')+'</div></div>';}
function vvMessages(s){
  const L=S.convs||[],c=ui.conv&&L.find(x=>x.id===ui.conv);
  const alerts=pushOn()?'<div class="good small">🔔 Vous êtes prévenu des nouveaux messages sur ce téléphone.</div>':alertCard('Être prévenu des nouveaux messages');
  if(c){const st=ui.vmsgs[c.id];if(st===undefined){ui.vmsgs[c.id]=null;loadVMsgs(c.id);}
    return '<section class="card stack chatwrap"><div class="row between"><button type="button" class="btn btn-w btn-s" data-a="convBack">‹ Toutes</button><span class="small muted">'+esc(c.client_tel||'')+'</span></div><b style="font-size:17px">'+esc(c.client_nom||'Client')+'</b>'+(c.client_tel?fiabHTML(c.client_tel,s.id):'')+
    '<div class="chatbox" id="chatbox">'+bubbles(ui.vmsgs[c.id],'vendeur','<p class="muted small">Aucun message.</p>')+'</div>'+
    '<form class="row chatform" data-f="vReply" data-id="'+c.id+'" style="gap:8px;align-items:flex-end"><textarea class="in" name="texte" rows="2" required maxlength="1000" placeholder="Votre réponse…" aria-label="Votre réponse" data-keep="vtxt" style="flex:1;resize:none"></textarea><button class="btn btn-v" type="submit" aria-label="Envoyer" style="height:52px;width:56px;padding:0">'+ic('tg',22,'#fff')+'</button></form>'+
    '<div class="row between wrapx small" style="gap:8px">'+(c.client_tel?'<a target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.client_tel)+'">Continuer sur WhatsApp ›</a>':'<span></span>')+(c.signale?'<span class="badge b-orange">Signalée</span>':'<button type="button" class="linkbtn" data-a="convSignalV" data-id="'+c.id+'">⚑ Signaler (litige)</button>')+'</div></section>'+alerts;}
  return alerts+'<section class="card stack" style="gap:0;padding:6px">'+(L.length?L.map(c=>'<button type="button" class="convrow" data-a="convOpen" data-id="'+c.id+'"><span class="av-c" style="width:44px;height:44px;font-size:16px;box-shadow:none">'+esc((c.client_nom||'?').slice(0,2).toUpperCase())+'</span><span class="convtxt"><b>'+esc(c.client_nom||'Client')+'</b><span class="small muted">'+esc(c.last_msg||'')+'</span></span><span class="convmeta"><small>'+hm(c.last_at)+'</small>'+(c.non_lus_vendeur?'<span class="cnt-pill on">'+c.non_lus_vendeur+'</span>':'')+'</span></button>').join(''):'<div style="text-align:center;padding:24px" class="stack"><b>Pas encore de message</b><span class="small muted">Les clients peuvent maintenant vous écrire depuis votre boutique avec « 💬 Discuter ici ».</span></div>')+'</section>';}
function loadVMsgs(cid){sb.from('messages').select('*').eq('conv_id',cid).order('id',{ascending:true}).limit(300).then(r=>{const m=r.data||[];const o=ui.vmsgs[cid];ui.vmsgs[cid]=m;if(!o||o.length!==m.length)softRender();},()=>{ui.vmsgs[cid]=[];});
  const c=(S.convs||[]).find(x=>x.id===cid);if(c&&c.non_lus_vendeur){c.non_lus_vendeur=0;sb.rpc('conv_lu',{cid}).then(()=>{},()=>{});}}
async function loadConvs(sid){const r=await sb.from('conversations').select('*').eq('shop_id',sid).order('last_at',{ascending:false}).limit(100);if(!r.error)S.convs=r.data||[];}
function aLitiges(){const L=S.litiges||[],c=ui.lit&&L.find(x=>x.id===ui.lit);
  if(c){const st=ui.vmsgs[c.id];if(st===undefined){ui.vmsgs[c.id]=null;sb.from('messages').select('*').eq('conv_id',c.id).order('id').limit(500).then(r=>{ui.vmsgs[c.id]=r.data||[];render(true);},()=>{});}
    const s=shopById(c.shop_id);
    return '<section class="card stack chatwrap" style="max-width:720px"><div class="row between"><button type="button" class="btn btn-w btn-s" data-a="litBack">‹ Tous les litiges</button><span class="badge b-orange">Litige</span></div><b>'+esc(c.client_nom||'Client')+' '+esc(c.client_tel||'')+' ↔ '+esc(s?s.nom:'?')+'</b>'+(c.motif?'<div class="warn small">Motif : '+esc(c.motif)+'</div>':'')+
    '<div class="chatbox" style="max-height:none">'+bubbles(ui.vmsgs[c.id],'vendeur','<p class="muted small">Aucun message.</p>').replace(/class="bub me"/g,'class="bub me" title="Vendeur"')+'</div><p class="small muted" style="margin:0">À droite : le vendeur. À gauche : le client.</p>'+
    '<div class="row wrapx" style="gap:8px">'+(c.client_tel?'<a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.client_tel)+'">WhatsApp du client</a>':'')+(s?'<a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'">WhatsApp du vendeur</a>':'')+(c.client_tel?'<button type="button" class="btn btn-r btn-s" data-a="litBlock" data-id="'+c.id+'">Bloquer le numéro du client</button>':'')+'<button type="button" class="btn btn-v btn-s" data-a="litClose" data-id="'+c.id+'">Clore le litige</button></div><p class="small muted" style="margin:0">Une fois close, la discussion redevient privée : vous ne la voyez plus.</p></section>';}
  return '<section class="card stack" style="max-width:720px"><h2 style="font-size:17px">Discussions signalées</h2><p class="small muted" style="margin:0">Vous ne voyez une discussion que si le client ou le vendeur la signale.</p>'+(L.length?L.map(c=>{const s=shopById(c.shop_id);return '<button type="button" class="convrow" data-a="litOpen" data-id="'+c.id+'"><span class="convtxt"><b>'+esc(c.client_nom||'Client')+' ↔ '+esc(s?s.nom:'?')+'</b><span class="small muted">'+esc(c.motif||c.last_msg||'')+'</span></span><span class="convmeta"><small>'+hm(c.last_at)+'</small></span></button>';}).join(''):'<p class="muted" style="margin:0">Aucun litige pour le moment 👍</p>')+'</section>';}
setInterval(()=>{if(document.hidden||!S.loaded)return;const h=(location.hash||'').slice(1);
  if(h.startsWith('chat-'))chatLoad(h.slice(5).split('~')[0],true);
  else if(h==='vendeur'&&myShop()&&!isAdmin()){const s=myShop();loadConvs(s.id).then(()=>{if(ui.vTab==='messages'&&ui.conv)loadVMsgs(ui.conv);else if(ui.vTab==='messages')softRender();});}},10000);

/* ---------- CLIENT ---------- */
function vAccueil(){
  const cnt={};S.shops.filter(s=>s.statut==='actif').forEach(s=>{const v=villeOf(s);cnt[v]=(cnt[v]||0)+1;});
  const qs=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).concat(villes()).filter((v,i,a)=>a.indexOf(v)===i).slice(0,12);
  return '<div class="wrap"><div class="row between">'+logoHTML()+'<div class="row" style="gap:8px"><a class="icon-btn" href="#commandes" aria-label="Mes commandes">'+ic('truck',20,'#5B21B6')+'</a><a class="icon-btn favlink" href="#favoris" aria-label="Mes favoris">'+ic('heart',20,'#9D174D')+(favs.length?'<span class="cnt">'+favs.length+'</span>':'')+'</a><a class="icon-btn" href="#compte" aria-label="Mon compte">'+ic('user',20,S.user?'#0E7A5F':'#5B21B6')+'</a>'+(isAdmin()?'<a class="btn btn-w btn-s" href="#admin">Admin</a>':'<a class="btn btn-w btn-s" href="#vendeur">Je suis vendeur</a>')+'</div></div>'+
  '<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:140px;height:140px"></span><span class="ball g" style="right:70px;top:70px;width:38px;height:38px"></span><h1>Toutes les boutiques de Côte d\'Ivoire, au même endroit</h1><p>Choisissez, puis commandez directement sur WhatsApp</p>'+
  '<label class="search">'+ic('search',20,'#6B5B8C')+'<span hidden>Rechercher</span><input id="q" type="search" placeholder="Robe, sneakers, iPhone, boutique…" value="'+esc(ui.q)+'" data-i="q"></label></section>'+
  '<div class="chips">'+['Tous'].concat(qs).map(x=>'<button type="button" class="chip'+(ui.quartier===x?' on':'')+'" data-a="quartier" data-id="'+esc(x)+'">'+(x==='Tous'?'Toute la Côte d\'Ivoire':esc(x)+(cnt[x]?' <small>'+cnt[x]+'</small>':''))+'</button>').join('')+'</div>'+
  bannersHTML()+homeTicker()+mesBoutiquesHTML()+rayonsHTML()+'<a class="safebar" href="#verifier">'+ic('shield',20,'#0E7A5F')+'<span><b>Achetez en sécurité</b><small>Vérifiez un numéro avant de payer</small></span>'+ic('back',16,'#0E7A5F')+'</a>'+flashHTML()+'<div id="results" class="stack">'+results()+'</div></div>';
}
function homeTicker(){const act=S.shops.filter(s=>s.statut==='actif'),ok=new Set(act.map(s=>s.id));
  const vis=S.products.filter(p=>p.visible&&p.stock>0&&ok.has(p.shop_id));
  const it=[];
  act.filter(s=>s.vedette).slice(0,4).forEach(s=>it.push('⭐ <a href="#boutique-'+esc(s.slug)+'">'+esc(s.nom)+'</a> · '+esc(place(s))));
  vis.filter(promoOn).slice(0,4).forEach(p=>it.push('⚡ -'+pct(p)+' % : <a href="#produit-'+p.id+'">'+esc(p.nom)+'</a> <b>'+F(p.prix)+'</b>'));
  vis.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,6).forEach(p=>it.push('🆕 <a href="#produit-'+p.id+'">'+esc(p.nom)+'</a> <b>'+F(prix(p))+'</b>'));
  vis.filter(p=>p.stock<=3).slice(0,3).forEach(p=>it.push('⏳ Plus que '+p.stock+' : <a href="#produit-'+p.id+'">'+esc(p.nom)+'</a>'));
  if(act.length)it.push('🏪 '+act.length+' boutique'+(act.length>1?'s':'')+' · '+vis.length+' articles · commande directe sur WhatsApp');
  return ticker(it);}
function results(){
  const qq=ui.q.trim().toLowerCase();
  const ok=s=>s.statut==='actif'&&(ui.quartier==='Tous'||villeOf(s)===ui.quartier);
  const shops=S.shops.filter(s=>ok(s)&&(!ui.cat||s.categorie===ui.cat||shopProducts(s.id).some(p=>p.categorie===ui.cat))&&(!qq||(s.nom+' '+s.quartier+' '+villeOf(s)).toLowerCase().includes(qq)))
    .sort((a,b)=>(b.vedette-a.vedette)||((b.verification==='verifie')-(a.verification==='verifie')));
  const prods=S.products.filter(p=>{const s=shopById(p.shop_id);return s&&ok(s)&&p.visible&&p.stock>0&&(!ui.cat||p.categorie===ui.cat)&&(!qq||(p.nom+' '+(p.description||'')+' '+s.nom+' '+(p.type||'')+' '+catName(p.categorie)).toLowerCase().includes(qq));});
  let h='<div class="sec-title"><h2>Boutiques</h2><span class="cnt-pill">'+shops.length+'</span></div>';
  h+=shops.length?'<div class="shops">'+shops.map(shopCard).join('')+'</div>':'<p class="muted">Aucune boutique pour l\'instant.'+(S.shops.length?'':' <a href="#vendeur">Créez la première !</a>')+'</p>';
  h+='<div class="sec-title"><h2>Produits</h2><span class="cnt-pill">'+prods.length+'</span></div>';
  h+=prods.length?'<div class="pgrid">'+prods.map(pCard).join('')+'</div>':'<p class="muted">Aucun produit trouvé.</p>';
  return h;
}
function shopCard(s){const n=shopProducts(s.id).filter(p=>p.visible).length;
  return '<a class="shop" href="#boutique-'+esc(s.slug)+'"><div class="shop-cover" style="background:'+lin(s.couleur)+'">'+avatar(s)+(s.vedette?'<span class="badge b-orange" style="position:absolute;right:10px;top:10px">Vedette</span>':'')+'</div><div class="shop-body"><div class="shop-name">'+esc(s.nom)+verifBadge(s)+'</div>'+(enLigne(s)?'<span class="pres on">En ligne</span>':'')+'<div class="muted small" style="margin-top:4px">'+esc(place(s))+' · '+esc(catName(s.categorie))+' · '+n+' produit'+(n>1?'s':'')+'</div>'+ratingHTML(s.id,true)+'</div></a>';}
function pCard(p){const inCart=cart.some(l=>l.pid===p.id),pr=promoOn(p);
  return '<div class="pcard"><div class="ptile"><a href="#produit-'+p.id+'">'+tile(p,120)+'</a>'+(pr?'<span class="pct">-'+pct(p)+' %</span>':'')+(pr&&p.promo_fin?'<span class="flash">'+ic('bolt',11,'#1B1033',2.4)+cdHTML(p.promo_fin)+'</span>':'')+favBtn(p.id)+'</div><a href="#produit-'+p.id+'"><div class="pname">'+esc(p.nom)+'</div></a><div class="pfoot"><span class="pp">'+priceHTML(p)+'</span>'+
  (p.stock>0?'<button type="button" class="add'+(inCart?' in':'')+'" data-a="add" data-id="'+p.id+'" aria-label="'+(inCart?'Déjà dans le panier':'Ajouter au panier')+'">'+ic(inCart?'check':'plus',18,'#fff',2.6)+'</button>':'<span class="badge b-grey">Rupture</span>')+'</div></div>';}
function favBtn(id,big){const on=isFav(id);return '<button type="button" class="fav'+(on?' on':'')+(big?' big':'')+'" data-a="fav" data-id="'+id+'" aria-label="'+(on?'Retirer des favoris':'Ajouter aux favoris')+'" aria-pressed="'+on+'">'+ic('heart',big?20:16,on?'#fff':'#9D174D',2.2)+'</button>';}
function bannersHTML(){const b=S.banners.filter(x=>x.actif&&String(x.debut||'')<=today()&&(!x.fin||x.fin>=today()));if(!b.length)return '';
  return '<div class="banners" id="banners">'+b.map(x=>{const s=x.shop_id&&shopById(x.shop_id);const href=x.lien||(s?'#boutique-'+s.slug:'#accueil');const ext=/^https?:/.test(href);
    return '<a class="banner" href="'+esc(href)+'"'+(ext?' target="_blank" rel="noopener"':'')+' style="background:'+(x.image?'#1B1033':lin(x.couleur))+'">'+(x.image?'<img src="'+esc(x.image)+'" alt="" loading="lazy">':'')+'<span class="bn-txt"><span class="bn-tag">'+ic('megaphone',12,'#1B1033',2.4)+'Sponsorisé</span><b>'+esc(x.titre)+'</b>'+(x.sous_titre?'<span>'+esc(x.sous_titre)+'</span>':'')+'</span></a>';}).join('')+'</div>'+(b.length>1?'<div class="bn-dots">'+b.map((x,i)=>'<i class="'+(i?'':'on')+'"></i>').join('')+'</div>':'');}
function flashHTML(){const ok=new Set(S.shops.filter(s=>s.statut==='actif').map(s=>s.id));
  const ps=S.products.filter(p=>p.visible&&p.stock>0&&ok.has(p.shop_id)&&promoOn(p)).sort((a,b)=>(a.promo_fin?0:1)-(b.promo_fin?0:1)||pct(b)-pct(a)).slice(0,12);
  if(!ps.length)return '';
  return '<section class="flashbox"><div class="row" style="gap:8px"><h2 class="row" style="gap:6px;font-size:18px">'+ic('bolt',20,'#FF7A1A',2.4)+'Promos et ventes flash</h2><span class="cnt-pill">'+ps.length+'</span></div><div class="hscroll">'+ps.map(pCard).join('')+'</div></section>';}
function vBoutique(slug){
  const s=S.shops.find(x=>x.slug===slug);
  if(s&&isFollow(s.id)&&ui.seenNow!==s.id){ui.seenNow=s.id;setTimeout(()=>{seen[s.id]=new Date().toISOString();lsSet('gbairai-vus',seen);},0);}
  if(!s||s.statut!=='actif')return '<div class="wrap">'+back('#accueil')+'<div class="card"><h2>Boutique introuvable</h2><p class="muted">Cette boutique n\'existe pas ou est suspendue.</p></div></div>';
  const prods=shopProducts(s.id).filter(p=>p.visible);
  const lines=cart.filter(l=>{const p=prodById(l.pid);return p&&p.shop_id===s.id;});
  const tot=lines.reduce((a,l)=>a+prix(prodById(l.pid))*l.qty,0);
  return '<div class="wrap"><div class="cover" style="background:'+lin(s.couleur)+'"><span class="ball o" style="right:30px;top:40px;width:70px;height:70px;border-radius:22px;transform:rotate(18deg)"></span><div class="row between" style="padding:16px max(16px,env(safe-area-inset-left,0px))">'+back('#accueil')+'<button type="button" class="icon-btn" data-a="copy" data-text="'+esc(shopUrl(s))+'" aria-label="Copier le lien de la boutique">'+ic('share')+'</button></div></div>'+
  '<div class="card stack" style="margin-top:-70px;position:relative"><div class="row">'+avatar(s,64)+'<div style="min-width:0"><h1 class="row" style="font-size:19px;gap:6px">'+esc(s.nom)+verifBadge(s)+'</h1><div class="muted small row" style="gap:4px;margin-top:3px">'+ic('pin',14)+esc(place(s))+(s.adresse?', '+esc(s.adresse):'')+'</div>'+presenceHTML(s)+ratingHTML(s.id)+'</div></div>'+
  (s.description?'<p style="margin:0;font-size:14px;line-height:1.5;color:#3D3256">'+esc(s.description)+'</p>':'')+
  (s.livraison_zones?'<div class="small muted">Livraison : '+esc(s.livraison_zones)+(s.livraison_frais?' · '+esc(s.livraison_frais)+' F':'')+'</div>':'')+
  '<div class="grid2"><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'">'+ic('wa',18,'#fff')+'WhatsApp</a>'+(s.telegram?'<a class="btn btn-t btn-s" target="_blank" rel="noopener" href="https://t.me/'+esc(s.telegram.replace(/^@/,''))+'">'+ic('tg',18,'#1E4FA8')+'Telegram</a>':'<button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(shopUrl(s))+'">'+ic('link',16)+'Copier le lien</button>')+'</div><a class="btn btn-v btn-s btn-block" href="#chat-'+s.id+'">💬 Discuter ici avec la boutique</a>'+followHTML(s)+'</div>'+
  trustHTML(s)+
  '<div class="sec-title"><h2>Produits</h2><span class="cnt-pill">'+prods.length+'</span></div>'+
  (prods.length?'<div class="pgrid">'+prods.map(pCard).join('')+'</div>':'<p class="muted">Cette boutique n\'a pas encore de produits.</p>')+
  (lines.length?'<a class="btn btn-v btn-block" href="#panier" style="justify-content:space-between"><span>'+lines.reduce((a,l)=>a+l.qty,0)+' article(s) · <span class="num">'+fmtN(tot)+' FCFA</span></span><span>Voir le panier</span></a>':'')+
  reviewsHTML(s)+tipsHTML()+'<button type="button" class="linkbtn" data-a="report" data-id="'+s.id+'">'+ic('flag',14)+'Signaler cette boutique</button>'+alsoHTML(s)+'</div>';
}
function alsoHTML(s){const cats=new Set(shopProducts(s.id).map(p=>p.categorie).concat([s.categorie])),v=villeOf(s);
  const list=S.shops.filter(x=>x.id!==s.id&&x.statut==='actif').map(x=>({x,k:(x.categorie===s.categorie?3:0)+(shopProducts(x.id).some(p=>cats.has(p.categorie))?1:0)+(villeOf(x)===v?2:0)+(x.verification==='verifie'?1:0)+(x.vedette?1:0)+Math.random()*.5}))
    .sort((a,b)=>b.k-a.k).slice(0,6).map(o=>o.x);
  if(!list.length)return '';
  return '<section class="stack also"><div class="sec-title"><h2>Vous aimerez aussi</h2><a href="#accueil" class="small" style="font-weight:700;margin-left:auto">Toutes les boutiques ›</a></div><div class="also-row">'+list.map(shopCard).join('')+'</div><a class="btn btn-v btn-block" href="#accueil">'+ic('home',18,'#fff')+'Voir toutes les boutiques</a></section>';}
function reviewsHTML(s){const r=S.reviews.filter(x=>x.shop_id===s.id&&x.visible),R=rating(s.id),done=lsGet('gbairai-avis',[]).includes(s.id);
  const dist=[5,4,3,2,1].map(k=>[k,r.filter(x=>x.note===k).length]);
  return '<section class="card stack"><div class="row between"><h2 style="font-size:17px">Avis des clients</h2>'+(R.n?'<span class="row" style="gap:6px">'+stars(R.avg,16)+'<b class="num">'+R.avg.toFixed(1)+'</b></span>':'')+'</div>'+
  (R.n?'<div class="stack" style="gap:4px">'+dist.map(d=>'<div class="row small" style="gap:8px"><span style="width:24px">'+d[0]+'★</span><span class="bar"><span style="width:'+(d[1]/R.n*100)+'%;background:linear-gradient(90deg,#FBBF24,#F59E0B)"></span></span><span class="num muted" style="width:22px;text-align:right">'+d[1]+'</span></div>').join('')+'</div>':'<p class="muted" style="margin:0">Pas encore d\'avis. Soyez le premier !</p>')+
  r.slice(0,8).map(x=>'<div class="review"><div class="row between"><b>'+esc(x.nom)+'</b>'+stars(x.note,13)+'</div>'+(x.commentaire?'<p>'+esc(x.commentaire)+'</p>':'')+'<span class="small muted">'+ago(x.created_at)+'</span></div>').join('')+
  (done?'<p class="small muted" style="margin:0">Merci, votre avis est enregistré.</p>':'<form class="stack" data-f="avis" data-id="'+s.id+'" style="gap:10px;border-top:1px dashed #E4DCF8;padding-top:12px"><b>Donner mon avis</b><div class="starpick" role="radiogroup" aria-label="Note">'+[1,2,3,4,5].map(k=>'<label><input type="radio" name="note" value="'+k+'"'+(k===5?' checked':'')+'><span aria-hidden="true">★</span><span hidden>'+k+' étoile'+(k>1?'s':'')+'</span></label>').join('')+'</div><label class="lbl">Votre prénom<input class="in" name="nom" required maxlength="60" value="'+esc(client.nom)+'"></label><label class="lbl">Commentaire<textarea class="in" name="commentaire" rows="2" maxlength="600" placeholder="Qualité, livraison, accueil…"></textarea></label><button class="btn btn-v btn-s" type="submit">Publier mon avis</button></form>')+'</section>';}
function orderText(s,lines,id){const tot=lines.reduce((a,l)=>a+prix(l.p)*l.qty,0);
  const c=[client.nom,client.tel,client.adresse].map(x=>String(x||'').trim()).filter(Boolean);
  return 'Bonjour '+s.nom+', je veux commander :\n'+lines.map(l=>'• '+l.qty+' × '+l.p.nom+(l.taille?' ('+l.taille+')':'')+' – '+F(prix(l.p)*l.qty)).join('\n')+'\nTotal : '+fmtN(tot)+' FCFA'+(c.length?'\n\n👤 '+c.join(' · '):'')+'\n\n📦 Commande n° '+String(id).slice(0,8).toUpperCase()+'\nSuivi : '+trackUrl(id)+'\nVu sur '+(S.settings.nom||'Gbairai Market');}
function vProduit(id){
  const p=prodById(id);const s=p&&shopById(p.shop_id);
  if(!p||!s||!p.visible)return '<div class="wrap">'+back('#accueil')+'<div class="card"><h2>Produit introuvable</h2></div></div>';
  const tailles=(p.tailles||'').split(',').map(t=>t.trim()).filter(Boolean);
  if(tailles.length&&!tailles.includes(ui.taille))ui.taille=tailles[0];if(!tailles.length)ui.taille=null;
  const single=[{p,qty:1,taille:ui.taille}],sid=oid('p-'+p.id),ph=photosOf(p);
  return '<div class="wrap"><div class="row between">'+back('#boutique-'+esc(s.slug),'Retour à la boutique')+'<div class="row" style="gap:8px"><a class="icon-btn" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(prodShareText(p))+'" aria-label="Partager ce produit sur WhatsApp">'+ic('share')+'</a><button type="button" class="icon-btn" data-a="share" data-id="'+p.id+'" aria-label="Image pour le statut">'+ic('image')+'</button>'+favBtn(p.id,true)+'</div></div>'+
  '<div class="galwrap">'+(ph.length>1?'<div class="gal" id="gal">'+ph.map((u,i)=>'<img src="'+esc(u)+'" alt="Photo '+(i+1)+' de '+esc(p.nom)+'" loading="'+(i?'lazy':'eager')+'">').join('')+'</div><div class="gal-dots">'+ph.map((u,i)=>'<button type="button" class="'+(i?'':'on')+'" data-a="galGo" data-i="'+i+'" aria-label="Photo '+(i+1)+'"></button>').join('')+'</div>':tile(p,320,140))+
  (promoOn(p)?'<span class="pct big">-'+pct(p)+' %</span>':'')+'</div>'+
  (promoOn(p)&&p.promo_fin?'<div class="flashbar">'+ic('bolt',18,'#1B1033',2.4)+'<b>Vente flash</b> · se termine dans '+cdHTML(p.promo_fin)+'</div>':'')+
  '<div class="card stack"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><h1 style="font-size:21px">'+esc(p.nom)+'</h1><a class="small" href="#boutique-'+esc(s.slug)+'">'+esc(s.nom)+' · '+esc(place(s))+'</a></div><div class="pp big" style="white-space:nowrap;text-align:right">'+priceHTML(p)+'</div></div>'+
  (p.description?'<div><h2 style="font-size:13px;font-family:var(--body);font-weight:700;margin-bottom:6px">Description</h2><p style="margin:0;line-height:1.55;color:#3D3256;white-space:pre-line">'+esc(p.description)+'</p></div>':'')+
  (tailles.length?'<div><h2 style="font-size:13px;font-family:var(--body);font-weight:700;margin-bottom:8px">Taille</h2><div class="row wrapx">'+tailles.map(t=>'<button type="button" class="chip'+(ui.taille===t?' on':'')+'" data-a="taille" data-id="'+esc(t)+'" style="min-width:48px;height:44px">'+esc(t)+'</button>').join('')+'</div></div>':'')+
  '<div class="row wrapx">'+(p.stock>0?'<span class="badge b-green">En stock</span>':'<span class="badge b-grey">Rupture de stock</span>')+(p.stock>0&&p.stock<=3?'<span class="badge b-orange">Plus que '+p.stock+'</span>':'')+'<a class="badge b-violet" href="#rayon-'+esc(p.categorie||'autre')+'">'+esc(catName(p.categorie))+(p.type?' · '+esc(p.type):'')+'</a></div></div>'+
  (p.stock>0?'<div class="row"><button type="button" class="btn btn-v" style="flex:1" data-a="addT" data-id="'+p.id+'">Ajouter au panier</button><a class="btn btn-g" style="width:58px;padding:0" target="_blank" rel="noopener" data-a="order" data-shop="'+s.id+'" data-single="'+p.id+'" data-oid="'+sid+'" href="https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(orderText(s,single,sid))+'" aria-label="Commander ce produit sur WhatsApp">'+ic('wa',24,'#fff')+'</a></div>':'')+'</div>';
}
function vPanier(){
  const groups={};cart.forEach((l,i)=>{const p=prodById(l.pid);if(!p)return;(groups[p.shop_id]=groups[p.shop_id]||[]).push({p,qty:l.qty,taille:l.taille,i});});
  const ids=Object.keys(groups).filter(id=>shopById(id));
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Mon panier</h1></div>';
  if(!ids.length)return h+'<div class="card stack" style="text-align:center;padding:28px"><h2 style="font-size:18px">Votre panier est vide</h2><p class="muted" style="margin:0">Ajoutez des produits depuis une boutique, puis commandez sur WhatsApp.</p><a class="btn btn-v" href="#accueil">Voir les boutiques</a></div></div>';
  h+='<form class="card stack" data-f="client" style="gap:10px"><b class="row" style="gap:6px">'+ic('truck',18,'#5B21B6')+'Vos informations de livraison</b><p class="small muted" style="margin:0">Facultatif, mais le vendeur vous livre plus vite. Gardées sur ce téléphone seulement.</p><div class="grid2"><label class="lbl">Nom<input class="in" name="nom" data-client="nom" maxlength="80" value="'+esc(client.nom)+'" autocomplete="name"></label><label class="lbl">Téléphone<input class="in" name="tel" data-client="tel" type="tel" maxlength="30" value="'+esc(client.tel)+'" autocomplete="tel"></label></div><label class="lbl">Ville, quartier, repère<input class="in" name="adresse" data-client="adresse" maxlength="200" value="'+esc(client.adresse)+'" placeholder="Ex. : Bouaké, Air France 2, près de la pharmacie"></label></form>';
  if(ids.length>1)h+='<div class="note">Vous avez des articles de '+ids.length+' boutiques : une commande est envoyée à chaque vendeur.</div>';
  ids.forEach(id=>{const s=shopById(id),lines=groups[id],tot=lines.reduce((a,l)=>a+prix(l.p)*l.qty,0),o=oid('c-'+id),txt=orderText(s,lines,o);
    h+='<section class="stack"><div class="row between"><a href="#boutique-'+esc(s.slug)+'" class="row" style="text-decoration:none;color:var(--ink);font-weight:700">'+avatar(s,36)+esc(s.nom)+verifBadge(s)+'</a><span class="muted small">'+esc(place(s))+'</span></div>'+(trust(s).nouveau?'<div class="warn small"><b>⚠ Boutique nouvelle, pas encore vérifiée.</b> Payez seulement à la livraison.</div>':'')+
    lines.map(l=>'<div class="line"><div style="width:64px;flex-shrink:0">'+tile(l.p,64,30)+'</div><div class="grow"><div class="ell" style="font-weight:600">'+esc(l.p.nom)+'</div>'+(l.taille?'<div class="small muted">Taille '+esc(l.taille)+'</div>':'')+'<div class="price num">'+F(prix(l.p)*l.qty)+'</div></div><div class="stepper"><button type="button" data-a="qty" data-i="'+l.i+'" data-d="-1" aria-label="Retirer un">−</button><span>'+l.qty+'</span><button type="button" data-a="qty" data-i="'+l.i+'" data-d="1" aria-label="Ajouter un">+</button></div></div>').join('')+
    '<div class="card stack" style="gap:8px"><div class="row between"><span class="muted">Livraison</span><span style="font-weight:600;text-align:right">À voir avec le vendeur</span></div><div class="row between"><b>Total</b><span class="price num" style="font-size:22px">'+fmtN(tot)+' FCFA</span></div></div>'+
    '<div class="small muted" style="font-weight:700;letter-spacing:.4px">MESSAGE ENVOYÉ AU VENDEUR</div><div class="msg" data-msg="'+s.id+'">'+esc(txt)+'</div>'+
    '<a class="btn btn-g btn-block" style="min-height:56px" target="_blank" rel="noopener" data-a="order" data-shop="'+s.id+'" data-oid="'+o+'" href="https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(txt)+'">'+ic('wa',22,'#fff')+'Commander sur WhatsApp</a>'+
    (s.telegram?'<a class="btn btn-t btn-block" target="_blank" rel="noopener" data-a="orderTg" data-shop="'+s.id+'" data-oid="'+o+'" data-text="'+esc(txt)+'" href="https://t.me/'+esc(s.telegram.replace(/^@/,''))+'">'+ic('tg',20,'#1E4FA8')+'Commander sur Telegram</a><p class="small muted" style="margin:0">Sur Telegram, le message est copié : collez-le dans la discussion.</p>':'')+'</section>';});
  return h+tipsHTML()+mesCommandes()+'</div>';
}
function mesCommandes(){if(!myOrders.length)return '';
  return '<section class="card stack"><div class="row between"><h2 style="font-size:16px">Mes commandes récentes</h2><a class="small" href="#commandes" style="font-weight:700">Tout voir</a></div>'+myOrders.slice(0,5).map(o=>'<a class="row between line" style="text-decoration:none;color:inherit" href="#suivi-'+esc(o.id)+'"><span style="min-width:0"><b class="ell" style="display:block">'+esc(o.boutique)+'</b><span class="small muted">'+esc(String(o.date).slice(0,10))+' · n° '+esc(String(o.id).slice(0,8).toUpperCase())+'</span></span><span class="row" style="gap:6px"><b class="num">'+F(o.total)+'</b>'+ic('truck',18,'#5B21B6')+'</span></a>').join('')+'</section>';}
function vFavoris(){const ok=new Set(S.shops.filter(s=>s.statut==='actif').map(s=>s.id));const ps=favs.map(prodById).filter(p=>p&&p.visible&&ok.has(p.shop_id));
  return '<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Mes favoris</h1></div>'+(ps.length?'<div class="pgrid">'+ps.map(pCard).join('')+'</div>':'<div class="card stack" style="text-align:center;padding:28px"><h2 style="font-size:18px">Aucun favori</h2><p class="muted" style="margin:0">Touchez le cœur sur un produit pour le garder ici.</p><a class="btn btn-v" href="#accueil">Voir les produits</a></div>')+mesCommandes()+'</div>';}
const LIV=[['envoyee','Commande envoyée'],['confirmee','Confirmée par le vendeur'],['preparation','En préparation'],['en_route','En route'],['livree','Livrée']];
const LIVLAB={attente:'Confirmée',preparation:'En préparation',en_route:'En route',livree:'Livrée',echec:'Non récupérée'};
function stepOf(d){return d.statut==='annulee'||d.livraison==='echec'?-1:d.statut==='envoyee'?0:{attente:1,preparation:2,en_route:3,livree:4}[d.livraison]||1;}
function hhmm(t){if(!t)return '';const d=new Date(t),n=new Date();const h=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return d.toDateString()===n.toDateString()?'Aujourd\'hui, '+h:d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+', '+h;}
function vSuivi(id){
  const d=ui.suivi[id];
  if(d===undefined){ui.suivi[id]=null;sb.rpc('suivi_commande',{oid:id}).then(r=>{ui.suivi[id]=(r.data&&r.data[0])||false;render(true);},()=>{ui.suivi[id]=false;render(true);});}
  let h='<div class="wrap"><div class="row">'+back('#commandes')+'<h1 style="font-size:20px">Commande n° '+esc(String(id).slice(0,8).toUpperCase())+'</h1></div>';
  if(!d)return h+'<div class="card">'+(d===false?'<h2 style="font-size:17px">Commande introuvable</h2><p class="muted" style="margin:0">Vérifiez le lien reçu.</p>':'<p class="muted" style="margin:0">Chargement…</p>')+'</div></div>';
  const step=stepOf(d),hi=d.hist||{},mine=myOrders.find(o=>o.id===id),sh=S.shops.find(x=>x.slug===d.slug);
  const when=[d.created_at,hi.confirmee,hi.preparation,hi.en_route,hi.livree];
  const title=d.statut==='annulee'?'Commande annulée':d.livraison==='echec'?'Non récupérée':LIV[step][1];
  h+='<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:120px;height:120px"></span><p style="margin:0">'+esc(d.boutique)+' · '+F(d.total)+'</p><h2 style="color:#fff;font-size:26px;margin:4px 0">'+(step===3?'🛵 ':step===4?'✅ ':'')+title+'</h2>'+(d.eta&&step>0&&step<4?'<p style="margin:0">Arrivée prévue : '+esc(d.eta)+'</p>':'')+(d.livree_code?'<p style="margin:0">Livraison confirmée par votre code ✔</p>':'')+'</section>';
  if(step>=0)h+='<div class="card"><ol class="steps">'+LIV.map((x,i)=>'<li class="'+(i<step||(i===4&&step===4)?'done':i===step?'now':'')+'"><span>'+(i<step||(i===4&&step===4)?'✓':i+1)+'</span><div><div>'+x[1]+'</div>'+(i<=step&&when[i]?'<small>'+hhmm(when[i])+(i===3&&d.livreur_nom?' · Livreur : '+esc(d.livreur_nom)+(d.livreur_tel?' · '+esc(d.livreur_tel):''):'')+'</small>':i===4&&step<4&&d.a_code?'<small>Donnez le code au livreur</small>':'')+'</div></li>').join('')+'</ol></div>';
  if(mine&&mine.code&&d.a_code&&!d.livree_code&&step>=0)h+='<div class="card stack codecard"><b class="row" style="gap:6px;justify-content:center">🔒 Votre code de livraison</b><div class="code">'+mine.code.split('').map(c=>'<i>'+c+'</i>').join('')+'</div><p class="small muted" style="margin:0">Donnez ce code au livreur <b>seulement quand vous avez l\'article en main</b>. Ne le donnez jamais avant.</p></div>';
  if(step>=0&&step<4&&d.statut!=='annulee')h+=alertCard('Être prévenu à chaque étape');
  h+=installCard('Suivez vos commandes en un geste, même sans chercher le lien.');
  h+='<div class="card stack" style="gap:6px">'+(d.items||[]).map(it=>'<div class="row between small"><span>'+it.qty+' × '+esc(it.nom)+(it.taille?' ('+esc(it.taille)+')':'')+'</span><span class="num">'+F(it.prix*it.qty)+'</span></div>').join('')+'<div class="row between"><b>Total</b><b class="price num">'+F(d.total)+'</b></div></div>';
  h+='<div class="grid2">'+(d.livreur_tel&&step===3?'<a class="btn btn-g" href="tel:'+esc(d.livreur_tel.replace(/\s/g,''))+'">📞 Appeler le livreur</a>':'<a class="btn btn-g" target="_blank" rel="noopener" href="https://wa.me/'+waNum(d.whatsapp)+'?text='+encodeURIComponent('Bonjour, où en est ma commande n° '+String(id).slice(0,8).toUpperCase()+' ?')+'">'+ic('wa',20,'#fff')+'Écrire au vendeur</a>')+
    (sh?'<button type="button" class="btn btn-r" data-a="report" data-id="'+sh.id+'" data-motif="Produit non reçu" data-oid="'+esc(id)+'">⚠ Un problème</button>':'')+'</div>';
  return h+'<a class="btn btn-w btn-block" href="#boutique-'+esc(d.slug)+'">Revoir la boutique</a></div>';
}
function vMesCommandes(){
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Mes commandes</h1></div>'+
  '<form class="card stack" data-f="trackNum" style="gap:8px"><b>Suivre une commande</b><div class="grid2"><input class="in" name="num" maxlength="8" required placeholder="N° (8 caractères)" aria-label="Numéro de commande"><input class="in" name="tel" type="tel" required placeholder="Votre téléphone" value="'+esc(client.tel||'')+'" aria-label="Votre téléphone"></div><button class="btn btn-v btn-s" type="submit">Suivre</button></form>';
  if(myOrders.length)h+=alertCard('Être prévenu quand mes commandes avancent');
  if(!S.user)h+='<a class="small" href="#compte" style="font-weight:700">🔐 Créez un compte pour retrouver vos commandes sur un autre téléphone ›</a>';
  if(!myOrders.length)return h+'<div class="card stack" style="text-align:center;padding:28px"><h2 style="font-size:18px">Aucune commande sur ce téléphone</h2><p class="muted" style="margin:0">Vos commandes apparaissent ici après avoir commandé sur WhatsApp ou Telegram.</p><a class="btn btn-v" href="#accueil">Voir les boutiques</a></div></div>';
  if(ui.mes===null){ui.mes={};sb.rpc('suivi_commandes',{ids:myOrders.map(o=>o.id)}).then(r=>{(r.data||[]).forEach(x=>ui.mes[x.id]=x);ui.mesOk=true;render(true);},()=>{ui.mesOk=true;render(true);});}
  const chip={0:['⏳ Envoyée','b-orange'],1:['✔ Confirmée','b-violet'],2:['📦 En préparation','b-violet'],3:['🛵 En route','b-blue'],4:['✔ Livrée','b-green'],'-1':['✖ Annulée','b-grey']};
  return h+myOrders.map(o=>{const d=ui.mes[o.id],st=d?stepOf(d):null,c=d?chip[st]:null,pc=st===null?0:st<0?100:[15,35,55,78,100][st];
    return '<a class="card stack mescard" href="#suivi-'+esc(o.id)+'"><div class="row between"><span style="min-width:0"><b class="ell" style="display:block">'+esc(o.boutique)+'</b><span class="small muted">n° '+esc(String(o.id).slice(0,8).toUpperCase())+' · '+esc(String(o.date).slice(0,10))+'</span></span>'+(c?'<span class="badge '+c[1]+'">'+(d.livraison==='echec'?'Non récupérée':c[0])+'</span>':'<span class="small muted">'+(ui.mesOk?'—':'…')+'</span>')+'</div><div class="bar"><i style="width:'+pc+'%;'+(st===4?'background:var(--green)':st<0?'background:#C9C2D9':'')+'"></i></div><div class="row between small"><span class="muted">'+(d?(st===0?'En attente de réponse du vendeur':st===4?'Livrée '+(d.livree_code?'et confirmée par code':''):d.eta&&st>0?'Arrivée prévue : '+esc(d.eta):'Mis à jour '+ago((d.hist&&Object.values(d.hist).sort().pop())||d.created_at)):'')+'</span><b class="num">'+F(o.total)+'</b></div></a>';}).join('')+'</div>';
}
function vVerifier(){
  const r=ui.verif;
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Vérifier un numéro</h1></div>'+
  '<form class="card stack" data-f="verifier" style="gap:8px"><span class="small muted">Quelqu\'un vous demande de payer ? Vérifiez son numéro avant.</span><div class="row" style="gap:8px"><input class="in" name="tel" type="tel" required placeholder="07 XX XX XX XX" value="'+esc(r?r.tel:'')+'" style="flex:1" aria-label="Numéro à vérifier"><button class="btn btn-v btn-s" type="submit">Vérifier</button></div></form>';
  if(r){const x=r.res;
    if(!x)h+='<div class="card muted">Vérification impossible pour le moment. Réessayez.</div>';
    else if(x.bloque)h+='<div class="danger"><b style="font-size:15px">⛔ Numéro bloqué</b><br>Ce numéro a été bloqué sur '+esc(S.settings.nom||'Gbairai Market')+(x.signalements?' après <b>'+x.signalements+' signalement'+(x.signalements>1?'s':'')+'</b>':'')+'. Ne lui envoyez pas d\'argent.</div>';
    else if(x.signalements)h+='<div class="danger"><b style="font-size:15px">⚠ Numéro signalé</b><br>Ce numéro a été signalé <b>'+x.signalements+' fois</b>. Soyez très prudent : payez seulement à la livraison.</div>';
    else h+='<div class="good"><b style="font-size:15px">✔ Aucun signalement</b><br>Ce numéro n\'est pas signalé chez nous. Restez prudent quand même.</div>';
    if(x&&x.boutique){const sh=S.shops.find(z=>z.slug===x.slug);h+='<a class="card row" href="#boutique-'+esc(x.slug)+'" style="text-decoration:none;color:inherit">'+(sh?avatar(sh,44):'')+'<span style="min-width:0"><b>'+esc(x.boutique)+(x.verifie?' '+VERIF:'')+'</b><br><span class="small muted">Boutique sur '+esc(S.settings.nom||'Gbairai Market')+' depuis '+moisTxt((Date.now()-new Date(x.depuis))/864e5)+(sh?' · confiance '+trust(sh).sc+'/100':'')+'</span></span></a>';
      if(sh&&trust(sh).nouveau)h+='<div class="warn small"><b>⚠ Boutique nouvelle, pas encore vérifiée.</b> Payez seulement à la livraison.</div>';}
    else if(x&&!x.bloque)h+='<div class="note small">Ce numéro n\'a pas de boutique chez nous.</div>';
  }
  return h+'<div class="good small"><b>✔ Avant chaque paiement Mobile Money</b>, vérifiez que le nom affiché par Orange, MTN, Moov ou Wave correspond bien au vendeur.</div>'+tipsHTML()+'<p class="small muted" style="margin:0">Victime d\'une arnaque ? Ouvrez la page de la boutique et touchez « Signaler », ou écrivez au support.</p></div>';
}

/* ---------- AUTH ---------- */
function authForms(title,intro,allowCreate){
  const cats=CATS().map(c=>'<option value="'+esc(c.id)+'">'+esc(c.nom)+'</option>').join('');
  const creer=allowCreate&&ui.authMode==='creer';
  return '<div class="wrap">'+logoHTML()+'<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:120px;height:120px"></span><h1>'+title+'</h1><p>'+intro+'</p></section>'+
  (allowCreate?'<div class="tabs"><button type="button" class="tab'+(creer?' on':'')+'" data-a="authMode" data-id="creer">Créer ma boutique</button><button type="button" class="tab'+(!creer?' on':'')+'" data-a="authMode" data-id="connexion">Me connecter</button></div>':'')+
  (creer?'<form class="card stack" data-f="signup"><label class="lbl">Nom de la boutique<input class="in" id="c-nom" name="nom" required maxlength="60" placeholder="Ex. : Awa Mode"></label>'+
  '<label class="lbl">Numéro WhatsApp<input class="in" id="c-wa" name="phone" type="tel" required placeholder="07 XX XX XX XX"></label>'+
  '<label class="lbl">Mot de passe (6 caractères minimum)<input class="in" id="c-pw" name="password" type="password" required minlength="6" autocomplete="new-password"></label>'+
  locFields('c')+'<label class="lbl">Catégorie<select class="in" id="c-c" name="categorie">'+cats+'</select></label>'+
  '<button class="btn btn-v btn-block" type="submit">Créer ma boutique</button><p class="small muted" style="margin:0">Gratuit jusqu\'à '+S.settings.limite_gratuit+' produits.</p></form>'
  :'<form class="card stack" data-f="login"><label class="lbl">Numéro WhatsApp<input class="in" id="l-wa" name="phone" type="tel" required placeholder="07 XX XX XX XX" autocomplete="username"></label><label class="lbl">Mot de passe<input class="in" id="l-pw" name="password" type="password" required autocomplete="current-password"></label><button class="btn btn-v btn-block" type="submit">Me connecter</button><button type="button" class="linkbtn" data-a="pwdHelp">'+ic('key',14)+'Mot de passe oublié ?</button>'+
  (ui.pwdHelp?'<div class="note stack" style="gap:8px"><span>Écrivez au support '+esc(S.settings.nom||'Gbairai Market')+' depuis votre numéro WhatsApp. Après vérification, vous recevez un nouveau mot de passe.</span>'+(S.settings.support_whatsapp?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(S.settings.support_whatsapp)+'?text='+encodeURIComponent('Bonjour, j\'ai oublié le mot de passe de ma boutique sur '+(S.settings.nom||'Gbairai Market')+'. Mon numéro : ')+'">'+ic('wa',16,'#fff')+'Écrire au support</a>':'<span class="small muted">Le numéro du support sera bientôt affiché ici.</span>')+'</div>':'')+'</form>')+'</div>';
}

/* ---------- VENDEUR ---------- */
function vVendeur(){
  if(!S.user)return authForms('Votre boutique en ligne, gratuite','Un lien à partager sur vos statuts WhatsApp, TikTok et Facebook.',true);
  const s=myShop();
  if(!s)return '<div class="wrap">'+logoHTML()+(isAdmin()?'<div class="note">Vous êtes connecté en administrateur. <a href="#admin">Aller à l\'administration</a></div>':'')+'<form class="card stack" data-f="newshop"><h1 style="font-size:19px">Créer ma boutique</h1><label class="lbl">Nom de la boutique<input class="in" id="n-nom" name="nom" required></label><label class="lbl">Numéro WhatsApp<input class="in" id="n-wa" name="phone" type="tel" required value="'+esc((S.user.user_metadata||{}).phone||'')+'"></label>'+locFields('n')+'<label class="lbl">Catégorie<select class="in" id="n-c" name="categorie">'+CATS().map(c=>'<option value="'+esc(c.id)+'">'+esc(c.nom)+'</option>').join('')+'</select></label><button class="btn btn-v btn-block" type="submit">Créer</button></form><button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button></div>';
  const tabs=[['accueil','Accueil'],['messages','Messages'],['produits','Produits'],['commandes','Commandes'],['clients','Clients'],['stock','Stock'],['caisse','Caisse'],['abonnement','Abonnement'],['reglages','Réglages']];
  const pending=S.orders.filter(o=>o.shop_id===s.id&&o.statut==='envoyee').length;
  const f={messages:vvMessages,accueil:vvAccueil,produits:vvProduits,stock:vvStock,caisse:vvCaisse,commandes:vvCommandes,clients:vvClients,abonnement:vvAbonnement,reglages:vvReglages}[ui.vTab]||vvAccueil;
  return '<div class="wrap"><div class="row between"><div class="row">'+avatar(s,44)+'<div><h1 style="font-size:19px">'+esc(s.nom)+'</h1><div class="small" style="color:'+(s.statut==='actif'?'var(--green)':'#9A3412')+';font-weight:600">'+(s.statut==='actif'?'Boutique en ligne':'Boutique suspendue')+'</div></div></div><a class="btn btn-w btn-s" href="#boutique-'+esc(s.slug)+'">Voir ma page</a></div>'+
  '<div class="tabs" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" class="tab'+(ui.vTab===t[0]?' on':'')+'" data-a="vtab" data-id="'+t[0]+'">'+t[1]+(t[0]==='commandes'&&pending?' <span class="badge b-orange">'+pending+'</span>':'')+(t[0]==='messages'&&unreadV()?' <span class="badge b-orange">'+unreadV()+'</span>':'')+'</button>').join('')+'</div>'+f(s)+'</div>';
}
const unreadV=()=>(S.convs||[]).reduce((a,c)=>a+(c.non_lus_vendeur||0),0);
function vvAccueil(s){
  const prods=shopProducts(s.id),lim=s.formule==='pro'?Infinity:S.settings.limite_gratuit;
  const tx=S.txs.filter(t=>t.shop_id===s.id&&monthOf(t.date)===monthOf(today()));
  const rec=tx.filter(t=>t.type==='recette').reduce((a,t)=>a+t.montant,0),dep=tx.filter(t=>t.type==='depense').reduce((a,t)=>a+t.montant,0);
  const low=prods.filter(p=>p.stock>0&&p.stock<=3).length,out=prods.filter(p=>p.stock<=0).length;
  const myO=S.orders.filter(o=>o.shop_id===s.id),D=ui.per,Op=myO.filter(o=>inPer(o.created_at,D)),cf=Op.filter(o=>o.statut==='confirmee');
  const caP=cf.reduce((a,o)=>a+o.total,0),todayO=myO.filter(o=>dayKey(o.created_at)===dayKey(Date.now()));
  const tk=[];
  if(unreadV())tk.push('💬 '+unreadV()+' message'+(unreadV()>1?'s':'')+' de clients à lire');
  if(S.nbAb)tk.push('🔔 '+S.nbAb+' client'+(S.nbAb>1?'s':'')+' abonné'+(S.nbAb>1?'s':'')+' à votre boutique');
  tk.push('📅 Aujourd\'hui : '+todayO.length+' commande'+(todayO.length>1?'s':'')+' · '+F(todayO.filter(o=>o.statut==='confirmee').reduce((a,o)=>a+o.total,0)));
  myO.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,5).forEach(o=>tk.push((o.statut==='confirmee'?'💰 Vente':o.statut==='annulee'?'✖️ Annulée':'🛒 Nouvelle commande')+' · '+F(o.total)+' · '+ago(o.created_at)));
  prods.filter(p=>p.stock>0&&p.stock<=3).slice(0,4).forEach(p=>tk.push('⚠️ Stock bas : '+esc(p.nom)+' ('+p.stock+')'));
  topProducts(myO,2).forEach(p=>tk.push('🔥 Votre best-seller : '+esc(p.nom)));
  const dash=ticker(tk,true)+'<div class="row between wrapx" style="gap:10px"><h2 style="font-size:17px">Mes statistiques</h2>'+perChips(D)+'</div>'+
  '<div class="kpis">'+kpi(F(caP),'Ventes confirmées','','hero')+kpi(Op.length,'Commandes')+kpi((Op.length?Math.round(cf.length/Op.length*100):0)+' %','Taux de confirmation')+kpi(cf.length?F(caP/cf.length):'0 F','Panier moyen')+kpi(F(prods.reduce((a,p)=>a+p.prix*Math.max(0,p.stock),0)),'Valeur du stock')+kpi(Op.filter(o=>o.statut==='envoyee').length,'À confirmer')+(rating(s.id).n?kpi(rating(s.id).avg.toFixed(1)+' ★','Note clients ('+rating(s.id).n+' avis)'):'')+'</div>'+
  vchart(D||30,myO)+'<div class="gridf">'+rankList('Mes produits les plus commandés',topProducts(Op).map(p=>[esc(p.nom),p.q+' × · '+F(p.v)]),'Partagez votre lien pour recevoir vos premières commandes.')+
  donut('Mes commandes',[['À confirmer',Op.filter(o=>o.statut==='envoyee').length,'#FF7A1A'],['Confirmées',cf.length,'#0E7A5F'],['Annulées',Op.filter(o=>o.statut==='annulee').length,'#C9C2DA']])+'</div>';
  return dash+'<div class="grid3"><div class="stat dark"><b class="num">'+prods.length+(isFinite(lim)?'<small style="font-size:12px;opacity:.8">/'+lim+'</small>':'')+'</b><span>Produits</span></div><div class="stat"><b class="num">'+S.orders.filter(o=>o.shop_id===s.id).length+'</b><span>Commandes</span></div><div class="stat"><b class="num" style="font-size:16px">'+fmtN(rec-dep)+'</b><span>Bénéfice du mois</span></div></div>'+
  (s.verification!=='verifie'?'<div class="warn"><b>'+(s.verification==='refuse'?'Vérification refusée.':'Vérification en attente.')+'</b> '+(s.verification==='refuse'&&s.motif_refus?esc(s.motif_refus)+' ':'')+'Ajoutez votre numéro de CNI dans « Réglages ». Le badge bleu rassure les clients.</div>':'<div class="note">Votre boutique est vérifiée '+VERIF+'</div>')+
  '<div class="card stack"><h2 style="font-size:16px">Mon lien à partager</h2><div class="in ell" style="display:flex;align-items:center;font-size:13px">'+esc(shopUrl(s))+'</div><div class="grid2"><button type="button" class="btn btn-v btn-s" data-a="copy" data-text="'+esc(shopUrl(s))+'">'+ic('link',16,'#fff')+'Copier</button><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(shopShareText(s))+'">'+ic('wa',16,'#fff')+'Partager</a></div><button type="button" class="btn btn-o btn-s btn-block" data-a="shopShare">'+ic('image',16)+'Image de ma boutique pour le statut</button></div>'+
  ((low||out)?'<div class="warn">'+(low?low+' produit(s) en stock bas. ':'')+(out?out+' en rupture.':'')+' <button type="button" class="btn btn-w btn-s" data-a="vtab" data-id="stock" style="margin-left:6px">Voir le stock</button></div>':'')+
  '<div class="card row between"><div><b>Formule '+(s.formule==='pro'?'Pro':'Gratuite')+'</b><div class="small muted">'+(s.formule==='pro'?'Produits illimités'+(s.pro_fin?' · jusqu\'au '+esc(s.pro_fin):''):'Jusqu\'à '+S.settings.limite_gratuit+' produits'+(S.settings.prix_pro?' · Pro : '+esc(S.settings.prix_pro)+' F / mois':''))+'</div></div><button type="button" class="btn '+(s.formule==='pro'?'btn-w':'btn-o')+' btn-s" data-a="vtab" data-id="abonnement">'+(s.formule==='pro'?'Prolonger':'Passer Pro')+'</button></div>'+
  '<button type="button" class="btn btn-v btn-block" data-a="newProd">'+ic('plus',20,'#fff',2.6)+'Ajouter un produit</button>';
}
function vvProduits(s){
  if(ui.edit)return productForm(s);
  const prods=shopProducts(s.id);
  return '<div class="row between"><span class="muted small">'+prods.length+' produits · '+prods.filter(p=>!p.visible).length+' masqués</span><button type="button" class="btn btn-v btn-s" data-a="newProd">'+ic('plus',14,'#fff',3)+'Ajouter</button></div>'+
  (prods.length?prods.map(p=>'<div class="line"><div style="width:60px;flex-shrink:0">'+tile(p,60,28)+'</div><div class="grow"><div class="ell" style="font-weight:600">'+esc(p.nom)+'</div><div class="price num" style="font-size:14px">'+F(p.prix)+'</div><div class="small muted">Stock : '+p.stock+(p.visible?'':' · masqué')+'</div></div><div class="stack" style="gap:6px;align-items:flex-end"><button type="button" class="switch'+(p.visible?' on':'')+'" data-a="vis" data-id="'+p.id+'" aria-label="'+(p.visible?'Masquer':'Afficher')+' le produit" aria-pressed="'+p.visible+'"></button><div class="row" style="gap:6px"><button type="button" class="icon-btn" style="width:36px;height:34px" data-a="share" data-id="'+p.id+'" aria-label="Image pour le statut">'+ic('image',16,'#5B21B6')+'</button><button type="button" class="icon-btn" style="width:36px;height:34px" data-a="editProd" data-id="'+p.id+'" aria-label="Modifier">'+ic('edit',16,'#5B21B6')+'</button></div></div></div>').join(''):'<div class="card muted">Aucun produit. Ajoutez votre premier produit.</div>');
}
function productForm(s){
  const p=ui.edit==='new'?{nom:'',description:'',prix:'',categorie:s.categorie,tailles:'',stock:1,visible:true,photo:null,couleur:ui.newColor}:prodById(ui.edit);
  if(!p){ui.edit=null;return vvProduits(s);}
  const photoPreview=ui.photo!==undefined?(ui.photo?ui.photo.url:null):p.photo;
  if(ui.extras===undefined)ui.extras=(p.photos||[]).map(u=>({url:u}));
  const pf=p.promo_fin?new Date(p.promo_fin):null,pfv=pf?new Date(pf-pf.getTimezoneOffset()*6e4).toISOString().slice(0,16):'';
  const cs=CATS(),cur=(formCache&&formCache.categorie)||(cs.some(c=>c.id===p.categorie)?p.categorie:cs[0].id),curT=formCache?formCache.type:(p.type||'');
  const pick='<div class="stack" style="gap:6px"><span class="small" style="font-weight:700">1. Choisissez le type d\'article</span><div class="rpick">'+cs.map((c,i)=>'<label class="rayon'+(c.id===cur?' on':'')+'"><input type="radio" name="categorie" value="'+esc(c.id)+'"'+(c.id===cur?' checked':'')+'>'+rImg(c,i)+'<b>'+esc(c.nom)+'</b></label>').join('')+'</div></div>'+
    '<label class="lbl">2. Précisez<select class="in" id="f-type" name="type">'+typeOpts(cur,curT)+'</select></label>';
  const del=ui.edit!=='new'?(ui.confirm==='del-'+p.id?'<div class="warn row between wrapx">Supprimer ce produit ? <span class="row"><button type="button" class="btn btn-w btn-s" data-a="cancelConfirm">Non</button><button type="button" class="btn btn-o btn-s" data-a="delProd" data-id="'+p.id+'">Oui, supprimer</button></span></div>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="del-'+p.id+'">'+ic('trash',16)+'Supprimer ce produit</button>'):'';
  return '<form class="card stack" data-f="produit"><div class="row between"><h2 style="font-size:17px">'+(ui.edit==='new'?'Ajouter un produit':'Modifier le produit')+'</h2><button type="button" class="btn btn-w btn-s" data-a="cancelEdit">Annuler</button></div>'+
  '<div class="row" style="gap:10px"><label class="btn btn-w" style="height:92px;width:110px;flex-direction:column;border:2px dashed #A78BFA;background:#F5F0FF;color:#5B21B6;box-shadow:none;font-size:12px">'+ic('camera',26,'#5B21B6',2)+'Photo<input type="file" accept="image/*" data-file="photo" hidden></label><div style="flex:1;max-width:120px">'+tile({photo:photoPreview,categorie:p.categorie,couleur:p.couleur},92,40)+'</div>'+(photoPreview?'<button type="button" class="btn btn-w btn-s" data-a="rmPhoto">Retirer</button>':'')+'</div>'+
  '<div class="stack" style="gap:6px"><span class="small" style="font-weight:700">Autres photos ('+ui.extras.length+'/4)</span><div class="row wrapx" style="gap:8px">'+ui.extras.map((x,i)=>'<span class="thumb"><img src="'+esc(x.url)+'" alt="Photo '+(i+2)+'"><button type="button" data-a="rmExtra" data-i="'+i+'" aria-label="Retirer cette photo">×</button></span>').join('')+(ui.extras.length<4?'<label class="thumb add" aria-label="Ajouter des photos">'+ic('plus',22,'#5B21B6',2.6)+'<input type="file" accept="image/*" multiple data-file="extra" hidden></label>':'')+'</div></div>'+
  pick+'<label class="lbl">Nom du produit<input class="in" id="f-nom" name="nom" required maxlength="80" value="'+esc(p.nom)+'" placeholder="Ex. : Robe wax longue"></label>'+
  '<label class="lbl">Description<textarea class="in" id="f-desc" name="description" rows="4" maxlength="1000" placeholder="Matière, tailles, couleurs, livraison…">'+esc(p.description)+'</textarea></label>'+
  '<div class="grid2"><label class="lbl">Prix (FCFA)<input class="in" id="f-prix" name="prix" inputmode="numeric" required value="'+esc(p.prix)+'" placeholder="15000"></label><label class="lbl">Quantité en stock<input class="in" id="f-stock" name="stock" type="number" min="0" value="'+esc(p.stock)+'"></label></div>'+
  '<details class="promo-box"'+(p.prix_barre?' open':'')+'><summary class="row" style="gap:6px">'+ic('bolt',16,'#FF7A1A',2.4)+'Promo ou vente flash</summary><div class="grid2" style="margin-top:10px"><label class="lbl">Ancien prix (barré)<input class="in" id="f-barre" name="prix_barre" inputmode="numeric" value="'+esc(p.prix_barre||'')+'" placeholder="20000"></label><label class="lbl">Fin de la promo (facultatif)<input class="in" id="f-fin" name="promo_fin" type="datetime-local" value="'+pfv+'"></label></div><p class="small muted" style="margin:6px 0 0">Le « Prix » ci-dessus est le prix promo. Avec une date de fin, un compte à rebours s\'affiche et le prix normal revient tout seul.</p></details>'+
  '<label class="lbl">Tailles (facultatif)<input class="in" id="f-tailles" name="tailles" value="'+esc(p.tailles)+'" placeholder="S, M, L ou 38, 39, 40"></label>'+
  '<label class="row between" style="font-weight:600">Visible dans la boutique<input type="checkbox" id="f-vis" name="visible"'+(p.visible?' checked':'')+' style="width:22px;height:22px"></label>'+
  '<button class="btn btn-v btn-block" type="submit">'+ic('check',20,'#fff',2.6)+(ui.edit==='new'?'Publier le produit':'Enregistrer')+'</button>'+del+'</form>';
}
function vvStock(s){
  const prods=shopProducts(s.id),val=prods.reduce((a,p)=>a+p.prix*Math.max(0,p.stock),0);
  return '<div class="grid3"><div class="stat dark"><b class="num" style="font-size:15px">'+fmtN(val)+' F</b><span>Valeur du stock</span></div><div class="stat"><b class="num">'+prods.filter(p=>p.stock>0&&p.stock<=3).length+'</b><span>Stock bas</span></div><div class="stat"><b class="num">'+prods.filter(p=>p.stock<=0).length+'</b><span>En rupture</span></div></div>'+
  prods.map(p=>{const st=p.stock<=0?'<span class="badge b-grey">Rupture</span>':p.stock<=3?'<span class="badge b-orange">Stock bas</span>':'<span class="badge b-green">En stock</span>';
  return '<div class="line"><div style="width:54px;flex-shrink:0">'+tile(p,54,26)+'</div><div class="grow"><div class="ell" style="font-weight:600">'+esc(p.nom)+'</div>'+(p.tailles?'<div class="small muted ell">Tailles : '+esc(p.tailles)+'</div>':'')+st+'</div><div class="stepper"><button type="button" data-a="stock" data-id="'+p.id+'" data-d="-1" aria-label="Retirer un">−</button><span>'+p.stock+'</span><button type="button" data-a="stock" data-id="'+p.id+'" data-d="1" aria-label="Ajouter un">+</button></div></div>';}).join('')+
  '<div class="note">Quand vous confirmez une vente dans « Commandes », le stock baisse tout seul. À 0, le produit n\'est plus proposé aux clients.</div>';
}
function vvCaisse(s){
  const all=S.txs.filter(t=>t.shop_id===s.id);
  const tx=ui.caissePeriode==='mois'?all.filter(t=>monthOf(t.date)===monthOf(today())):ui.caissePeriode==='jour'?all.filter(t=>t.date===today()):all;
  const rec=tx.filter(t=>t.type==='recette').reduce((a,t)=>a+t.montant,0),dep=tx.filter(t=>t.type==='depense').reduce((a,t)=>a+t.montant,0);
  return '<div class="tabs">'+[['jour','Aujourd\'hui'],['mois','Ce mois'],['tout','Tout']].map(x=>'<button type="button" class="tab'+(ui.caissePeriode===x[0]?' on':'')+'" data-a="periode" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
  '<section class="hero"><span class="ball g" style="right:-24px;top:-24px;width:100px;height:100px"></span><p style="margin:0">Bénéfice</p><div class="num" style="position:relative;font-family:var(--display);font-weight:800;font-size:30px">'+(rec-dep>=0?'+':'−')+fmtN(Math.abs(rec-dep))+' F</div><div class="grid2" style="position:relative;margin-top:12px"><div style="padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.14)"><div class="small" style="color:#E9DDFF">Recettes</div><b class="num" style="font-family:var(--display);color:#A7F3D0">'+F(rec)+'</b></div><div style="padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.14)"><div class="small" style="color:#E9DDFF">Dépenses</div><b class="num" style="font-family:var(--display);color:#FFD4A8">'+F(dep)+'</b></div></div></section>'+
  '<form class="card stack" data-f="tx"><h2 style="font-size:16px">Ajouter un mouvement</h2><div class="grid2"><label class="lbl">Type<select class="in" id="t-type" name="type"><option value="recette">Recette (entrée)</option><option value="depense">Dépense (sortie)</option></select></label><label class="lbl">Montant (FCFA)<input class="in" id="t-mt" name="montant" inputmode="numeric" required placeholder="5000"></label></div><label class="lbl">Libellé<input class="in" id="t-lib" name="libelle" required placeholder="Ex. : achat tissu, transport, vente…"></label><label class="lbl">Date<input class="in" id="t-date" name="date" type="date" value="'+today()+'"></label><button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>'+
  '<div class="small muted" style="font-weight:700;letter-spacing:.4px">MOUVEMENTS</div>'+
  (tx.length?'<div class="card" style="padding:4px 14px">'+tx.map((t,i)=>'<div class="row" style="padding:10px 0;'+(i?'border-top:1px solid #F0EAFB':'')+'"><span style="width:36px;height:36px;flex-shrink:0;border-radius:12px;display:grid;place-items:center;background:'+(t.type==='recette'?'var(--green-soft)':'var(--orange-soft)')+'"><b style="color:'+(t.type==='recette'?'var(--green)':'#9A3412')+'">'+(t.type==='recette'?'+':'−')+'</b></span><span style="flex:1;min-width:0"><span class="ell" style="display:block;font-weight:600;font-size:13px">'+esc(t.libelle)+'</span><span class="small muted">'+esc(t.date)+'</span></span><b class="num" style="color:'+(t.type==='recette'?'var(--green)':'#9A3412')+'">'+(t.type==='recette'?'+':'−')+fmtN(t.montant)+'</b><button type="button" class="icon-btn" style="width:34px;height:34px;box-shadow:none;background:var(--soft)" data-a="delTx" data-id="'+t.id+'" aria-label="Supprimer">'+ic('trash',14,'#5E5276')+'</button></div>').join('')+'</div>':'<div class="card muted">Aucun mouvement sur cette période.</div>');
}
function vvCommandes(s){
  const ords=S.orders.filter(o=>o.shop_id===s.id);
  const lab={envoyee:['Nouvelle','b-orange'],confirmee:['Vendue','b-green'],annulee:['Annulée','b-grey']};
  return '<div class="note">Chaque fois qu\'un client clique sur « Commander », la commande apparaît ici. Confirmez-la quand le client a payé : la recette s\'ajoute à la caisse et le stock baisse.</div>'+
  (ords.length?ords.map(o=>'<div class="card stack" style="gap:8px"><div class="row between"><b>Commande du '+esc(String(o.created_at).slice(0,10))+'</b><span class="badge '+lab[o.statut][1]+'">'+lab[o.statut][0]+'</span></div>'+(o.items||[]).map(it=>'<div class="row between small"><span>'+it.qty+' × '+esc(it.nom)+(it.taille?' ('+esc(it.taille)+')':'')+'</span><span class="num">'+F(it.prix*it.qty)+'</span></div>').join('')+'<div class="row between"><span class="muted small">Via '+(o.canal==='telegram'?'Telegram':'WhatsApp')+' · n° '+esc(String(o.id).slice(0,8).toUpperCase())+'</span><b class="price num">'+fmtN(o.total)+' FCFA</b></div>'+
  (o.client_nom||o.client_tel||o.client_adresse?'<div class="clientbox small">'+ic('user',14,'#5B21B6')+'<span>'+esc([o.client_nom,o.client_tel,o.client_adresse].filter(Boolean).join(' · '))+'</span></div>':'')+
  (o.client_tel?fiabHTML(o.client_tel,s.id):'')+(o.statut==='confirmee'?livBlock(o,s):'')+
  (o.statut==='envoyee'?'<div class="grid2"><button type="button" class="btn btn-g btn-s" data-a="confOrder" data-id="'+o.id+'">Confirmer la vente</button><button type="button" class="btn btn-w btn-s" data-a="cancelOrder" data-id="'+o.id+'">Annuler</button></div>':'')+'</div>').join(''):'<div class="card muted">Pas encore de commande. Partagez votre lien sur vos statuts.</div>');
}
function fiabHTML(tel,shopId){const k=waNum(tel);
  if(ui.fiab[k]===undefined){ui.fiab[k]=null;sb.rpc('fiabilite_client',{tel}).then(r=>{ui.fiab[k]=(r.data&&r.data[0])||false;render(true);},()=>{ui.fiab[k]=false;render(true);});}
  const f=ui.fiab[k];if(!f)return '';
  const bad=f.echecs+f.signalements+(f.bloque?3:0),btn='<button type="button" class="linkbtn" data-a="clientRep" data-tel="'+esc(tel)+'" data-id="'+shopId+'">'+ic('flag',13)+'Signaler ce client</button>';
  if(f.bloque||bad>=2||f.annulees>=3)return '<div class="danger small"><b>⚠ Client à risque</b><br>'+(f.bloque?'Numéro bloqué sur la plateforme. ':'')+[f.echecs?f.echecs+' commande'+(f.echecs>1?'s':'')+' non récupérée'+(f.echecs>1?'s':''):'',f.annulees?f.annulees+' annulée'+(f.annulees>1?'s':''):'',f.signalements?f.signalements+' signalement'+(f.signalements>1?'s':''):''].filter(Boolean).join(' · ')+'.<br>Conseil : demandez une avance pour la livraison.</div>'+btn;
  if(f.recues>=2&&!bad)return '<div class="good small"><b>✔ Client fiable</b> · '+f.recues+' commandes reçues, '+f.annulees+' annulation'+(f.annulees>1?'s':'')+'</div>';
  if(f.recues||f.echecs||f.annulees)return '<div class="note small">Historique du client : '+f.recues+' reçue'+(f.recues>1?'s':'')+' · '+f.echecs+' non récupérée'+(f.echecs>1?'s':'')+' · '+f.annulees+' annulée'+(f.annulees>1?'s':'')+'</div>'+btn;
  return '<div class="note small">Nouveau client : aucune commande avant.</div>';}
function livBlock(o,s){const lv=o.livraison||'attente',n=String(o.id).slice(0,8).toUpperCase();
  const msg='Bonjour '+(o.client_nom||'')+', votre commande n° '+n+' chez '+s.nom+' : '+({attente:'confirmée',preparation:'en préparation',en_route:'en route',livree:'livrée',echec:'non récupérée'}[lv])+'.'+(lv==='en_route'&&o.livreur_nom?'\nLivreur : '+o.livreur_nom+(o.livreur_tel?' ('+o.livreur_tel+')':''):'')+(o.eta&&lv!=='livree'?'\nArrivée prévue : '+o.eta:'')+(lv==='en_route'?'\nDonnez votre code secret au livreur seulement quand vous avez l\'article.':'')+'\nSuivi : '+trackUrl(o.id);
  let h='<div class="stack" style="gap:8px"><span class="small" style="font-weight:700">Livraison</span><div class="seg">'+[['attente','À préparer'],['preparation','Préparation'],['en_route','En route'],['livree','Livrée']].map(x=>'<button type="button" class="'+(lv===x[0]?'on':'')+'" data-a="liv" data-id="'+o.id+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  if(lv==='livree')h+=o.livree_code?'<div class="good small"><b>✔ Livrée et confirmée par le code du client.</b></div>':'<div class="note small">Marquée livrée sans le code du client : elle ne compte pas dans votre indice de confiance.</div>';
  if(lv==='echec')h+='<div class="warn small">Commande marquée « non récupérée ».</div>';
  if(lv!=='livree'&&lv!=='echec'){
    h+='<form class="stack livform" data-f="livreur" data-id="'+o.id+'" style="gap:6px"><div class="grid2"><input class="in" name="livreur_nom" maxlength="60" placeholder="🛵 Nom du livreur" value="'+esc(o.livreur_nom||'')+'" aria-label="Nom du livreur"><input class="in" name="livreur_tel" type="tel" maxlength="30" placeholder="Tél. du livreur" value="'+esc(o.livreur_tel||'')+'" aria-label="Téléphone du livreur"></div><div class="row" style="gap:6px"><input class="in" name="eta" maxlength="60" placeholder="Arrivée prévue (ex. : aujourd\'hui 16h-18h)" value="'+esc(o.eta||'')+'" style="flex:1" aria-label="Arrivée prévue"><button class="btn btn-w btn-s" type="submit">OK</button></div></form>';
    h+='<form class="codebox" data-f="codeLiv" data-id="'+o.id+'"><b class="small">🔒 Confirmer la livraison avec le code du client</b><div class="row" style="gap:6px"><input class="in" name="code" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required placeholder="4 chiffres" style="flex:1;letter-spacing:6px;font-weight:800" aria-label="Code du client"><button class="btn btn-g btn-s" type="submit">Valider</button></div></form>';
    h+='<button type="button" class="linkbtn" data-a="liv" data-id="'+o.id+'" data-v="echec">Client absent : marquer « non récupérée »</button>';}
  if(o.client_tel)h+='<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(o.client_tel)+'?text='+encodeURIComponent(msg)+'">'+ic('wa',16,'#fff')+'Envoyer le suivi au client sur WhatsApp</a>';
  return h+'</div>';}
function showClientRep(tel,shopId){document.getElementById('layer').innerHTML='<div class="modal" data-a="closeModal"><form class="card stack" data-stop="1" data-f="clientRep" data-id="'+shopId+'" data-tel="'+esc(tel)+'"><h2 style="font-size:17px">Signaler ce client</h2><p class="small muted" style="margin:0">Numéro : <b>'+esc(tel)+'</b>. L\'administrateur vérifie puis peut bloquer ce numéro sur toute la plateforme.</p><label class="lbl">Motif<select class="in" name="motif">'+['Commande non récupérée','Faux numéro','Faux paiement / fausse preuve','Insultes ou menaces','Autre'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><label class="lbl">Détails (facultatif)<textarea class="in" name="details" rows="3" maxlength="600"></textarea></label><button class="btn btn-o btn-block" type="submit">Envoyer le signalement</button><button type="button" class="btn btn-w btn-s" data-a="closeModal">Annuler</button></form></div>';}
function vvClients(s){
  const m={};S.orders.filter(o=>o.shop_id===s.id&&(o.client_tel||o.client_nom)).forEach(o=>{const k=o.client_tel?waNum(o.client_tel):'nom:'+o.client_nom.toLowerCase();
    const c=m[k]=m[k]||{nom:'',tel:o.client_tel,adresse:'',n:0,ok:0,total:0,last:o.created_at};c.n++;if(o.client_nom)c.nom=c.nom||o.client_nom;if(o.client_adresse)c.adresse=c.adresse||o.client_adresse;
    if(o.statut==='confirmee'){c.ok++;c.total+=o.total;}if(String(o.created_at)>String(c.last))c.last=o.created_at;});
  const L=Object.values(m).sort((a,b)=>b.total-a.total||b.n-a.n);
  return '<div class="kpis">'+kpi(L.length,'Clients','','hero')+kpi(L.filter(c=>c.ok>1).length,'Clients fidèles (2 achats et +)')+kpi(F(L.reduce((a,c)=>a+c.total,0)),'Total dépensé')+'</div>'+
  '<div class="note">Les clients qui laissent leur nom et leur numéro dans le panier apparaissent ici. Relancez-les sur WhatsApp quand vous avez des nouveautés.</div>'+
  (L.length?L.map(c=>'<div class="card stack" style="gap:6px"><div class="row between"><b>'+esc(c.nom||'Client')+'</b>'+(c.ok>1?'<span class="badge b-orange">Fidèle</span>':'')+'</div><div class="small muted">'+esc([c.tel,c.adresse].filter(Boolean).join(' · '))+'</div><div class="row between small"><span>'+c.n+' commande'+(c.n>1?'s':'')+' · dernière '+ago(c.last)+'</span><b class="num">'+F(c.total)+'</b></div>'+(c.tel?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.tel)+'?text='+encodeURIComponent('Bonjour '+(c.nom||'')+' 👋 Nouveautés chez '+s.nom+' ! Venez voir : '+shopUrl(s))+'">'+ic('wa',16,'#fff')+'Relancer sur WhatsApp</a>':'')+'</div>').join(''):'<div class="card muted">Pas encore de fiche client.</div>');
}
const OPS=[['orange','Orange Money','#FF7900'],['mtn','MTN MoMo','#FFCB05'],['moov','Moov Money','#0066B3'],['wave','Wave','#1DC8F2']];
function vvAbonnement(s){
  const st=S.settings,pm=st.paiement||{},ops=OPS.filter(o=>String(pm[o[0]]||'').trim());
  const PR={pro:[n0(st.prix_pro),'mois','Formule Pro','Produits illimités, badge Pro'],vedette:[n0(st.prix_vedette),'semaine','Mise en vedette','En tête de l\'accueil avec le badge Vedette'],banniere:[n0(st.prix_banniere),'semaine','Bannière publicitaire','Votre bannière sur la page d\'accueil']};
  const t=PR[ui.pay.type]?ui.pay.type:'pro',d=Math.max(1,Math.min(12,ui.pay.duree||1)),op=ops.find(o=>o[0]===ui.pay.op)||ops[0],tot=PR[t][0]*d;
  const mine=S.payments.filter(p=>p.shop_id===s.id);
  const lab={attente:['En attente de validation','b-amber'],valide:['Validé','b-green'],refuse:['Refusé','b-grey']};
  return '<div class="grid3">'+Object.keys(PR).map(k=>'<button type="button" class="offer'+(t===k?' on':'')+'" data-a="payType" data-id="'+k+'"><b>'+PR[k][2]+'</b><span class="num">'+(PR[k][0]?F(PR[k][0])+' / '+PR[k][1]:'Prix à venir')+'</span><small>'+PR[k][3]+'</small></button>').join('')+'</div>'+
  '<div class="card stack small"><div class="row between"><span>Formule actuelle</span><b>'+(s.formule==='pro'?'Pro'+(s.pro_fin?' jusqu\'au '+esc(s.pro_fin):''):'Gratuite')+'</b></div><div class="row between"><span>Vedette</span><b>'+(s.vedette?'Oui'+(s.vedette_fin?' jusqu\'au '+esc(s.vedette_fin):''):'Non')+'</b></div></div>'+
  (!PR[t][0]||!ops.length?'<div class="warn">Le paiement en ligne sera bientôt disponible. L\'administrateur doit encore indiquer '+(!PR[t][0]?'le prix':'les numéros Mobile Money')+'.'+(st.support_whatsapp?' <a target="_blank" rel="noopener" href="https://wa.me/'+waNum(st.support_whatsapp)+'">Contacter le support</a>':'')+'</div>':
  '<form class="card stack" data-f="pay"><h2 style="font-size:17px">Payer : '+PR[t][2]+'</h2><label class="lbl">Durée<select class="in" name="duree" data-a2="payDuree">'+[1,2,3,4,6,12].map(n=>'<option value="'+n+'"'+(n===d?' selected':'')+'>'+n+' '+PR[t][1]+(n>1&&PR[t][1]==='semaine'?'s':'')+'</option>').join('')+'</select></label>'+
  '<div class="stack" style="gap:6px"><span class="small" style="font-weight:700">Moyen de paiement</span><div class="ops">'+ops.map(o=>'<button type="button" class="op'+(o===op?' on':'')+'" data-a="payOp" data-id="'+o[0]+'" style="--c:'+o[2]+'">'+o[1]+'</button>').join('')+'</div></div>'+
  '<div class="paybox"><span>Envoyez</span><b class="num">'+F(tot)+'</b><span>au numéro '+op[1]+'</span><b class="num">'+esc(pm[op[0]])+'</b><button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(pm[op[0]])+'">Copier le numéro</button></div>'+
  '<p class="small muted" style="margin:0">Après l\'envoi, vous recevez un SMS avec une référence (ID de transaction). Notez-la ci-dessous. L\'administrateur vérifie et active votre formule.</p>'+
  '<div class="grid2"><label class="lbl">Numéro qui a payé<input class="in" name="telephone" type="tel" required maxlength="30" value="'+esc(s.whatsapp)+'"></label><label class="lbl">Référence de la transaction<input class="in" name="reference" required maxlength="80" placeholder="Ex. : CI230915.1234.A56789"></label></div>'+
  '<input type="hidden" name="type" value="'+t+'"><input type="hidden" name="operateur" value="'+op[0]+'"><input type="hidden" name="montant" value="'+tot+'"><button class="btn btn-v btn-block" type="submit">'+ic('card',18,'#fff')+'J\'ai payé, envoyer la référence</button></form>')+
  '<section class="card stack"><h2 style="font-size:16px">Mes paiements</h2>'+(mine.length?mine.map(p=>'<div class="row between line"><span><b>'+esc(PR[p.type]?PR[p.type][2]:p.type)+'</b><br><span class="small muted">'+esc(String(p.created_at).slice(0,10))+' · '+p.duree+' '+esc(PR[p.type]?PR[p.type][1]:'')+' · '+esc((OPS.find(o=>o[0]===p.operateur)||[,''])[1])+'</span>'+(p.note_admin?'<br><span class="small">'+esc(p.note_admin)+'</span>':'')+'</span><span class="stack" style="gap:4px;align-items:flex-end"><b class="num">'+F(p.montant)+'</b><span class="badge '+lab[p.statut][1]+'">'+lab[p.statut][0]+'</span></span></div>').join(''):'<p class="muted" style="margin:0">Aucun paiement pour l\'instant.</p>')+'</section>';
}
function shopFields(s,admin){
  const co=CATS().map(x=>'<option value="'+esc(x.id)+'"'+(x.id===s.categorie?' selected':'')+'>'+esc(x.nom)+'</option>').join('');
  const inp=(k,l,ph,t)=>'<label class="lbl">'+l+'<input class="in" id="s-'+k+'" name="'+k+'" '+(t?'type="'+t+'" ':'')+'value="'+esc(s[k])+'" placeholder="'+esc(ph||'')+'"></label>';
  return '<h3 style="font-size:15px">Boutique</h3>'+inp('nom','Nom de la boutique')+(admin?inp('slug','Lien (après #boutique-)'):'')+'<div class="grid2">'+inp('gerant','Nom du gérant')+'<label class="lbl">Catégorie<select class="in" id="s-categorie" name="categorie">'+co+'</select></label></div>'+
  '<label class="lbl">Description de la boutique<textarea class="in" id="s-description" name="description" rows="3">'+esc(s.description)+'</textarea></label>'+
  '<h3 style="font-size:15px">Contacts</h3><div class="grid2">'+inp('whatsapp','WhatsApp (commandes)','07 XX XX XX XX','tel')+inp('telegram','Telegram','@nom')+inp('telephone','Téléphone d\'appel','','tel')+inp('email','E-mail','facultatif','email')+inp('facebook','Facebook','lien de la page')+inp('tiktok','TikTok','@compte')+'</div>'+
  '<h3 style="font-size:15px">Localisation et livraison</h3>'+locFields('s',s)+''+inp('adresse','Adresse ou point de repère')+'<div class="grid2">'+inp('livraison_zones','Zones de livraison')+inp('livraison_frais','Frais de livraison (F)')+'</div>'+('paiement_livraison' in s?'<label class="lbl">Paiement à la livraison<select class="in" name="paiement_livraison"><option value="oui"'+(s.paiement_livraison!==false?' selected':'')+'>Oui, j\'accepte (recommandé, inspire confiance)</option><option value="non"'+(s.paiement_livraison===false?' selected':'')+'>Non, je demande le paiement avant</option></select></label>':'');
}
function vvReglages(s){
  const pv=S.priv[s.id]||{};
  return '<section class="card row" style="gap:14px">'+avatar(s,72)+'<div class="stack" style="gap:8px;min-width:0"><b>Logo de la boutique</b><span class="small muted">Carré de préférence. Il s\'affiche sur l\'accueil et sur votre page.</span><div class="row" style="gap:8px"><label class="btn btn-v btn-s">'+(s.logo?'Changer':'Ajouter mon logo')+'<input type="file" accept="image/*" data-file="logo" hidden></label>'+(s.logo?'<button type="button" class="btn btn-w btn-s" data-a="rmLogo">Retirer</button>':'')+'</div></div></section>'+
  '<form class="card stack" data-f="shop" data-id="'+s.id+'">'+shopFields(s,false)+'<h3 style="font-size:15px">Vérification</h3><label class="lbl">Numéro de la pièce d\'identité (CNI)<input class="in" id="s-cni" name="cni" value="'+esc(pv.cni)+'" placeholder="C00XXXXXXX"></label><p class="small muted" style="margin:0">Visible seulement par vous et l\'administrateur.</p><button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>'+
  '<form class="card stack" data-f="pwd"><h3 class="row" style="font-size:15px;gap:6px">'+ic('key',16,'#5B21B6')+'Changer mon mot de passe</h3><label class="lbl">Nouveau mot de passe<input class="in" name="password" type="password" required minlength="6" autocomplete="new-password"></label><label class="lbl">Répéter le mot de passe<input class="in" name="password2" type="password" required minlength="6" autocomplete="new-password"></label><button class="btn btn-w btn-block" type="submit">Changer le mot de passe</button></form>'+
  '<button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button>';
}

/* ---------- ADMIN ---------- */
function vAdmin(){
  if(!S.user)return authForms('Espace administrateur','Connectez-vous avec votre compte administrateur.',false);
  if(!isAdmin())return '<div class="wrap">'+logoHTML()+'<div class="card stack"><h1 style="font-size:19px">Accès réservé</h1><p class="muted" style="margin:0">Ce compte n\'est pas administrateur.</p><button type="button" class="btn btn-w" data-a="logout">Se déconnecter</button></div></div>';
  const tabs=[['tableau','Tableau de bord'],['vendeurs','Vendeurs'],['paiements','Paiements'],['bannieres','Bannières'],['moderation','Avis et signalements'],['litiges','Litiges'+((S.litiges||[]).length?' ('+S.litiges.length+')':'')],['produits','Produits'],['commandes','Commandes'],['catalogue','Catégories et quartiers'],['parametres','Paramètres']];
  const wait=S.shops.filter(s=>s.verification==='attente').length,payW=S.payments.filter(p=>p.statut==='attente').length,repW=S.reports.filter(r=>r.statut==='nouveau').length;
  const h='<div class="wrap wide"><div class="row between wrapx">'+logoHTML()+'<div class="row"><span class="badge b-violet">Administrateur</span><button type="button" class="btn btn-w btn-s" data-a="logout">Se déconnecter</button></div></div><div class="tabs">'+tabs.map(t=>'<button type="button" class="tab'+(ui.aTab===t[0]?' on':'')+'" data-a="atab" data-id="'+t[0]+'">'+t[1]+(t[0]==='vendeurs'&&wait?' <span class="badge b-orange">'+wait+'</span>':'')+(t[0]==='paiements'&&payW?' <span class="badge b-orange">'+payW+'</span>':'')+(t[0]==='moderation'&&repW?' <span class="badge b-orange">'+repW+'</span>':'')+'</button>').join('')+'</div>';
  if(ui.aTab==='vendeurs'&&ui.adminShop)return h+aFiche(shopById(ui.adminShop))+'</div>';
  return h+({tableau:aTableau,vendeurs:aVendeurs,paiements:aPaiements,bannieres:aBannieres,moderation:aModeration,litiges:aLitiges,produits:aProduits,commandes:aCommandes,catalogue:aCatalogue,parametres:aParams}[ui.aTab]||aTableau)()+'</div>';
}
function aTableau(){
  const L=S.shops,D=ui.per,O=S.orders,Op=O.filter(o=>inPer(o.created_at,D));
  const prevO=D?O.filter(o=>{const t=Date.now()-new Date(o.created_at);return t>=D*DAY&&t<2*D*DAY;}):[];
  const sum=a=>a.filter(o=>o.statut==='confirmee').reduce((x,o)=>x+o.total,0);
  const ca=sum(Op),conf=Op.filter(o=>o.statut==='confirmee').length,rate=Op.length?Math.round(conf/Op.length*100):0;
  const newShops=L.filter(s=>inPer(s.created_at,D)).length,prevShops=D?L.filter(s=>{const t=Date.now()-new Date(s.created_at);return t>=D*DAY&&t<2*D*DAY;}).length:0;
  const out=S.products.filter(p=>p.stock<=0).length,stockV=S.products.reduce((a,p)=>a+p.prix*Math.max(0,p.stock),0);
  const sName=id=>{const s=shopById(id);return s?s.nom:'Boutique';};
  const tk=[];
  O.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,6).forEach(o=>tk.push((o.statut==='confirmee'?'💰':o.statut==='annulee'?'✖️':'🛒')+' <b>'+esc(sName(o.shop_id))+'</b> · '+F(o.total)+' · '+ago(o.created_at)));
  L.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,3).forEach(s=>tk.push('🏪 Nouvelle boutique : <b>'+esc(s.nom)+'</b> ('+esc(place(s))+') · '+ago(s.created_at)));
  const wait=L.filter(s=>s.verification==='attente');if(wait.length)tk.push('🪪 '+wait.length+' vérification'+(wait.length>1?'s':'')+' en attente');
  if(out)tk.push('📦 '+out+' produit'+(out>1?'s':'')+' en rupture');
  const pw=S.payments.filter(p=>p.statut==='attente');if(pw.length)tk.push('💳 '+pw.length+' paiement'+(pw.length>1?'s':'')+' à valider');
  const rw=S.reports.filter(r=>r.statut==='nouveau');if(rw.length)tk.push('🚩 '+rw.length+' signalement'+(rw.length>1?'s':'')+' à traiter');
  const rev=S.payments.filter(p=>p.statut==='valide'&&inPer(p.created_at,D)).reduce((a,p)=>a+p.montant,0);
  topProducts(O,3).forEach(p=>tk.push('🔥 Top : '+esc(p.nom)+' ('+p.q+' vendus)'));
  const byShop=L.map(s=>[s,sum(Op.filter(o=>o.shop_id===s.id)),Op.filter(o=>o.shop_id===s.id).length]).filter(x=>x[2]).sort((a,b)=>b[1]-a[1]||b[2]-a[2]).slice(0,5);
  const byQ=Object.entries(L.reduce((m,s)=>{const v=villeOf(s);m[v]=(m[v]||0)+1;return m;},{})).sort((a,b)=>b[1]-a[1]).slice(0,10),mx=Math.max(1,...byQ.map(x=>x[1]));
  const byC=CATS().map(c=>[c.nom,S.products.filter(p=>p.categorie===c.id).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]),mc=Math.max(1,...byC.map(x=>x[1]));
  const bars=(arr,m)=>arr.length?arr.map(x=>'<div class="row small"><span class="ell" style="width:110px">'+esc(x[0])+'</span><span class="bar"><span style="width:'+(x[1]/m*100)+'%"></span></span><b class="num" style="width:28px;text-align:right">'+x[1]+'</b></div>').join(''):'<p class="muted" style="margin:0">Pas encore de données.</p>';
  return ticker(tk,true)+
  '<div class="row between wrapx" style="gap:10px"><h2 style="font-size:19px">Vue d\'ensemble</h2>'+perChips(D)+'</div>'+
  '<div class="kpis">'+kpi(F(ca),'Chiffre d\'affaires confirmé',D?trend(ca,sum(prevO)):'','hero')+kpi(Op.length,'Commandes reçues',D?trend(Op.length,prevO.length):'')+kpi(rate+' %','Taux de confirmation')+kpi(conf?F(ca/conf):'0 F','Panier moyen')+
  kpi(L.filter(s=>s.statut==='actif').length,'Vendeurs actifs')+kpi(newShops,'Nouveaux vendeurs',D?trend(newShops,prevShops):'')+kpi(L.filter(s=>s.formule==='pro').length,'Abonnés Pro')+kpi(wait.length,'Vérifications en attente',wait.length?'<em class="down">à traiter</em>':'')+
  kpi(S.products.length,'Produits')+kpi(out,'En rupture')+kpi(F(stockV),'Valeur du stock')+kpi(L.filter(s=>s.statut==='suspendu').length,'Boutiques suspendues')+kpi(F(rev),'Revenus de la plateforme',pw.length?'<em class="down">'+pw.length+' à valider</em>':'')+kpi(S.reviews.length?(S.reviews.reduce((a,r)=>a+r.note,0)/S.reviews.length).toFixed(1)+' ★':'–','Note moyenne ('+S.reviews.length+' avis)')+kpi(rw.length,'Signalements à traiter')+'</div>'+
  vchart(D||30,O)+
  '<div class="gridf">'+donut('Commandes par statut',[['Envoyées',Op.filter(o=>o.statut==='envoyee').length,'#FF7A1A'],['Confirmées',conf,'#0E7A5F'],['Annulées',Op.filter(o=>o.statut==='annulee').length,'#C9C2DA']])+
  donut('Canal de commande',[['WhatsApp',Op.filter(o=>o.canal==='whatsapp').length,'#25A366'],['Telegram',Op.filter(o=>o.canal==='telegram').length,'#3B82F6']])+
  donut('Vendeurs',[['Vérifiés',L.filter(s=>s.verification==='verifie').length,'#3B82F6'],['En attente',wait.length,'#F59E0B'],['Refusés',L.filter(s=>s.verification==='refuse').length,'#C9C2DA']])+
  donut('Formules',[['Gratuit',L.filter(s=>s.formule!=='pro').length,'#8B5CF6'],['Pro',L.filter(s=>s.formule==='pro').length,'#FF7A1A']])+
  rankList('Meilleures boutiques',byShop.map(x=>[avatar(x[0],30)+esc(x[0].nom),F(x[1])+' · '+x[2]+' cmd']))+
  rankList('Produits les plus commandés',topProducts(Op).map(p=>[esc(p.nom),p.q+' × · '+F(p.v)]))+
  '<section class="card stack"><h2 style="font-size:17px">Vendeurs par ville</h2>'+bars(byQ,mx)+'</section><section class="card stack"><h2 style="font-size:17px">Produits par catégorie</h2>'+bars(byC,mc)+'</section>'+
  '<section class="card stack"><h2 style="font-size:17px">À vérifier</h2>'+(wait.map(s=>'<div class="row between"><span class="row">'+avatar(s,34)+esc(s.nom)+'</span><button type="button" class="btn btn-g btn-s" data-a="aOpen" data-id="'+s.id+'">Ouvrir</button></div>').join('')||'<p class="muted" style="margin:0">Rien en attente.</p>')+'</section></div>';
}
const badgeVerif=s=>s.verification==='verifie'?'<span class="badge b-blue">Vérifié</span>':s.verification==='refuse'?'<span class="badge b-grey">Refusé</span>':'<span class="badge b-amber">En attente</span>';
function aVendeurs(){
  const qq=ui.aQ.toLowerCase();
  const list=S.shops.filter(s=>(ui.aFilter==='tous'||(ui.aFilter==='attente'&&s.verification==='attente')||(ui.aFilter==='pro'&&s.formule==='pro')||(ui.aFilter==='suspendu'&&s.statut==='suspendu')||(ui.aFilter==='enligne'&&enLigne(s)))&&(!qq||(s.nom+' '+s.quartier+' '+s.whatsapp).toLowerCase().includes(qq)));
  return '<section class="card stack"><div class="row between wrapx"><h2 style="font-size:17px">Vendeurs ('+list.length+')</h2><div class="row wrapx">'+[['tous','Tous'],['enligne','🟢 En ligne ('+S.shops.filter(enLigne).length+')'],['attente','En attente'],['pro','Pro'],['suspendu','Suspendus']].map(x=>'<button type="button" class="chip'+(ui.aFilter===x[0]?' on':'')+'" data-a="aFilter" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>'+
  '<label class="search" style="margin:0;box-shadow:none;border:1.5px solid #E2D9F8">'+ic('search',18,'#6B5B8C')+'<span hidden>Rechercher un vendeur</span><input id="aq" type="search" placeholder="Nom, quartier, numéro…" value="'+esc(ui.aQ)+'" data-i="aQ"></label>'+
  '<div class="tbl-wrap"><table><thead><tr><th>Boutique</th><th>Quartier</th><th>WhatsApp</th><th>Produits</th><th>Formule</th><th>Vérification</th><th>Statut</th><th><span hidden>Actions</span></th></tr></thead><tbody>'+
  list.map(s=>'<tr><td><span class="row">'+avatar(s,34)+'<span class="stack" style="gap:2px"><b>'+esc(s.nom)+'</b>'+presenceHTML(s,true)+'</span>'+(s.vedette?'<span class="badge b-orange">Vedette</span>':'')+'</span></td><td>'+esc(place(s))+'</td><td class="num">'+esc(s.whatsapp)+'</td><td class="num">'+shopProducts(s.id).length+'</td><td>'+(s.formule==='pro'?'<span class="badge b-orange">Pro</span>':'<span class="badge b-violet">Gratuit</span>')+'</td><td>'+badgeVerif(s)+'</td><td>'+(s.statut==='actif'?'<span class="badge b-green">Actif</span>':'<span class="badge b-grey">Suspendu</span>')+'</td><td style="text-align:right"><button type="button" class="btn btn-w btn-s" data-a="aOpen" data-id="'+s.id+'">Ouvrir la fiche</button></td></tr>').join('')+'</tbody></table></div></section>';
}
function aFiche(s){
  if(!s){ui.adminShop=null;return aVendeurs();}
  const pv=S.priv[s.id]||{};
  const sel=(k,l,opts)=>'<label class="lbl">'+l+'<select class="in" id="s-'+k+'" name="'+k+'">'+opts.map(o=>'<option value="'+o[0]+'"'+(String(s[k])===String(o[0])?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></label>';
  const prods=shopProducts(s.id),ords=S.orders.filter(o=>o.shop_id===s.id);
  const delBtn=ui.confirm==='delShop'?'<span class="row"><span class="small">Supprimer définitivement ?</span><button type="button" class="btn btn-w btn-s" data-a="cancelConfirm">Non</button><button type="button" class="btn btn-o btn-s" data-a="delShop" data-id="'+s.id+'">Oui</button></span>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="delShop">Supprimer</button>';
  return '<div class="hero row between wrapx" style="gap:12px"><div class="row" style="position:relative"><button type="button" class="icon-btn" style="background:rgba(255,255,255,.18)" data-a="aClose" aria-label="Retour à la liste">'+ic('back',20,'#fff')+'</button>'+avatar(s,56)+'<div><h1 style="font-size:22px;max-width:none">'+esc(s.nom)+'</h1><p style="margin:0">Inscrit le '+esc(String(s.created_at).slice(0,10))+' · '+prods.length+' produits · '+ords.length+' commandes</p></div></div><div class="row wrapx" style="position:relative"><button type="button" class="btn btn-g btn-s" data-a="aVerif" data-id="'+s.id+'">Vérifier</button><button type="button" class="btn btn-o btn-s" data-a="aSusp" data-id="'+s.id+'">'+(s.statut==='actif'?'Suspendre':'Réactiver')+'</button>'+delBtn+'</div></div>'+
  '<section class="card row between wrapx" style="gap:10px"><span class="row" style="gap:8px">'+ic('key',18,'#5B21B6')+'<b>Mot de passe oublié par le vendeur ?</b></span>'+(ui.aPwd&&ui.aPwd.shop===s.id?'<span class="row wrapx" style="gap:8px"><span>Nouveau mot de passe : <b class="num" style="font-size:18px">'+esc(ui.aPwd.pw)+'</b></span><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent('Bonjour, votre nouveau mot de passe '+(S.settings.nom||'Gbairai Market')+' est : '+ui.aPwd.pw+'\nConnectez-vous puis changez-le dans Réglages.')+'">'+ic('wa',16,'#fff')+'L\'envoyer au vendeur</a></span>':'<button type="button" class="btn btn-v btn-s" data-a="aReset" data-id="'+s.id+'">Créer un nouveau mot de passe</button>')+'</section>'+
  '<form class="stack" data-f="shop" data-id="'+s.id+'" data-admin="1"><div class="gridf"><section class="card stack">'+shopFields(s,true)+'</section><div class="stack">'+
  '<section class="card stack"><h3 style="font-size:15px">Vérification</h3>'+sel('verification','Statut',[['attente','En attente'],['verifie','Vérifié'],['refuse','Refusé']])+'<label class="lbl">N° pièce d\'identité<input class="in" id="s-cni" name="cni" value="'+esc(pv.cni)+'"></label><label class="lbl">Motif de refus<input class="in" id="s-motif_refus" name="motif_refus" value="'+esc(s.motif_refus)+'" placeholder="si refusé"></label></section>'+
  '<section class="card stack"><h3 style="font-size:15px">Abonnement et visibilité</h3>'+sel('formule','Formule',[['gratuit','Gratuit (jusqu\'à '+S.settings.limite_gratuit+' produits)'],['pro','Pro (illimité)']])+sel('vedette','Mise en vedette',[['false','Non'],['true','Oui, en vedette']])+sel('statut','Statut du compte',[['actif','Actif'],['suspendu','Suspendu']])+'</section>'+
  '<section class="card stack"><h3 style="font-size:15px">Notes internes (admin seulement)</h3><textarea class="in" id="s-notes" name="notes" rows="4" placeholder="Ex. : appelé le vendeur, pièce floue…">'+esc(pv.notes)+'</textarea></section></div></div><button class="btn btn-v btn-block" type="submit">Enregistrer la fiche</button></form>';
}
const PLAB={pro:'Formule Pro',vedette:'Mise en vedette',banniere:'Bannière'};
function aPaiements(){
  const P=S.payments,w=P.filter(p=>p.statut==='attente'),sName=id=>{const s=shopById(id);return s?s.nom:'?';};
  const mois=P.filter(p=>p.statut==='valide'&&monthOf(p.created_at)===monthOf(today())).reduce((a,p)=>a+p.montant,0);
  const row=p=>'<div class="card stack" style="gap:8px"><div class="row between wrapx"><b>'+esc(sName(p.shop_id))+' · '+PLAB[p.type]+' · '+p.duree+(p.type==='pro'?' mois':' sem.')+'</b><b class="price num">'+F(p.montant)+'</b></div><div class="small muted">'+esc((OPS.find(o=>o[0]===p.operateur)||[,''])[1])+' · payé par '+esc(p.telephone)+' · réf. <b style="color:var(--ink)">'+esc(p.reference)+'</b> · '+ago(p.created_at)+'</div>'+
    (p.statut==='attente'?'<p class="small" style="margin:0">Vérifiez sur votre téléphone que vous avez bien reçu ce montant avec cette référence, puis validez.</p><div class="grid2"><button type="button" class="btn btn-g btn-s" data-a="payOk" data-id="'+p.id+'">Valider et activer</button><button type="button" class="btn btn-w btn-s" data-a="payNo" data-id="'+p.id+'">Refuser</button></div>':'<span class="badge '+(p.statut==='valide'?'b-green':'b-grey')+'">'+(p.statut==='valide'?'Validé':'Refusé')+'</span>'+(p.note_admin?' <span class="small muted">'+esc(p.note_admin)+'</span>':''))+'</div>';
  return '<div class="kpis">'+kpi(w.length,'À valider','','hero')+kpi(F(mois),'Encaissé ce mois')+kpi(F(P.filter(p=>p.statut==='valide').reduce((a,p)=>a+p.montant,0)),'Total encaissé')+kpi(S.shops.filter(s=>s.formule==='pro').length,'Abonnés Pro')+'</div>'+
  (!Object.values(S.settings.paiement||{}).some(v=>String(v).trim())?'<div class="warn">Indiquez vos numéros Orange Money, MTN, Moov et Wave dans « Paramètres » pour que les vendeurs puissent payer.</div>':'')+
  '<h2 style="font-size:17px">À valider</h2>'+(w.length?w.map(row).join(''):'<div class="card muted">Aucun paiement en attente.</div>')+
  '<h2 style="font-size:17px">Historique</h2>'+(P.filter(p=>p.statut!=='attente').slice(0,50).map(row).join('')||'<div class="card muted">Rien pour l\'instant.</div>');
}
function aBannieres(){
  const B=S.banners,shops=S.shops.slice().sort((a,b)=>a.nom.localeCompare(b.nom));
  return '<div class="gridf"><form class="card stack" data-f="banner"><h2 style="font-size:17px">Nouvelle bannière</h2>'+
  '<label class="lbl">Titre<input class="in" name="titre" required maxlength="60" placeholder="Ex. : -30 % sur toute la collection"></label><label class="lbl">Sous-titre<input class="in" name="sous_titre" maxlength="90" placeholder="Ex. : Chez Awa Mode, Cocody"></label>'+
  '<label class="lbl">Boutique (facultatif)<select class="in" name="shop_id"><option value="">Aucune</option>'+shops.map(s=>'<option value="'+s.id+'">'+esc(s.nom)+'</option>').join('')+'</select></label><label class="lbl">Lien (facultatif)<input class="in" name="lien" placeholder="#boutique-awa-mode ou https://…"></label>'+
  '<div class="grid2"><label class="lbl">Début<input class="in" name="debut" type="date" value="'+today()+'"></label><label class="lbl">Fin<input class="in" name="fin" type="date"></label></div>'+
  '<div class="row" style="gap:10px"><label class="btn btn-w btn-s">'+ic('image',16)+'Image (facultatif)<input type="file" accept="image/*" data-file="banner" hidden></label>'+(ui.bannerImg?'<img src="'+ui.bannerImg.url+'" alt="" style="height:44px;border-radius:10px">':'<span class="small muted">Sinon, fond de couleur.</span>')+'</div>'+
  '<button class="btn btn-v btn-block" type="submit">Publier la bannière</button></form>'+
  '<section class="card stack"><h2 style="font-size:17px">Bannières ('+B.length+')</h2>'+(B.length?B.map(x=>{const on=x.actif&&String(x.debut||'')<=today()&&(!x.fin||x.fin>=today());return '<div class="line"><div class="bn-mini" style="background:'+(x.image?'url('+esc(x.image)+') center/cover':lin(x.couleur))+'"></div><div class="grow"><b class="ell" style="display:block">'+esc(x.titre)+'</b><span class="small muted">'+esc(x.debut||'')+(x.fin?' → '+esc(x.fin):'')+'</span><br><span class="badge '+(on?'b-green':'b-grey')+'">'+(on?'En ligne':'Hors ligne')+'</span></div><div class="stack" style="gap:6px"><button type="button" class="switch'+(x.actif?' on':'')+'" data-a="bnToggle" data-id="'+x.id+'" aria-label="Activer" aria-pressed="'+x.actif+'"></button><button type="button" class="icon-btn" style="width:36px;height:34px" data-a="bnDel" data-id="'+x.id+'" aria-label="Supprimer">'+ic('trash',16,'#5B21B6')+'</button></div></div>';}).join(''):'<p class="muted" style="margin:0">Aucune bannière.</p>')+'</section></div>';
}
function aModeration(){
  const R=S.reports,sName=id=>{const s=shopById(id);return s?s.nom:'(boutique supprimée)';};
  return '<div class="gridf"><section class="card stack"><h2 style="font-size:17px">Signalements ('+R.filter(r=>r.statut==='nouveau').length+' nouveaux)</h2>'+
  (R.length?R.map(r=>{const s=shopById(r.shop_id);return '<div class="review'+(r.statut==='nouveau'?' new':'')+'"><div class="row between wrapx"><b>'+esc(r.motif)+'</b><span class="small muted">'+ago(r.created_at)+'</span></div><div class="small">Boutique : <b>'+esc(sName(r.shop_id))+'</b>'+(r.contact?' · contact : '+esc(r.contact):'')+'</div>'+(r.details?'<p>'+esc(r.details)+'</p>':'')+
    '<div class="row wrapx" style="gap:6px">'+(s?'<button type="button" class="btn btn-w btn-s" data-a="aOpen" data-id="'+s.id+'">Fiche</button>'+(s.statut==='actif'?'<button type="button" class="btn btn-o btn-s" data-a="aSusp" data-id="'+s.id+'">Suspendre</button>':'')+'<button type="button" class="btn btn-w btn-s" data-a="blShop" data-id="'+s.id+'" data-motif="'+esc(r.motif)+'">Bloquer le numéro</button>':'')+(r.statut==='nouveau'?'<button type="button" class="btn btn-o btn-s" data-a="repOk" data-id="'+r.id+'" title="Le signalement est fondé : il baisse l\'indice de confiance">Fondé</button><button type="button" class="btn btn-g btn-s" data-a="repDone" data-id="'+r.id+'">Traité</button>':r.statut==='confirme'?'<span class="badge b-orange">Fondé</span>':'<span class="badge b-grey">Traité</span>')+'</div></div>';}).join(''):'<p class="muted" style="margin:0">Aucun signalement.</p>')+'</section>'+
  '<section class="card stack"><h2 style="font-size:17px">Clients signalés par les vendeurs ('+S.clientReports.filter(r=>r.statut==='nouveau').length+' nouveaux)</h2>'+
  (S.clientReports.length?S.clientReports.map(r=>'<div class="review'+(r.statut==='nouveau'?' new':'')+'"><div class="row between wrapx"><b>'+esc(r.motif)+'</b><span class="small muted">'+ago(r.created_at)+'</span></div><div class="small">Client : <b class="num">'+esc(r.client_tel)+'</b> · par '+esc(sName(r.shop_id))+'</div>'+(r.details?'<p>'+esc(r.details)+'</p>':'')+
    '<div class="row wrapx" style="gap:6px">'+(r.statut==='nouveau'?'<button type="button" class="btn btn-o btn-s" data-a="crSet" data-v="confirme" data-id="'+r.id+'">Fondé</button><button type="button" class="btn btn-w btn-s" data-a="crSet" data-v="rejete" data-id="'+r.id+'">Rejeter</button>':'<span class="badge '+(r.statut==='confirme'?'b-orange">Fondé':'b-grey">Rejeté')+'</span>')+'<button type="button" class="btn btn-w btn-s" data-a="crBlock" data-id="'+r.id+'">Bloquer le numéro</button></div></div>').join(''):'<p class="muted" style="margin:0">Aucun client signalé.</p>')+'</section>'+
  '<section class="card stack"><h2 style="font-size:17px">Liste noire ('+S.blacklist.length+')</h2><p class="small muted" style="margin:0">Ces numéros ne peuvent plus créer de boutique ni passer de commande.</p>'+
  S.blacklist.map(b=>'<div class="row between"><span><b class="num">'+esc(b.phone)+'</b>'+(b.motif?'<br><span class="small muted">'+esc(b.motif)+'</span>':'')+'</span><button type="button" class="btn btn-w btn-s" data-a="blDel" data-id="'+esc(b.phone)+'">Retirer</button></div>').join('')+
  '<form class="stack" data-f="blacklist" style="gap:8px"><div class="grid2"><label class="lbl">Numéro<input class="in" name="phone" type="tel" required placeholder="07 XX XX XX XX"></label><label class="lbl">Motif<input class="in" name="motif" placeholder="Arnaque…"></label></div><button class="btn btn-v btn-s" type="submit">Ajouter à la liste noire</button></form></section>'+
  '<section class="card stack"><h2 style="font-size:17px">Avis clients ('+S.reviews.length+')</h2>'+(S.reviews.length?S.reviews.slice(0,60).map(r=>'<div class="review'+(r.visible?'':' off')+'"><div class="row between wrapx"><b>'+esc(r.nom)+' → '+esc(sName(r.shop_id))+'</b>'+stars(r.note,13)+'</div>'+(r.commentaire?'<p>'+esc(r.commentaire)+'</p>':'')+'<div class="row" style="gap:6px"><span class="small muted" style="flex:1">'+ago(r.created_at)+(r.visible?'':' · masqué')+'</span><button type="button" class="btn btn-w btn-s" data-a="rvToggle" data-id="'+r.id+'">'+(r.visible?'Masquer':'Afficher')+'</button><button type="button" class="btn btn-w btn-s" data-a="rvDel" data-id="'+r.id+'">Supprimer</button></div></div>').join(''):'<p class="muted" style="margin:0">Aucun avis.</p>')+'</section></div>';
}
function aProduits(){
  if(ui.edit){const ep=ui.edit==='new'?null:prodById(ui.edit),es=ep?shopById(ep.shop_id):myShop();if(es)return productForm(es);ui.edit=null;}
  const mine=myShop();
  return '<section class="card stack"><div class="row between wrapx"><h2 style="font-size:17px">Tous les produits ('+S.products.length+')</h2>'+(mine?'<button type="button" class="btn btn-v btn-s" data-a="newProd">'+ic('plus',14,'#fff',3)+'Ajouter à '+esc(mine.nom)+'</button>':'')+'</div><div class="tbl-wrap"><table><thead><tr><th>Produit</th><th>Boutique</th><th>Prix</th><th>Stock</th><th>Catégorie</th><th>Visible</th><th><span hidden>Actions</span></th></tr></thead><tbody>'+
  S.products.map(p=>{const s=shopById(p.shop_id);return '<tr><td><span class="row"><span style="width:40px;flex-shrink:0">'+tile(p,40,20)+'</span><span><b>'+esc(p.nom)+'</b><br><span class="small muted">'+esc((p.description||'').slice(0,50))+'</span></span></span></td><td>'+esc(s?s.nom:'?')+'</td><td class="num">'+F(p.prix)+'</td><td class="num">'+p.stock+'</td><td>'+esc(catName(p.categorie))+'</td><td><button type="button" class="switch'+(p.visible?' on':'')+'" data-a="vis" data-id="'+p.id+'" aria-label="Visibilité" aria-pressed="'+p.visible+'"></button></td><td><span class="row" style="gap:6px"><button type="button" class="btn btn-w btn-s" data-a="editProd" data-id="'+p.id+'">Modifier</button>'+(ui.confirm==='del-'+p.id?'<button type="button" class="btn btn-o btn-s" data-a="delProd" data-id="'+p.id+'">Confirmer</button>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="del-'+p.id+'">Supprimer</button>')+'</span></td></tr>';}).join('')+'</tbody></table></div></section>';
}
function aCommandes(){
  const lab={envoyee:'<span class="badge b-orange">Envoyée</span>',confirmee:'<span class="badge b-green">Confirmée</span>',annulee:'<span class="badge b-grey">Annulée</span>'};
  return '<section class="card stack"><h2 style="font-size:17px">Commandes ('+S.orders.length+')</h2>'+(S.orders.length?'<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Boutique</th><th>Articles</th><th>Total</th><th>Canal</th><th>Statut</th></tr></thead><tbody>'+S.orders.map(x=>{const s=shopById(x.shop_id);return '<tr><td>'+esc(String(x.created_at).slice(0,16).replace('T',' '))+'</td><td>'+esc(s?s.nom:'?')+'</td><td>'+(x.items||[]).map(i=>i.qty+' × '+esc(i.nom)).join('<br>')+'</td><td class="num"><b>'+fmtN(x.total)+' F</b></td><td>'+(x.canal==='telegram'?'Telegram':'WhatsApp')+'</td><td>'+lab[x.statut]+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="muted" style="margin:0">Aucune commande pour l\'instant.</p>')+'</section>';
}
function saveCat(id,patch){const list=(S.settings.categories||[]).slice();let i=list.findIndex(c=>c&&c.id===id);
  if(i<0){const r=RAYONS.find(r=>r[0]===id);list.push({id,nom:r?r[1]:id});i=list.length-1;}
  list[i]=Object.assign({},list[i],patch);if(list[i].photo===null)delete list[i].photo;
  return q(sb.from('settings').update({categories:list}).eq('id',1));}
function aCatalogue(){
  const st=S.settings,cs=CATS(),nt=cs.reduce((a,c)=>a+c.types.length,0);
  return '<div class="gridf"><section class="card stack" style="grid-column:1/-1"><h2 style="font-size:17px">Rayons et types d\'articles <span class="cnt-pill">'+cs.length+' rayons · '+nt+' types</span></h2><p class="small muted" style="margin:0">Touchez une photo pour la remplacer par la vôtre. Ajoutez des types si un vendeur ne trouve pas le sien.</p><div class="radm">'+
  cs.map((c,i)=>{const n=S.products.filter(p=>(p.categorie||'autre')===c.id).length;
    return '<div class="radm-it"><label class="rayon" title="Changer la photo">'+rImg(c,i)+'<b>'+esc(c.nom)+'</b><input type="file" accept="image/*" data-file="catphoto" data-id="'+esc(c.id)+'" hidden></label><div class="stack" style="gap:6px;min-width:0"><span class="small muted">'+n+' produit'+(n>1?'s':'')+(c.own?' · <button type="button" class="linkbtn" data-a="rmCatPhoto" data-id="'+esc(c.id)+'">photo d\'origine</button>':'')+(!c.base?' · <button type="button" class="linkbtn" data-a="delCat" data-id="'+esc(c.id)+'">retirer le rayon</button>':'')+'</span><div class="row wrapx" style="gap:5px">'+c.types.map(t=>'<span class="tchip">'+esc(t)+(c.extra.includes(t)?'<button type="button" data-a="rmCatType" data-id="'+esc(c.id)+'" data-t="'+esc(t)+'" aria-label="Retirer '+esc(t)+'">×</button>':'')+'</span>').join('')+'</div><form class="row" data-f="catType" data-id="'+esc(c.id)+'" style="gap:6px"><input class="in" name="nom" required maxlength="40" placeholder="Nouveau type" aria-label="Nouveau type pour '+esc(c.nom)+'" style="height:38px"><button class="btn btn-w btn-s" type="submit">Ajouter</button></form></div></div>';}).join('')+'</div>'+
  '<form class="row" data-f="cat"><label class="lbl" style="flex:1"><span hidden>Nouveau rayon</span><input class="in" id="n-cat" name="nom" required placeholder="Nouveau rayon"></label><button class="btn btn-v btn-s" type="submit">Créer le rayon</button></form></section>'+
  '<section class="card stack"><h2 style="font-size:17px">Quartiers proposés</h2><p class="small muted" style="margin:0">Suggestions affichées quand un vendeur tape son quartier. Les villes de Côte d\'Ivoire sont déjà prêtes.</p><div class="row wrapx">'+(st.quartiers||[]).map(x=>'<span class="chip row" style="gap:6px;cursor:default">'+esc(x)+'<button type="button" data-a="delQ" data-id="'+esc(x)+'" aria-label="Retirer '+esc(x)+'" style="border:0;background:none;cursor:pointer;font-weight:800;color:var(--muted)">×</button></span>').join('')+'</div>'+
  '<form class="row" data-f="quartier"><label class="lbl" style="flex:1"><span hidden>Nouveau quartier</span><input class="in" id="n-q" name="nom" required placeholder="Nouveau quartier"></label><button class="btn btn-v btn-s" type="submit">Ajouter</button></form></section></div>';
}
function aParams(){
  const st=S.settings;
  return '<form class="card stack" data-f="params" style="max-width:640px"><h2 style="font-size:17px">Paramètres de la plateforme</h2><label class="lbl">Nom de la plateforme<input class="in" id="p-nom" name="nom" value="'+esc(st.nom)+'"></label><div class="grid2"><label class="lbl">Produits gratuits par vendeur<input class="in" id="p-lim" name="limite_gratuit" type="number" min="1" value="'+st.limite_gratuit+'"></label><label class="lbl">Prix Pro (FCFA / mois)<input class="in" id="p-pro" name="prix_pro" inputmode="numeric" value="'+esc(st.prix_pro)+'" placeholder="à définir"></label></div><div class="grid2"><label class="lbl">Prix mise en vedette (FCFA / semaine)<input class="in" id="p-ved" name="prix_vedette" inputmode="numeric" value="'+esc(st.prix_vedette)+'" placeholder="à définir"></label><label class="lbl">Prix bannière (FCFA / semaine)<input class="in" id="p-ban" name="prix_banniere" inputmode="numeric" value="'+esc(st.prix_banniere||'')+'" placeholder="à définir"></label></div>'+
  '<h3 style="font-size:15px">Vos numéros pour recevoir les paiements</h3><div class="grid2">'+OPS.map(o=>'<label class="lbl">'+o[1]+'<input class="in" name="pm_'+o[0]+'" type="tel" value="'+esc((st.paiement||{})[o[0]]||'')+'" placeholder="07 XX XX XX XX"></label>').join('')+'</div>'+
  '<label class="lbl">WhatsApp du support (mot de passe oublié, aide)<input class="in" name="support_whatsapp" type="tel" value="'+esc(st.support_whatsapp||'')+'" placeholder="07 XX XX XX XX"></label>'+
  '<button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>'+aNotif();
}
function aNotif(){const st=S.settings,pub=st.vapid_public||'';
  if(ui.npret===undefined){ui.npret=null;fetch('/api/notify').then(r=>r.json()).then(j=>{ui.npret=j;render(true);},()=>{ui.npret=false;render(true);});}
  const np=ui.npret,ok=np&&np.pret&&np.cle===pub&&pub;
  let h='<section class="card stack" style="max-width:640px;margin-top:14px"><h2 style="font-size:17px">🔔 Notifications des clients</h2>';
  if(!('vapid_public' in st))return h+'<div class="warn small">Lancez d\'abord <b>supabase/mise-a-jour-5.sql</b> dans Supabase.</div></section>';
  if(ok)return h+'<div class="good small"><b>✔ Notifications prêtes.</b> Les clients reçoivent les nouveautés des boutiques suivies et les étapes de leurs commandes.</div></section>';
  if(ui.vapid)return h+'<p class="small" style="margin:0"><b>Étape 2.</b> Dans Vercel, ouvrez votre projet → <b>Settings</b> → <b>Environment Variables</b>, et ajoutez ces 2 variables. Puis faites <b>Redeploy</b>.</p>'+
    [['VAPID_PUBLIC_KEY',ui.vapid.pub],['VAPID_PRIVATE_KEY',ui.vapid.priv]].map(x=>'<div class="stack" style="gap:4px"><b class="small">'+x[0]+'</b><div class="row" style="gap:6px"><input class="in" readonly value="'+esc(x[1])+'" aria-label="'+x[0]+'" style="font-family:monospace;font-size:12px"><button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(x[1])+'">Copier</button></div></div>').join('')+
    '<div class="warn small">La clé privée s\'affiche <b>une seule fois</b>. Ne la donnez à personne : collez-la seulement dans Vercel.</div></section>';
  if(pub&&(np===false||(np&&!np.pret)))return h+'<div class="warn small">Les clés sont créées, mais Vercel ne les a pas encore. Ajoutez <b>VAPID_PUBLIC_KEY</b>, <b>VAPID_PRIVATE_KEY</b> et <b>SUPABASE_SERVICE_ROLE_KEY</b> dans Vercel, puis Redeploy.</div><button type="button" class="btn btn-w btn-s" data-a="genVapid">Recréer les clés (si la clé privée est perdue)</button></section>';
  if(pub&&np&&np.pret&&np.cle!==pub)return h+'<div class="warn small">La clé dans Vercel ne correspond pas à celle du site. Recréez les clés et remplacez-les dans Vercel.</div><button type="button" class="btn btn-v btn-s" data-a="genVapid">Recréer les clés</button></section>';
  if(pub)return h+'<p class="small muted" style="margin:0">Vérification…</p></section>';
  return h+'<p class="small" style="margin:0"><b>Étape 1.</b> Créez les clés de notification (une seule fois).</p><button type="button" class="btn btn-v" data-a="genVapid">Créer les clés</button></section>';
}

/* ---------- NAV / RENDER ---------- */
function nav(h){
  if(isAdmin()&&h==='vendeur')h='admin';
  const base=h.startsWith('boutique-')||h.startsWith('produit-')||h.startsWith('rayon-')||h==='rayons'||h==='compte'||h.startsWith('chat-')||h==='discussions'||h==='favoris'||h==='verifier'?'accueil':h.startsWith('suivi-')||h==='commandes'?'panier':h;
  const it=(id,label,icon,extra)=>'<a href="#'+id+'" class="'+(base===id?'on':'')+'">'+ic(icon,22)+label+(extra||'')+'</a>';
  const c=cartCount();
  return '<nav class="nav" aria-label="Navigation">'+it('accueil','Accueil','home')+it('panier','Panier','bag',c?'<span class="cnt">'+c+'</span>':'')+(isAdmin()?it('admin','Admin','shield'):it('vendeur','Vendeur','user'))+'</nav>';
}
let lastHash=null;
function render(keep){
  if(!S.loaded){app.innerHTML='<div class="loading">Chargement…</div>';return;}
  let h=(location.hash||'#accueil').slice(1)||'accueil';
  if(h.startsWith('discussion-')){ui.vTab='messages';ui.conv=h.slice(11);history.replaceState(null,'','#vendeur');h='vendeur';}
  let html;
  if(h.startsWith('boutique-'))html=vBoutique(decodeURIComponent(h.slice(9)));
  else if(h.startsWith('produit-'))html=vProduit(h.slice(8));
  else if(h.startsWith('rayon-'))html=vRayon(decodeURIComponent(h.slice(6)));
  else if(h==='rayons')html=vRayons();
  else if(h.startsWith('chat-'))html=vChat(decodeURIComponent(h.slice(5)));
  else if(h==='discussions')html=vDiscussions();
  else if(h==='compte')html=vCompte();
  else if(h==='panier')html=vPanier();
  else if(h==='favoris')html=vFavoris();
  else if(h.startsWith('suivi-'))html=vSuivi(h.slice(6));
  else if(h==='commandes')html=vMesCommandes();
  else if(h==='verifier')html=vVerifier();
  else if(h==='vendeur')html=isAdmin()?vAdmin():vVendeur();
  else if(h==='admin')html=vAdmin();
  else html=vAccueil();
  if(h.startsWith('produit-')||h==='panier'||h==='compte'||h.startsWith('suivi-')||(!S.user&&(h==='vendeur'||h==='admin')))html=html.replace('class="wrap"','class="wrap narrow"');
  if(S.error)html='<div class="wrap" style="padding-bottom:0"><div class="err">'+esc(S.error)+' <button type="button" class="btn btn-w btn-s" data-a="reload">Réessayer</button></div></div>'+html;
  const y=window.scrollY;app.innerHTML=html+nav(h);
  if(keep&&lastHash===h)window.scrollTo(0,y);else window.scrollTo(0,0);lastHash=h;
}
let toastT;
function toast(t){const l=document.getElementById('layer');if(l.querySelector('.modal'))return;l.innerHTML='<div class="toast" role="status">'+esc(t)+'</div>';clearTimeout(toastT);toastT=setTimeout(()=>{if(!l.querySelector('.modal'))l.innerHTML='';},2800);}
function copy(text,msg){const done=()=>toast(msg||'Lien copié');
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){toast('Copiez le texte à la main');}ta.remove();};
  try{navigator.clipboard.writeText(text).then(done,fb);}catch(e){fb();}}
function addToCart(pid,taille){const p=prodById(pid);if(!p||p.stock<=0)return;
  const l=cart.find(x=>x.pid===pid&&(x.taille||null)===(taille||null));
  if(l){if(l.qty<p.stock)l.qty++;}else cart.push({pid,qty:1,taille:taille||null});saveCart();toast('Ajouté au panier');}
function logOrder(shopId,canal,single,id){
  const lines=single?[{p:prodById(single),qty:1,taille:ui.taille}]:cart.map(l=>({p:prodById(l.pid),qty:l.qty,taille:l.taille})).filter(l=>l.p&&l.p.shop_id===shopId);
  if(!lines.length)return;id=id||uuid();
  const row={id,shop_id:shopId,canal,statut:'envoyee',items:lines.map(l=>({pid:l.p.id,nom:l.p.nom,prix:prix(l.p),qty:l.qty,taille:l.taille||null})),total:lines.reduce((a,l)=>a+prix(l.p)*l.qty,0),
    client_nom:String(client.nom||'').trim().slice(0,80),client_tel:String(client.tel||'').trim().slice(0,30),client_adresse:String(client.adresse||'').trim().slice(0,200)};
  const mkCode=()=>sb.rpc('creer_code',{oid:id,c:code}).then(()=>{},()=>{});
  sb.from('orders').insert(row).then(r=>{if(r&&r.error){delete row.client_nom;delete row.client_tel;delete row.client_adresse;sb.from('orders').insert(row).then(mkCode,()=>{});}else mkCode();},()=>{});
  const code=String(Math.floor(1000+Math.random()*9000));
  const s=shopById(shopId);myOrders=[{id,code,boutique:s?s.nom:'',total:row.total,date:new Date().toISOString()}].concat(myOrders.filter(o=>o.id!==id)).slice(0,30);lsSet('gbairai-mes-commandes',myOrders);setTimeout(pushSync,1500);
  Object.keys(orderIds).forEach(k=>{if(orderIds[k]===id)delete orderIds[k];});
  if(!single){cart=cart.filter(l=>{const p=prodById(l.pid);return p&&p.shop_id!==shopId;});saveCart();setTimeout(()=>render(true),400);}
}

/* photos */
function resizePhoto(file,max){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const m=max||900,k=Math.min(1,m/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?res({blob:b,url:URL.createObjectURL(b)}):rej(new Error('photo')),'image/jpeg',.75);};img.onerror=rej;img.src=r.result;};r.onerror=rej;r.readAsDataURL(file);});}
async function uploadPhoto(blob){
  const path=S.user.id+'/'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2))+'.jpg';
  await q(sb.storage.from('photos').upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'}));
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

/* share image */
function rr(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();}
async function shareImage(p){const s=shopById(p.shop_id);p=Object.assign({},p,{prix:prix(p),prix_barre:promoOn(p)?p.prix_barre:null});return GbStatut.product({p,s,link:shortLink(shopUrl(s)),brand:S.settings.nom||'Gbairai Market'});}
async function shopImage(s){const ps=shopProducts(s.id).filter(p=>p.visible&&p.stock>0);const withPhoto=ps.filter(p=>p.photo).concat(ps.filter(p=>!p.photo));
  return GbStatut.shop({s,prods:withPhoto.slice(0,4),total:ps.length,link:shortLink(shopUrl(s)),brand:S.settings.nom||'Gbairai Market'});}
function shortLink(u){return String(u).replace(/^https?:\/\//,'');}
async function showShopShare(){const s=myShop();if(!s)return;const l=document.getElementById('layer');
  l.innerHTML='<div class="modal" data-a="closeModal"><div class="card stack" data-stop="1"><p class="muted" style="margin:0">Création de l\'image…</p></div></div>';
  const url=await shopImage(s);
  l.innerHTML='<div class="modal" data-a="closeModal"><div class="card stack" data-stop="1"><h2 style="font-size:17px">Image de ma boutique pour le statut</h2><img src="'+url+'" alt="Image de la boutique '+esc(s.nom)+'" style="border-radius:16px;width:100%;max-height:60vh;object-fit:contain"><a class="btn btn-v btn-s" href="'+url+'" download="'+esc(s.slug)+'-statut.jpg">Enregistrer l\'image</a><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(shopShareText(s))+'">'+ic('wa',16,'#fff')+'Envoyer le lien</a><p class="small muted" style="margin:0">Publiez l\'image sur votre statut et mettez le lien en légende.</p><button type="button" class="btn btn-w btn-s" data-a="closeModal">Fermer</button></div></div>';}
function showConvSig(id,vendeur){document.getElementById('layer').innerHTML='<div class="modal" data-a="closeModal"><form class="card stack" data-stop="1" data-f="convSig" data-id="'+esc(id)+'" data-v="'+(vendeur?1:0)+'"><h2 style="font-size:17px">Signaler cette discussion</h2><p class="small muted" style="margin:0">L\'équipe Gbairai pourra lire cette discussion pour vous aider.</p><label class="lbl">Motif<select class="in" name="motif">'+(vendeur?['Client insultant','Faux client ou arnaque','Commande non récupérée','Autre']:['Arnaque ou demande d\'argent','Article non livré','Vendeur insultant','Autre']).map(x=>'<option>'+x+'</option>').join('')+'</select></label><button class="btn btn-r btn-block" type="submit">Envoyer le signalement</button><button type="button" class="btn btn-w btn-block" data-a="closeModal">Annuler</button></form></div>';}
function showReport(shopId,motif,oid){const s=shopById(shopId);if(!s)return;
  document.getElementById('layer').innerHTML='<div class="modal" data-a="closeModal"><form class="card stack" data-stop="1" data-f="report" data-id="'+s.id+'"><h2 style="font-size:17px">Signaler « '+esc(s.nom)+' »</h2><label class="lbl">Motif<select class="in" name="motif">'+['Arnaque ou vol','Produit non reçu','Faux produit / contrefaçon','Comportement inacceptable','Contenu choquant','Autre'].map(x=>'<option'+(x===motif?' selected':'')+'>'+x+'</option>').join('')+'</select></label><label class="lbl">Que s\'est-il passé ?<textarea class="in" name="details" rows="3" maxlength="1000">'+(oid?'Commande n° '+esc(String(oid).slice(0,8).toUpperCase())+' : ':'')+'</textarea></label><p class="small muted" style="margin:0">Vous avez une capture d\'écran ? Envoyez-la aussi au support sur WhatsApp.</p><label class="lbl">Votre contact (facultatif)<input class="in" name="contact" maxlength="60" placeholder="Numéro pour vous rappeler"></label><button class="btn btn-o btn-block" type="submit">Envoyer le signalement</button><button type="button" class="btn btn-w btn-s" data-a="closeModal">Annuler</button></form></div>';}
async function showShare(pid){
  const p=prodById(pid);if(!p)return;const l=document.getElementById('layer');const s=shopById(p.shop_id);
  l.innerHTML='<div class="modal" data-a="closeModal"><div class="card stack" data-stop="1"><p class="muted" style="margin:0">Création de l\'image…</p></div></div>';
  const url=await shareImage(p);
  l.innerHTML='<div class="modal" data-a="closeModal"><div class="card stack" data-stop="1"><h2 style="font-size:17px">Image pour votre statut</h2><img src="'+url+'" alt="Image de '+esc(p.nom)+' à partager" style="border-radius:16px;width:100%"><a class="btn btn-v btn-s" href="'+url+'" download="'+esc(slugify(p.nom))+'.jpg">Enregistrer l\'image</a><p class="small muted" style="margin:0">Si le bouton ne marche pas, appuyez longuement sur l\'image. Publiez-la sur votre statut avec le lien de votre boutique.</p><button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(shopUrl(s))+'">'+ic('link',16)+'Copier le lien de la boutique</button><button type="button" class="btn btn-w btn-s" data-a="closeModal">Fermer</button></div></div>';
}

/* ---------- ACTIONS ---------- */
const A={
  reload:()=>{S.loaded=false;render();loadAll().then(()=>render());},
  cat:t=>{ui.cat=ui.cat===t.dataset.id?null:t.dataset.id;render(true);},
  quartier:t=>{ui.quartier=t.dataset.id;render(true);},
  add:t=>{const p=prodById(t.dataset.id);if(p.tailles&&p.tailles.trim()){location.hash='produit-'+p.id;return;}addToCart(p.id);render(true);},
  addT:t=>{addToCart(t.dataset.id,ui.taille);render(true);},
  taille:t=>{ui.taille=t.dataset.id;render(true);},
  qty:t=>{const i=+t.dataset.i,l=cart[i];if(!l)return;const p=prodById(l.pid);l.qty+=+t.dataset.d;if(l.qty<=0)cart.splice(i,1);else if(p&&l.qty>p.stock){l.qty=p.stock;toast('Stock disponible : '+p.stock);}saveCart();render(true);},
  order:t=>logOrder(t.dataset.shop,'whatsapp',t.dataset.single,t.dataset.oid),
  orderTg:t=>{copy(t.dataset.text,'Message copié : collez-le sur Telegram');logOrder(t.dataset.shop,'telegram',null,t.dataset.oid);},
  fav:t=>{const id=t.dataset.id;favs=isFav(id)?favs.filter(x=>x!==id):[id].concat(favs);lsSet('gbairai-favoris',favs);toast(isFav(id)?'Ajouté aux favoris':'Retiré des favoris');render(true);},
  galGo:t=>{const g=document.getElementById('gal');if(g)g.scrollTo({left:g.clientWidth*(+t.dataset.i),behavior:'smooth'});},
  copy:t=>copy(t.dataset.text),
  share:t=>showShare(t.dataset.id),
  closeModal:()=>{document.getElementById('layer').innerHTML='';},
  convSignal:t=>showConvSig(t.dataset.id,false),
  convSignalV:t=>showConvSig(t.dataset.id,true),
  convOpen:t=>{ui.conv=t.dataset.id;render();},
  convBack:()=>{ui.conv=null;render();},
  litOpen:t=>{ui.lit=t.dataset.id;render();},
  litBack:()=>{ui.lit=null;render();},
  litClose:t=>act(async()=>{await q(sb.from('conversations').update({signale:false}).eq('id',t.dataset.id));ui.lit=null;},'Litige clos'),
  litBlock:t=>{const c=(S.litiges||[]).find(x=>x.id===t.dataset.id);if(!c)return;act(()=>q(sb.from('blacklist').upsert({phone:waNum(c.client_tel),motif:'Litige : '+(c.motif||'discussion signalée')})),'Numéro bloqué');},
  follow:t=>{const id=t.dataset.id,on=!isFollow(id),s=shopById(id);setFollow(id,on);if(ui.nbAb[id]!=null)ui.nbAb[id]=Math.max(0,ui.nbAb[id]+(on&&pushOn()?1:!on&&pushOn()?-1:0));render(true);
    if(on&&s){if(!pushOn()&&pushOK()&&S.settings.vapid_public)askAlerts(s);else toast('Vous suivez '+s.nom);}else if(s)toast('Vous ne suivez plus '+s.nom);},
  pushOn:()=>{document.getElementById('layer').innerHTML='';pushEnable().then(()=>render(true));},
  pushOff:()=>{pushDisable().then(()=>render(true));},
  install:()=>{const G=window.GBinstall;if(!G)return;if(G.ios&&!G.installee())showInstallHelp(false);else G.lancer().then(ok=>{if(ok)toast('Gbairai est installé 🎉');render(true);});},
  cTab:t=>{ui.cTab=t.dataset.id;render(true);},
  genVapid:()=>{if(S.settings.vapid_public&&!confirm('Recréer les clés ? Les clients devront réactiver leurs alertes.'))return;
    crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']).then(k=>crypto.subtle.exportKey('jwk',k.privateKey)).then(j=>{
      const pub=b64uStr(Uint8Array.from([4].concat(Array.from(b64uBytes(j.x)),Array.from(b64uBytes(j.y)))));
      ui.vapid={pub,priv:j.d};return act(()=>q(sb.from('settings').update({vapid_public:pub}).eq('id',1)),'Clés créées');}).catch(()=>toast('Impossible de créer les clés'));},
  authMode:t=>{ui.authMode=t.dataset.id;render(true);},
  logout:()=>act(async()=>{await sb.auth.signOut();S.synced=false;S.cnom='';ui.vTab='accueil';ui.adminShop=null;},'Déconnecté'),
  vtab:t=>{ui.vTab=t.dataset.id;ui.edit=null;ui.photo=undefined;ui.extras=undefined;ui.confirm=null;render();},
  newProd:()=>{const s=myShop();if(s.formule!=='pro'&&shopProducts(s.id).length>=S.settings.limite_gratuit){ui.vTab='produits';render();toast('Limite gratuite atteinte ('+S.settings.limite_gratuit+' produits). Passez Pro.');return;}ui.vTab='produits';ui.edit='new';ui.newColor=Math.floor(Math.random()*6);ui.photo=undefined;ui.extras=undefined;render();},
  editProd:t=>{ui.edit=t.dataset.id;ui.photo=undefined;ui.extras=undefined;ui.confirm=null;render();},
  cancelEdit:()=>{ui.edit=null;ui.photo=undefined;ui.extras=undefined;ui.confirm=null;render();},
  rmLogo:()=>{const s=myShop();if(s)act(()=>q(sb.from('shops').update({logo:null}).eq('id',s.id)),'Logo retiré');},
  rmPhoto:()=>{keepForm();ui.photo=null;render(true);restoreForm();},
  rmExtra:t=>{keepForm();ui.extras.splice(+t.dataset.i,1);render(true);restoreForm();},
  vis:t=>{const p=prodById(t.dataset.id);act(()=>q(sb.from('products').update({visible:!p.visible}).eq('id',p.id)));},
  confirm:t=>{ui.confirm=t.dataset.id;render(true);},
  cancelConfirm:()=>{ui.confirm=null;render(true);},
  delProd:t=>act(async()=>{await q(sb.from('products').delete().eq('id',t.dataset.id));cart=cart.filter(l=>l.pid!==t.dataset.id);saveCart();ui.edit=null;ui.confirm=null;},'Produit supprimé'),
  stock:t=>{const p=prodById(t.dataset.id);const v=Math.max(0,p.stock+(+t.dataset.d));p.stock=v;render(true);act(()=>q(sb.from('products').update({stock:v}).eq('id',p.id)));},
  periode:t=>{ui.caissePeriode=t.dataset.id;render(true);},
  delTx:t=>act(()=>q(sb.from('txs').delete().eq('id',t.dataset.id))),
  confOrder:t=>act(async()=>{const o=S.orders.find(x=>x.id===t.dataset.id);
    await q(sb.from('orders').update({statut:'confirmee'}).eq('id',o.id));notify({kind:'commande',order_id:o.id});
    for(const it of (o.items||[])){const p=prodById(it.pid);if(p)await q(sb.from('products').update({stock:Math.max(0,p.stock-it.qty)}).eq('id',p.id));}
    await q(sb.from('txs').insert({shop_id:o.shop_id,type:'recette',montant:o.total,libelle:'Vente · '+(o.items||[]).map(i=>i.qty+' '+i.nom).join(', ').slice(0,120),date:today()}));},'Vente confirmée : caisse et stock mis à jour'),
  cancelOrder:t=>act(()=>q(sb.from('orders').update({statut:'annulee'}).eq('id',t.dataset.id)).then(r=>{notify({kind:'commande',order_id:t.dataset.id});return r;})),
  shopShare:()=>showShopShare(),
  liv:t=>act(()=>q(sb.from('orders').update({livraison:t.dataset.v}).eq('id',t.dataset.id)).then(r=>{notify({kind:'commande',order_id:t.dataset.id});return r;}),'Livraison mise à jour'),
  payType:t=>{ui.pay.type=t.dataset.id;render(true);},
  payOp:t=>{ui.pay.op=t.dataset.id;render(true);},
  payOk:t=>act(()=>q(sb.rpc('valider_paiement',{pid:t.dataset.id})),'Paiement validé : formule activée'),
  payNo:t=>act(()=>q(sb.from('payments').update({statut:'refuse',note_admin:'Paiement non reçu. Contactez le support.'}).eq('id',t.dataset.id)),'Paiement refusé'),
  bnToggle:t=>{const b=S.banners.find(x=>x.id===t.dataset.id);act(()=>q(sb.from('banners').update({actif:!b.actif}).eq('id',b.id)));},
  bnDel:t=>act(()=>q(sb.from('banners').delete().eq('id',t.dataset.id)),'Bannière supprimée'),
  repDone:t=>act(()=>q(sb.from('reports').update({statut:'traite'}).eq('id',t.dataset.id))),
  blShop:t=>{const s=shopById(t.dataset.id);act(async()=>{await q(sb.from('blacklist').upsert({phone:waNum(s.whatsapp),motif:t.dataset.motif||''}));await q(sb.from('shops').update({statut:'suspendu'}).eq('id',s.id));},'Numéro bloqué et boutique suspendue');},
  blDel:t=>act(()=>q(sb.from('blacklist').delete().eq('phone',t.dataset.id)),'Numéro retiré'),
  rvToggle:t=>{const r=S.reviews.find(x=>x.id===t.dataset.id);act(()=>q(sb.from('reviews').update({visible:!r.visible}).eq('id',r.id)));},
  rvDel:t=>act(()=>q(sb.from('reviews').delete().eq('id',t.dataset.id)),'Avis supprimé'),
  report:t=>showReport(t.dataset.id,t.dataset.motif,t.dataset.oid),
  clientRep:t=>showClientRep(t.dataset.tel,t.dataset.id),
  repOk:t=>act(()=>q(sb.from('reports').update({statut:'confirme'}).eq('id',t.dataset.id)),'Signalement confirmé'),
  crSet:t=>act(()=>q(sb.from('client_reports').update({statut:t.dataset.v}).eq('id',t.dataset.id))),
  crBlock:t=>act(async()=>{const r=S.clientReports.find(x=>x.id===t.dataset.id);await q(sb.from('blacklist').upsert({phone:waNum(r.client_tel),motif:'Client : '+r.motif}));await q(sb.from('client_reports').update({statut:'confirme'}).eq('id',r.id));},'Numéro bloqué'),
  pwdHelp:()=>{ui.pwdHelp=!ui.pwdHelp;render(true);},
  aReset:t=>act(async()=>{const r=await fetch('/api/reset-password',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({shop_id:t.dataset.id})});
    let j={};try{j=await r.json();}catch(e){}if(!r.ok)throw new Error(j.error||'Service indisponible. Vérifiez la clé dans Vercel.');ui.aPwd={shop:t.dataset.id,pw:j.password};},'Nouveau mot de passe créé'),
  per:t=>{ui.per=Number(t.dataset.id);render(true);},
  atab:t=>{ui.aTab=t.dataset.id;ui.adminShop=null;ui.confirm=null;ui.edit=null;ui.photo=undefined;ui.extras=undefined;render();},
  aFilter:t=>{ui.aFilter=t.dataset.id;render(true);},
  aOpen:t=>{ui.aTab='vendeurs';ui.adminShop=t.dataset.id;ui.confirm=null;render();},
  aClose:()=>{ui.adminShop=null;ui.confirm=null;render();},
  aVerif:t=>act(()=>q(sb.from('shops').update({verification:'verifie',motif_refus:''}).eq('id',t.dataset.id)),'Vendeur vérifié'),
  aSusp:t=>{const s=shopById(t.dataset.id);act(()=>q(sb.from('shops').update({statut:s.statut==='actif'?'suspendu':'actif'}).eq('id',s.id)),s.statut==='actif'?'Boutique suspendue':'Boutique réactivée');},
  delShop:t=>act(async()=>{await q(sb.from('shops').delete().eq('id',t.dataset.id));ui.adminShop=null;ui.confirm=null;},'Boutique supprimée'),
  rtype:t=>{ui.type=t.dataset.id||null;render(true);},
  rmCatPhoto:t=>act(()=>saveCat(t.dataset.id,{photo:null}),'Photo d\'origine remise'),
  rmCatType:t=>{const c=(S.settings.categories||[]).find(x=>x&&x.id===t.dataset.id);if(!c)return;if(S.products.some(p=>p.categorie===c.id&&p.type===t.dataset.t)){toast('Des produits utilisent ce type');return;}act(()=>saveCat(c.id,{types:(c.types||[]).filter(x=>x!==t.dataset.t)}));},
  delCat:t=>{if(S.products.some(p=>p.categorie===t.dataset.id)){toast('Des produits utilisent cette catégorie');return;}act(()=>q(sb.from('settings').update({categories:S.settings.categories.filter(c=>c.id!==t.dataset.id)}).eq('id',1)));},
  delQ:t=>{if(S.shops.some(s=>s.quartier===t.dataset.id)){toast('Des boutiques sont dans ce quartier');return;}act(()=>q(sb.from('settings').update({quartiers:S.settings.quartiers.filter(x=>x!==t.dataset.id)}).eq('id',1)));}
};
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');if(!t)return;
  if(t.classList.contains('modal')&&e.target!==t)return;
  const f=A[t.dataset.a];if(f)f(t,e);
});
function refreshOrderLinks(){
  document.querySelectorAll('[data-msg]').forEach(el=>{const sid=el.dataset.msg,s=shopById(sid);if(!s)return;
    const lines=cart.map(l=>({p:prodById(l.pid),qty:l.qty,taille:l.taille})).filter(l=>l.p&&l.p.shop_id===sid),o=oid('c-'+sid),txt=orderText(s,lines,o);
    el.textContent=txt;const a=document.querySelector('a[data-a="order"][data-shop="'+sid+'"]');if(a)a.href='https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(txt);
    const tg=document.querySelector('[data-a="orderTg"][data-shop="'+sid+'"]');if(tg)tg.dataset.text=txt;});}
document.addEventListener('input',e=>{
  const ck=e.target.dataset&&e.target.dataset.client;if(ck){client[ck]=e.target.value;lsSet('gbairai-client',client);refreshOrderLinks();return;}
  const k=e.target.dataset&&e.target.dataset.i;if(!k)return;ui[k]=e.target.value;
  if(k==='q')document.getElementById('results').innerHTML=results();
  else if(k==='aQ'){const pos=e.target.selectionStart;render(true);const el=document.getElementById('aq');if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(_){}}}
});
let formCache=null;
function keepForm(){const f=document.querySelector('form[data-f="produit"]');if(!f)return;formCache={};new FormData(f).forEach((v,k)=>formCache[k]=v);formCache.visible=f.querySelector('#f-vis').checked;}
function restoreForm(){const f=document.querySelector('form[data-f="produit"]');if(!f||!formCache)return;Object.keys(formCache).forEach(k=>{const el=f.elements[k];if(!el)return;if(el.type==='checkbox')el.checked=formCache[k];else el.value=formCache[k];});formCache=null;}
document.addEventListener('change',async e=>{
  if(e.target.name==='categorie'&&e.target.type==='radio'&&e.target.closest('form[data-f="produit"]')){const t=document.getElementById('f-type');if(t)t.innerHTML=typeOpts(e.target.value,'');document.querySelectorAll('.rpick .rayon').forEach(l=>l.classList.toggle('on',l.contains(e.target)));return;}
  if(e.target.dataset&&e.target.dataset.file==='catphoto'&&e.target.files[0]){const id=e.target.dataset.id;try{const r=await resizePhoto(e.target.files[0],700);act(async()=>{const url=await uploadPhoto(r.blob);await saveCat(id,{photo:url});},'Photo du rayon changée');}catch(err){toast('Impossible de lire cette photo');}return;}
  if(e.target.dataset&&e.target.dataset.a2==='payDuree'){ui.pay.duree=+e.target.value;render(true);return;}
  if(e.target.dataset&&e.target.dataset.file==='photo'&&e.target.files[0]){
    try{const r=await resizePhoto(e.target.files[0]);keepForm();ui.photo=r;render(true);restoreForm();}catch(err){toast('Impossible de lire cette photo');}
  }
  if(e.target.dataset&&e.target.dataset.file==='extra'&&e.target.files.length){
    keepForm();for(const f of Array.from(e.target.files).slice(0,4-ui.extras.length)){try{ui.extras.push(await resizePhoto(f));}catch(err){toast('Impossible de lire une photo');}}render(true);restoreForm();
  }
  if(e.target.dataset&&e.target.dataset.file==='banner'&&e.target.files[0]){
    try{ui.bannerImg=await resizePhoto(e.target.files[0],1200);const f=document.querySelector('form[data-f="banner"]');const keep={};if(f)new FormData(f).forEach((v,k)=>keep[k]=v);render(true);const g=document.querySelector('form[data-f="banner"]');if(g)Object.keys(keep).forEach(k=>{if(g.elements[k]&&g.elements[k].type!=='file')g.elements[k].value=keep[k];});}catch(err){toast('Impossible de lire cette image');}
  }
  if(e.target.dataset&&e.target.dataset.file==='logo'&&e.target.files[0]){
    const s=myShop();if(!s)return;let r;
    try{r=await resizePhoto(e.target.files[0],400);}catch(err){toast('Impossible de lire cette image');return;}
    act(async()=>{const url=await uploadPhoto(r.blob);await q(sb.from('shops').update({logo:url}).eq('id',s.id));},'Logo enregistré');
  }
});
async function createShop(d){
  let base=slugify(d.nom),slug=base,i=2;
  while(S.shops.some(s=>s.slug===slug))slug=base+'-'+(i++);
  const row={owner:S.user.id,slug,nom:d.nom.trim(),whatsapp:d.phone.trim(),ville:d.ville||'Abidjan',quartier:(d.quartier||'').trim(),categorie:d.categorie,couleur:Math.floor(Math.random()*6)};
  const ins=await q(sb.from('shops').insert(row).select().single());
  await q(sb.from('shop_private').insert({shop_id:ins.id}));
}
const FORMS={
  signup:d=>act(async()=>{
    if(waNum(d.phone).length<12)throw new Error('Numéro WhatsApp invalide (10 chiffres).');
    const r=await sb.auth.signUp({email:phoneEmail(d.phone),password:d.password,options:{data:{phone:waNum(d.phone)}}});
    if(r.error)throw r.error;
    if(!r.data.session){const l=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(l.error)throw new Error('Compte créé, mais la connexion a échoué. Réessayez dans « Me connecter ».');}
    const u=(await sb.auth.getUser()).data.user;S.user=u;await createShop(d);ui.vTab='accueil';
  },'Boutique créée'),
  chatSend:(d,f)=>{const sid=f.dataset.id,t=String(d.texte||'').trim();if(!t)return;
    if(d.nom){client.nom=String(d.nom).trim().slice(0,80);if(d.tel)client.tel=String(d.tel).trim().slice(0,30);lsSet('gbairai-client',client);}
    const st=chatSt(sid),btn=f.querySelector('button[type=submit]');if(btn)btn.disabled=true;
    (async()=>{let cid=convMap[sid];
      if(!cid){const r=await sb.rpc('conv_ouvrir',{sid,k:ck,nom:client.nom||'',tel:client.tel||''});if(r.error||!r.data)throw new Error(r.error?errMsg(r.error):'Impossible d\'écrire à cette boutique.');cid=r.data;convMap[sid]=cid;lsSet('gbairai-convs',convMap);pushSync();}
      const r=await sb.rpc('conv_envoyer',{cid,k:ck,t});if(r.error||r.data===false)throw new Error(r.error?errMsg(r.error):'Message non envoyé.');
      (st.msgs||(st.msgs=[])).push({de:'client',texte:t,created_at:new Date().toISOString()});
      const ta=f.querySelector('textarea');if(ta)ta.value='';render(true);const box=document.getElementById('chatbox');if(box)box.scrollTop=box.scrollHeight;
      notifyAnon({kind:'message',conv_id:cid,k:ck});
    })().catch(e=>{toast(e.message||'Message non envoyé');if(btn)btn.disabled=false;});},
  vReply:(d,f)=>{const cid=f.dataset.id,t=String(d.texte||'').trim();if(!t)return;const btn=f.querySelector('button[type=submit]');if(btn)btn.disabled=true;
    q(sb.from('messages').insert({conv_id:cid,de:'vendeur',texte:t.slice(0,1000)})).then(()=>{(ui.vmsgs[cid]||(ui.vmsgs[cid]=[])).push({de:'vendeur',texte:t,created_at:new Date().toISOString()});const c=(S.convs||[]).find(x=>x.id===cid);if(c){c.last_msg=t.slice(0,120);c.last_at=new Date().toISOString();}
      const ta=f.querySelector('textarea');if(ta)ta.value='';render(true);const box=document.getElementById('chatbox');if(box)box.scrollTop=box.scrollHeight;notify({kind:'message',conv_id:cid});},e=>{toast(errMsg(e));if(btn)btn.disabled=false;});},
  convSig:(d,f)=>{const id=f.dataset.id,v=f.dataset.v==='1',cid=v?id:convMap[id];document.getElementById('layer').innerHTML='';
    sb.rpc('conv_signaler',{cid,k:v?'00000000-0000-4000-8000-000000000000':ck,m:String(d.motif||'')}).then(r=>{if(r.data){toast('Signalement envoyé. Merci.');const c=(S.convs||[]).find(x=>x.id===cid);if(c)c.signale=true;render(true);}else toast('Signalement impossible');},()=>toast('Signalement impossible'));},
  csignup:d=>act(async()=>{
    if(waNum(d.phone).length<12)throw new Error('Numéro de téléphone invalide (10 chiffres).');
    const nom=String(d.nom||'').trim().slice(0,80);
    const r=await sb.auth.signUp({email:phoneEmail(d.phone),password:d.password,options:{data:{phone:waNum(d.phone),nom,type:'client'}}});
    if(r.error){if(/registered|exists/i.test(r.error.message||''))throw new Error('Ce numéro a déjà un compte. Touchez « Me connecter ».');throw r.error;}
    if(!r.data.session){const l=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(l.error)throw new Error('Compte créé. Connectez-vous avec « Me connecter ».');}
    S.cnom=nom;client.nom=client.nom||nom;client.tel=client.tel||d.phone;lsSet('gbairai-client',client);
  },'Compte créé 🎉'),
  clogin:d=>act(async()=>{const r=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(r.error)throw new Error('Numéro ou mot de passe incorrect.');},'Connecté'),
  login:d=>act(async()=>{const r=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(r.error)throw r.error;},'Connecté'),
  newshop:d=>act(()=>createShop(d),'Boutique créée'),
  produit:(d,f)=>act(async()=>{
    const s=myShop(),prix=n0(d.prix);if(prix<=0)throw new Error('Indiquez un prix.');
    const data={nom:d.nom.trim(),description:d.description.trim(),prix:Math.round(prix),categorie:d.categorie||'autre',type:String(d.type||'').trim().slice(0,40),tailles:d.tailles.trim(),stock:Math.max(0,Math.round(n0(d.stock))),visible:f.querySelector('#f-vis').checked};
    if(ui.photo)data.photo=await uploadPhoto(ui.photo.blob);else if(ui.photo===null)data.photo=null;
    const barre=Math.round(n0(d.prix_barre));data.prix_barre=barre>data.prix?barre:null;data.promo_fin=data.prix_barre&&d.promo_fin?new Date(d.promo_fin).toISOString():null;
    if(d.prix_barre&&!data.prix_barre)throw new Error('L\'ancien prix doit être plus grand que le prix promo.');
    if(ui.extras){const out=[];for(const x of ui.extras)out.push(x.blob?await uploadPhoto(x.blob):x.url);data.photos=out;}
    const old=ui.edit==='new'?null:prodById(ui.edit);
    const save=x=>ui.edit==='new'?q(sb.from('products').insert(Object.assign({shop_id:s.id,couleur:ui.newColor||0},x)).select('id').single()):q(sb.from('products').update(x).eq('id',ui.edit));
    let row;try{row=await save(data);}catch(e){if(!/type/i.test(String(e&&e.message)))throw e;delete data.type;row=await save(data);}
    if(data.visible&&data.stock>0){if(!old&&row&&row.id)notify({kind:'boutique',shop_id:s.id,product_id:row.id});else if(old&&data.prix_barre&&!old.prix_barre)notify({kind:'boutique',shop_id:old.shop_id,product_id:old.id,promo:true});}
    ui.edit=null;ui.photo=undefined;ui.extras=undefined;
  },'Produit enregistré'),
  tx:d=>act(async()=>{const m=Math.round(n0(d.montant));if(m<=0)throw new Error('Indiquez un montant.');await q(sb.from('txs').insert({shop_id:myShop().id,type:d.type,montant:m,libelle:d.libelle.trim(),date:d.date||today()}));},'Mouvement enregistré'),
  shop:(d,f)=>act(async()=>{
    const id=f.dataset.id,admin=f.dataset.admin==='1';
    const keys=['nom','gerant','categorie','description','whatsapp','telegram','telephone','email','facebook','tiktok','ville','quartier','adresse','livraison_zones','livraison_frais'];
    if(admin)keys.push('verification','motif_refus','formule','statut');
    const row={};keys.forEach(k=>{if(k in d)row[k]=String(d[k]).trim();});
    if('paiement_livraison' in d)row.paiement_livraison=d.paiement_livraison==='oui';
    if(admin&&'vedette' in d)row.vedette=d.vedette==='true';
    if(admin&&d.slug){const sl=slugify(d.slug);if(S.shops.some(x=>x.slug===sl&&x.id!==id))throw new Error('Ce lien est déjà pris.');row.slug=sl;}
    await q(sb.from('shops').update(row).eq('id',id));
    const pv={shop_id:id,cni:String(d.cni||'').trim()};if(admin)pv.notes=String(d.notes||'');
    await q(sb.from('shop_private').upsert(pv));
  },'Enregistré'),
  catType:(d,f)=>act(()=>{const id=f.dataset.id,x=String(d.nom||'').trim().slice(0,40),c=CATS().find(c=>c.id===id);if(!x||!c||c.types.includes(x))return Promise.resolve();const own=((S.settings.categories||[]).find(k=>k&&k.id===id)||{}).types||[];return saveCat(id,{types:own.concat([x])});},'Type ajouté'),
  cat:d=>act(()=>{const id=slugify(d.nom);if(CATS().some(c=>c.id===id))return Promise.resolve();return q(sb.from('settings').update({categories:S.settings.categories.concat([{id,nom:d.nom.trim()}])}).eq('id',1));}),
  quartier:d=>act(()=>{const x=d.nom.trim();if(!x||S.settings.quartiers.includes(x))return Promise.resolve();return q(sb.from('settings').update({quartiers:S.settings.quartiers.concat([x])}).eq('id',1));}),
  params:d=>act(()=>q(sb.from('settings').update({nom:d.nom.trim()||'Gbairai Market',limite_gratuit:Math.max(1,Math.round(n0(d.limite_gratuit))),prix_pro:d.prix_pro,prix_vedette:d.prix_vedette,prix_banniere:d.prix_banniere,support_whatsapp:String(d.support_whatsapp||'').trim(),paiement:{orange:String(d.pm_orange||'').trim(),mtn:String(d.pm_mtn||'').trim(),moov:String(d.pm_moov||'').trim(),wave:String(d.pm_wave||'').trim()}}).eq('id',1)),'Paramètres enregistrés'),
  avis:(d,f)=>act(async()=>{await q(sb.from('reviews').insert({shop_id:f.dataset.id,nom:String(d.nom).trim().slice(0,60),note:Math.min(5,Math.max(1,+d.note||5)),commentaire:String(d.commentaire||'').trim().slice(0,600)}));lsSet('gbairai-avis',lsGet('gbairai-avis',[]).concat([f.dataset.id]));if(!client.nom){client.nom=String(d.nom).trim();lsSet('gbairai-client',client);}},'Merci pour votre avis !'),
  report:(d,f)=>act(async()=>{await q(sb.from('reports').insert({shop_id:f.dataset.id,motif:d.motif,details:String(d.details||'').trim().slice(0,1000),contact:String(d.contact||'').trim().slice(0,60)}));document.getElementById('layer').innerHTML='';},'Signalement envoyé. Merci, nous allons vérifier.'),
  pay:d=>act(async()=>{const s=myShop();if(!String(d.reference).trim())throw new Error('Indiquez la référence de la transaction.');
    await q(sb.from('payments').insert({shop_id:s.id,type:d.type,duree:Math.max(1,Math.min(12,+ui.pay.duree||1)),montant:Math.round(n0(d.montant)),operateur:d.operateur,telephone:String(d.telephone).trim(),reference:String(d.reference).trim()}));},'Paiement envoyé. Activation après vérification.'),
  pwd:d=>act(async()=>{if(d.password!==d.password2)throw new Error('Les deux mots de passe sont différents.');const r=await sb.auth.updateUser({password:d.password});if(r.error)throw r.error;},'Mot de passe changé'),
  client:()=>toast('Informations enregistrées'),
  livreur:(d,f)=>act(()=>q(sb.from('orders').update({livreur_nom:String(d.livreur_nom||'').trim().slice(0,60),livreur_tel:String(d.livreur_tel||'').trim().slice(0,30),eta:String(d.eta||'').trim().slice(0,60)}).eq('id',f.dataset.id)),'Livraison mise à jour'),
  codeLiv:(d,f)=>act(async()=>{const r=await q(sb.rpc('confirmer_livraison',{oid:f.dataset.id,c:String(d.code||'').trim()}));if(r==='ok')notify({kind:'commande',order_id:f.dataset.id});
    const m={ok:null,faux:'Code faux. Vérifiez avec le client.',bloque:'Trop d\'essais : code bloqué. Contactez le support.',aucun:'Cette commande n\'a pas de code (ancienne commande). Utilisez le bouton « Livrée ».',interdit:'Action non autorisée.',introuvable:'Commande introuvable.'};
    if(r!=='ok')throw new Error(m[r]||'Erreur');},'Livraison confirmée ✔'),
  clientRep:(d,f)=>act(async()=>{await q(sb.from('client_reports').insert({shop_id:f.dataset.id,client_tel:f.dataset.tel,motif:d.motif,details:String(d.details||'').trim().slice(0,600)}));document.getElementById('layer').innerHTML='';},'Signalement envoyé à l\'administrateur'),
  verifier:d=>{const tel=String(d.tel||'').trim();ui.verif={tel,res:undefined};render(true);sb.rpc('verifier_numero',{tel}).then(r=>{ui.verif={tel,res:(r.data&&r.data[0])||(r.error?null:{bloque:false,signalements:0})};render(true);},()=>{ui.verif={tel,res:null};render(true);});},
  trackNum:d=>{sb.rpc('suivi_par_numero',{num:String(d.num||'').trim(),tel:String(d.tel||'').trim()}).then(r=>{if(r.data)location.hash='suivi-'+r.data;else toast('Commande introuvable. Vérifiez le numéro et le téléphone.');},()=>toast('Pas de connexion internet.'));},
  banner:d=>act(async()=>{const row={titre:String(d.titre).trim(),sous_titre:String(d.sous_titre||'').trim(),lien:String(d.lien||'').trim(),shop_id:d.shop_id||null,debut:d.debut||today(),fin:d.fin||null,couleur:Math.floor(Math.random()*6),actif:true};
    if(ui.bannerImg)row.image=await uploadPhoto(ui.bannerImg.blob);await q(sb.from('banners').insert(row));ui.bannerImg=undefined;},'Bannière publiée'),
  blacklist:d=>act(async()=>{const ph=waNum(d.phone);if(ph.length<12)throw new Error('Numéro invalide.');await q(sb.from('blacklist').upsert({phone:ph,motif:String(d.motif||'').trim()}));},'Numéro bloqué')
};
document.addEventListener('submit',e=>{
  const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();
  const d={};new FormData(f).forEach((v,k)=>d[k]=v);const fn=FORMS[f.dataset.f];if(fn)fn(d,f);
});
window.addEventListener('hashchange',()=>{ui.confirm=null;ui.suivi={};ui.mes=null;ui.taille=null;ui.type=null;ui.dl=undefined;document.getElementById('layer').innerHTML='';render();});
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'||ev==='TOKEN_REFRESHED')return;});
render();
function ping(){if(S.user&&!isAdmin()&&myShop()&&!document.hidden)sb.rpc('je_suis_la').then(()=>{},()=>{});}
setInterval(()=>{ping();if(document.hidden||!S.loaded)return;sb.from('shops').select('id,vu_le').then(r=>{if(r&&!r.error&&r.data)r.data.forEach(x=>{const s=shopById(x.id);if(s)s.vu_le=x.vu_le;});},()=>{});},120000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping();});
window.GB={S:S,shopById:shopById,prodById:prodById,askAlerts:askAlerts};
loadAll().then(()=>render());
})();
