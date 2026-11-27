/* Gbairai : appli web (clients, vendeurs, administrateur) branchée sur Supabase. */
(function(){
'use strict';
const CFG=window.BOUTIK_CONFIG||{};
const app=document.getElementById('app');
if(!CFG.supabaseUrl||!CFG.supabaseAnonKey){
  app.innerHTML='<div class="wrap"><div class="card stack"><h1 style="font-size:20px">Configuration manquante</h1><p class="muted" style="margin:0">Remplissez config.js avec le Project URL et la clé anon de Supabase.</p></div></div>';
  return;
}
if(!window.supabase){
  /* La bibliothèque Supabase n'a pas pu venir du premier serveur (réseau lent ou bloqué) : on essaie d'autres serveurs, puis on relance l'appli */
  const SRC=['https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js','https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'];
  const n=window.__gbTry||0;
  if(n<SRC.length){
    window.__gbTry=n+1;
    app.innerHTML='<div class="loading">Chargement…</div>';
    const sc=document.createElement('script');sc.src=SRC[n];
    sc.onload=sc.onerror=()=>{const r=document.createElement('script');r.src='app.js?r='+(n+1);document.body.appendChild(r);};
    document.head.appendChild(sc);
  }else{
    app.innerHTML='<div class="wrap"><div class="card stack"><h1 style="font-size:20px">Connexion trop faible</h1><p class="muted" style="margin:0">Le site n\'a pas pu se charger complètement. Vérifiez votre connexion Internet, puis réessayez.</p><button type="button" class="btn btn-v btn-block" onclick="location.reload()">Réessayer</button></div></div>';
  }
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
const ui={aideQ:'',aidePub:null,aideOpen:null,tabHelp:false,aEditAide:null,story:null,pvSel:{},podium:{},fete:new URLSearchParams(location.search).get('fete'),recu:{},espace:{},rel:null,cli:null,nbAb:{},chat:{},vmsgs:{},conv:null,lit:null,gal:0,suivi:{},mes:null,fiab:{},verif:null,pay:{type:'pro',duree:1,op:''},extras:undefined,bannerImg:undefined,aPwd:null,pwdHelp:false,per:30,q:'',quartier:'Tous',cat:null,taille:null,vTab:'accueil',aTab:'tableau',edit:null,photo:undefined,adminShop:null,confirm:null,caissePeriode:'mois',aFilter:'tous',aQ:'',busy:false,authMode:'creer'};

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
const catName=id=>{if(id==='divers')return 'Divers';const c=CATS().find(c=>c.id===id);return c?c.nom:'Autre';};
const DIVERS_OPT='<option value="divers">🛍 Divers : je vends plusieurs sortes d\'articles</option>';
function shopRayons(s){const n={};shopProducts(s.id).filter(p=>p.visible!==false).forEach(p=>{if(p.categorie)n[p.categorie]=(n[p.categorie]||0)+1;});return Object.keys(n).sort((a,b)=>n[b]-n[a]);}
function shopRayonsLabel(s){const r=shopRayons(s);if(r.length>1)return r.slice(0,2).map(catName).join(', ')+(r.length>2?' +'+(r.length-2):'');if(r.length===1&&s.categorie==='divers')return 'Divers';return catName(r[0]||s.categorie);}
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
const baseUrl=()=>isLocal()?location.origin+location.pathname:location.origin+'/';
const recuUrl=id=>baseUrl()+'#recu-'+id;
const refUrl=(slug,c)=>isLocal()?baseUrl()+'?c='+encodeURIComponent(c)+'#boutique-'+slug:location.origin+'/b/'+encodeURIComponent(slug)+'?c='+encodeURIComponent(c);
const espaceUrl=sec=>baseUrl()+'#commercial-'+sec;
const PAYE=[['especes','Espèces'],['wave','Wave'],['orange','Orange Money'],['mtn','MTN MoMo'],['moov','Moov Money'],['credit','À crédit']];
const payeName=v=>(PAYE.find(x=>x[0]===v)||['',''])[1];
const recuNo=n=>String(n||0).padStart(5,'0');
const dfr=x=>{const d=new Date(x);return isNaN(d)?String(x||'').slice(0,10):d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});};
const moisFr=m=>{const a=m.split('-').map(Number);return new Date(a[0],a[1]-1,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});};
const addMonth=(m,k)=>{const a=m.split('-').map(Number),d=new Date(a[0],a[1]-1+k,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};
const sumT=a=>a.reduce((x,o)=>x+(o.total||o.montant||0),0);
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
    S.settings=st;S.settings.paiement=S.settings.paiement||{};S.shops=shops;S.products=prods;S.role='visiteur';S.orders=[];S.txs=[];S.priv={};S.payments=[];S.reports=[];S.blacklist=[];S.versements=[];S.commerciaux=[];
    const [rv,bn]=await Promise.all([safe(sb.from('reviews').select('*').order('created_at',{ascending:false}).limit(3000)),safe(sb.from('banners').select('*').order('ordre').order('created_at',{ascending:false}))]);
    S.reviews=rv;S.banners=bn;S.annonces=await safe(sb.from('annonces').select('*').order('created_at',{ascending:false}).limit(30));S.aide=await safe(sb.from('aide').select('*').order('ordre').order('created_at'));S.best={};(await safe(sb.rpc('meilleures_ventes'))).forEach(x=>{S.best[x.pid]=x.n;});S.points=await safe(sb.from('points_vente').select('*').order('created_at'));S.conf={};(await safe(sb.rpc('stats_confiance'))).forEach(x=>S.conf[x.shop_id]=x);
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
        const [vs_,cm_]=await Promise.all([safe(sb.from('versements').select('*').eq('shop_id',mine.id).order('date',{ascending:false})),safe(sb.from('commerciaux').select('*').eq('shop_id',mine.id).order('created_at'))]);S.versements=vs_;S.commerciaux=cm_;
        S.nbAb=await sb.rpc('nb_abonnes',{sid:mine.id}).then(r=>typeof r.data==='number'?r.data:0,()=>0);
        try{await loadConvs(mine.id);}catch(e){}
      }
    }
    if(window.GBX&&GBX.load)await GBX.load();
    S.error=null;
  }catch(e){S.error=errMsg(e);}
  S.loaded=true;
  ping();
  if(S.user)stCx();
  if(S.user&&!isAdmin())setTimeout(ogRefresh,3000);
  if(S.user&&!S.synced&&!S.syncing){S.syncing=true;clientSync().finally(()=>{S.syncing=false;});}
  if(!S.user){S.synced=false;S.cnom='';}
  cart=cart.filter(l=>prodById(l.pid));saveCart();
  document.title=S.settings.nom||'Gbairai Market';
}
/* ---------- STATISTIQUES : visites, recherches, clics, paniers, connexions (→ /api/stat) ---------- */
const STQ=[];let stT=null,stLastH=null,stQ='',stQT=null;
function stVid(){let v=lsGet('gbairai-vid','');if(!v||typeof v!=='string'){v=uuid().replace(/-/g,'').slice(0,20);lsSet('gbairai-vid',v);}return v;}
function st(k,o){if(k!=='connexion'&&k!=='echec'&&S.user&&isAdmin())return;STQ.push(Object.assign({k:k},o||{}));if(k==='connexion'||k==='echec'){clearTimeout(stT);stT=setTimeout(stFlush,50);}else if(!stT)stT=setTimeout(stFlush,4000);}
function stFlush(){clearTimeout(stT);stT=null;if(!STQ.length)return;const ev=STQ.splice(0,30),h={'Content-Type':'application/json'};if(S.token&&ev.some(e=>e.k==='connexion'))h.Authorization='Bearer '+S.token;
  try{fetch('/api/stat',{method:'POST',headers:h,body:JSON.stringify({v:stVid(),ev:ev}),keepalive:true}).catch(()=>{});}catch(e){}}
function stRouteShop(){const h=(location.hash||'').slice(1);if(h.startsWith('boutique-'))return S.shops.find(x=>x.slug===decodeURIComponent(h.slice(9)));if(h.startsWith('produit-')){const p=prodById(h.slice(8));return p?shopById(p.shop_id):null;}return null;}
function stPage(h){if(h===stLastH)return;stLastH=h;let s=null,p=null;
  if(h.startsWith('boutique-')){const x=stRouteShop();s=x?x.id:null;}else if(h.startsWith('produit-')){const x=prodById(h.slice(8));if(x){p=x.id;s=x.shop_id;}}
  st('page',{s:s,p:p});}
function stCx(){if(!S.user)return;const k=S.user.id+'|'+today();if(lsGet('gbairai-cx','')===k)return;lsSet('gbairai-cx',k);st('connexion');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stFlush();});
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const href=a.getAttribute('href')||'';if(!/(wa\.me|t\.me)\//.test(href))return;
  const s=(a.dataset.shop&&shopById(a.dataset.shop))||stRouteShop();if(!s)return;
  if(/wa\.me\//.test(href)){if(s.whatsapp&&href.indexOf('wa.me/'+waNum(s.whatsapp))>=0)st('wa',{s:s.id});}else if(s.telegram)st('tg',{s:s.id});},true);
/* ---------- Images d'aperçu des liens partagés (dessinées ici, rangées par /api/og) ---------- */
let ogBusy=false;
function ogHash(o){const t=JSON.stringify(o);let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return String(h);}
async function ogRefresh(){if(ogBusy||!S.user||!S.token||!window.GbStatut||!GbStatut.ogShop)return;const s=myShop();if(!s||s.statut!=='actif')return;ogBusy=true;
  try{const done=lsGet('gbairai-og',{}),ps=shopProducts(s.id).filter(p=>p.visible&&p.stock>0).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    const rv=(S.reviews||[]).filter(r=>r.shop_id===s.id&&r.visible!==false),note=rv.length?rv.reduce((a,r)=>a+n0(r.note),0)/rv.length:0;
    const top=ps.filter(p=>p.photo).concat(ps.filter(p=>!p.photo)).slice(0,3),base=[s.nom,s.logo,s.verification,s.quartier,s.ville,s.livraison_zones,S.settings.nom],jobs=[];
    const hs=ogHash([base,s.description,top.map(p=>[p.id,p.nom,p.prix,p.prix_barre,p.photo]),Math.round(note*10),rv.length,ps.length>3?ps.length:0]);
    if(done[s.id]!==hs)jobs.push(['shop',s.id,hs,()=>GbStatut.ogShop({s:s,prods:top,total:ps.length,note:note,nbAvis:rv.length,brand:S.settings.nom})]);
    ps.forEach(p=>{const h=ogHash([base,p.nom,p.prix,p.prix_barre,p.photo,p.tailles,p.stock<=3?p.stock:9]);if(done[p.id]!==h)jobs.push(['product',p.id,h,()=>GbStatut.ogProduct({p:p,s:s,brand:S.settings.nom})]);});
    for(const j of jobs.slice(0,8)){if(document.hidden)break;const data=await j[3]();
      const r=await fetch('/api/og',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({kind:j[0],id:j[1],data:data})});
      const ok=await r.json().catch(()=>({}));if(!r.ok||!ok.ok)break;done[j[1]]=j[2];lsSet('gbairai-og',done);}
  }catch(e){}finally{ogBusy=false;}}
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
  await sb.rpc('push_save',{ep:j.endpoint,k:j.keys.p256dh,a:j.keys.auth,sh:follows.filter(isUuid).slice(0,200),ord:myOrders.map(o=>o.id).filter(isUuid).slice(0,50),cv:Object.values(convMap).filter(isUuid).slice(0,50)});if(isAdmin())sb.rpc('push_admin',{ep:j.endpoint}).then(()=>{},()=>{});}catch(e){}}
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
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Mon compte</h1></div>'+prefsHTML()+'<a class="btn btn-w btn-block" href="#aide">💡 Aide : comment ça marche ?</a><a class="btn btn-w btn-block" href="#reglement">⚖️ Règlement intérieur</a>';
  if(!S.user){const t=ui.cTab||'creer';
    return h+'<section class="hero"><span class="ball o" style="right:-46px;top:-46px;width:100px;height:100px"></span><h2 style="color:#fff;font-size:22px;margin:0">Votre compte Gbairai</h2><p style="margin:6px 0 0">Gratuit. Retrouvez vos commandes, vos favoris et vos boutiques sur tous vos téléphones.</p></section>'+
    '<div class="seg2">'+[['creer','Créer mon compte'],['login','Me connecter']].map(x=>'<button type="button" class="chip'+(t===x[0]?' on':'')+'" data-a="cTab" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
    (t==='creer'?'<form class="card stack" data-f="csignup"><label class="lbl">Votre nom<input class="in" name="nom" required maxlength="80" autocomplete="name" value="'+esc(client.nom||'')+'" placeholder="Ex. : Fatou K."></label><label class="lbl">Numéro de téléphone<input class="in" name="phone" type="tel" required autocomplete="tel" value="'+esc(client.tel||'')+'" placeholder="07 XX XX XX XX"></label><label class="lbl">Mot de passe (6 caractères minimum)<input class="in" name="password" type="password" required minlength="6" autocomplete="new-password"></label><p class="small muted" style="margin:0">En créant un compte, vous acceptez le <a href="#reglement">règlement intérieur</a>.</p><button class="btn btn-v btn-block" type="submit">Créer mon compte</button><p class="small muted" style="margin:0">Pas de SMS, pas d\'e-mail : seulement votre numéro et un mot de passe.</p></form>'
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
  storiesHTML()+annonceHTML('clients')+feteHTML()+'<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:140px;height:140px"></span><span class="ball g" style="right:70px;top:70px;width:38px;height:38px"></span><h1>Toutes les boutiques de Côte d\'Ivoire, au même endroit</h1><p>Choisissez, puis commandez directement sur WhatsApp</p>'+
  '<label class="search">'+ic('search',20,'#6B5B8C')+'<span hidden>Rechercher</span><input id="q" type="search" placeholder="Robe, sneakers, iPhone, boutique…" value="'+esc(ui.q)+'" data-i="q"></label>'+(window.GBX&&GBX.homeSearch?GBX.homeSearch():'')+'</section>'+(window.GBX&&GBX.home?GBX.home():'')+
  '<div class="chips">'+['Tous'].concat(qs).map(x=>'<button type="button" class="chip'+(ui.quartier===x?' on':'')+'" data-a="quartier" data-id="'+esc(x)+'">'+(x==='Tous'?'Toute la Côte d\'Ivoire':esc(x)+(cnt[x]?' <small>'+cnt[x]+'</small>':''))+'</button>').join('')+'</div>'+
  bannersHTML()+homeTicker()+mesBoutiquesHTML()+rayonsHTML()+promoAppHTML()+'<a class="safebar aidebar" href="#aide"><span style="font-size:20px">💡</span><span><b>Comment ça marche ?</b><small>Guides et vidéos pour bien utiliser l\'appli</small></span>'+ic('back',16,'#5B21B6')+'</a><a class="safebar" href="#verifier">'+ic('shield',20,'#0E7A5F')+'<span><b>Achetez en sécurité</b><small>Vérifiez un numéro avant de payer</small></span>'+ic('back',16,'#0E7A5F')+'</a>'+flashHTML()+'<div id="results" class="stack">'+results()+'</div></div>';
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
  ui.qN=shops.length+prods.length;
  let h='<div class="sec-title"><h2>Boutiques</h2><span class="cnt-pill">'+shops.length+'</span></div>';
  h+=shops.length?'<div class="shops">'+shops.map(shopCard).join('')+'</div>':'<p class="muted">Aucune boutique pour l\'instant.'+(S.shops.length?'':' <a href="#vendeur">Créez la première !</a>')+'</p>';
  h+='<div class="sec-title"><h2>Produits</h2><span class="cnt-pill">'+prods.length+'</span></div>';
  h+=prods.length?'<div class="pgrid">'+prods.map(pCard).join('')+'</div>':'<p class="muted">Aucun produit trouvé.</p>';
  return h;
}
function shopCard(s){const n=shopProducts(s.id).filter(p=>p.visible).length;
  return '<a class="shop" href="#boutique-'+esc(s.slug)+'"><div class="shop-cover" style="background:'+coverBg(s)+'">'+avatar(s)+(s.vedette?'<span class="badge b-orange" style="position:absolute;right:10px;top:10px">Vedette</span>':'')+'</div><div class="shop-body"><div class="shop-name">'+esc(s.nom)+verifBadge(s)+'</div>'+(enLigne(s)?'<span class="pres on">En ligne</span>':'')+'<div class="muted small" style="margin-top:4px">'+esc(place(s))+' · '+esc(shopRayonsLabel(s))+' · '+n+' produit'+(n>1?'s':'')+'</div>'+ratingHTML(s.id,true)+'</div></a>';}
function pCard(p){const inCart=cart.some(l=>l.pid===p.id),pr=promoOn(p);
  return '<div class="pcard"><div class="ptile"><a href="#produit-'+p.id+'">'+tile(p,120)+'</a>'+(pr?'<span class="pct">-'+pct(p)+' %</span>':'')+pBadge(p)+(pr&&p.promo_fin?'<span class="flash">'+ic('bolt',11,'#1B1033',2.4)+cdHTML(p.promo_fin)+'</span>':'')+favBtn(p.id)+'</div><a href="#produit-'+p.id+'"><div class="pname">'+esc(p.nom)+'</div></a><div class="pfoot"><span class="pp">'+priceHTML(p)+'</span>'+
  (p.stock>0?'<button type="button" class="add'+(inCart?' in':'')+'" data-a="add" data-id="'+p.id+'" aria-label="'+(inCart?'Déjà dans le panier':'Ajouter au panier')+'">'+ic(inCart?'check':'plus',18,'#fff',2.6)+'</button>':'<span class="badge b-grey">Rupture</span>')+'</div></div>';}
function favBtn(id,big){const on=isFav(id);return '<button type="button" class="fav'+(on?' on':'')+(big?' big':'')+'" data-a="fav" data-id="'+id+'" aria-label="'+(on?'Retirer des favoris':'Ajouter aux favoris')+'" aria-pressed="'+on+'">'+ic('heart',big?20:16,on?'#fff':'#9D174D',2.2)+'</button>';}
function bannersHTML(){const b=S.banners.filter(x=>x.actif&&String(x.debut||'')<=today()&&(!x.fin||x.fin>=today()));if(!b.length)return '';
  return '<div class="banners" id="banners">'+b.map(x=>{const s=x.shop_id&&shopById(x.shop_id);const href=x.lien||(s?'#boutique-'+s.slug:'#accueil');const ext=/^https?:/.test(href);
    return '<a class="banner" href="'+esc(href)+'"'+(ext?' target="_blank" rel="noopener"':'')+' style="background:'+(x.image?'#1B1033':lin(x.couleur))+'">'+(x.image?'<img src="'+esc(x.image)+'" alt="" loading="lazy">':'')+'<span class="bn-txt"><span class="bn-tag">'+ic('megaphone',12,'#1B1033',2.4)+'Sponsorisé</span><b>'+esc(x.titre)+'</b>'+(x.sous_titre?'<span>'+esc(x.sous_titre)+'</span>':'')+'</span></a>';}).join('')+'</div>'+(b.length>1?'<div class="bn-dots">'+b.map((x,i)=>'<i class="'+(i?'':'on')+'"></i>').join('')+'</div>':'');}
function flashHTML(){const ok=new Set(S.shops.filter(s=>s.statut==='actif').map(s=>s.id));
  const ps=S.products.filter(p=>p.visible&&p.stock>0&&ok.has(p.shop_id)&&promoOn(p)).sort((a,b)=>(a.promo_fin?0:1)-(b.promo_fin?0:1)||pct(b)-pct(a)).slice(0,12);
  if(!ps.length)return '';
  return '<section class="flashbox"><div class="row" style="gap:8px"><h2 class="row" style="gap:6px;font-size:18px">'+ic('bolt',20,'#FF7A1A',2.4)+'Promos et ventes flash</h2><span class="cnt-pill">'+ps.length+'</span></div><div class="hscroll">'+ps.map(pCard).join('')+'</div></section>';}
function clientsAgg(orders){const m={};orders.filter(o=>o.client_tel||o.client_nom).forEach(o=>{const k=o.client_tel?waNum(o.client_tel):'nom:'+String(o.client_nom).toLowerCase();
  const c=m[k]=m[k]||{nom:'',tel:o.client_tel||'',adresse:'',n:0,ok:0,total:0,first:o.created_at,last:o.created_at,shops:new Set()};c.n++;if(o.client_nom)c.nom=c.nom||o.client_nom;if(o.client_adresse)c.adresse=c.adresse||o.client_adresse;
  const sh=shopById(o.shop_id);if(sh)c.shops.add(sh.nom);if(o.statut==='confirmee'){c.ok++;c.total+=o.total||0;}if(String(o.created_at)>String(c.last))c.last=o.created_at;if(String(o.created_at)<String(c.first))c.first=o.created_at;});
  return Object.values(m).sort((a,b)=>b.total-a.total||b.n-a.n);}
function csvCell(v){let t=String(v==null?'':v);if(/^[=@\t\r]/.test(t)||/^[+-][^\d\s]/.test(t))t="'"+t;return /[;"\n\r]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;}
function downloadCSV(name,head,rows){const txt='﻿'+[head].concat(rows).map(r=>r.map(csvCell).join(';')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}
function clientsCSV(orders,withShop,file){const L=clientsAgg(orders);if(!L.length)return toast('Aucun client pour le moment');
  const head=['Nom','Téléphone','Adresse','Commandes','Achats confirmés','Total dépensé (FCFA)','Premier contact','Dernière commande'].concat(withShop?['Boutiques']:[]);
  downloadCSV(file+'-'+today()+'.csv',head,L.map(c=>[c.nom,String(c.tel||'').replace(/\D/g,'').replace(/(\d{2})(?=\d)/g,'$1 '),c.adresse,c.n,c.ok,c.total,String(c.first).slice(0,10),String(c.last).slice(0,10)].concat(withShop?[[...c.shops].join(', ')]:[])));
  toast(L.length+' client'+(L.length>1?'s':'')+' téléchargé'+(L.length>1?'s':''));}
function promoWaHTML(s){const n=waNum(s.whatsapp||'');if(n.length<11)return '';
  return '<a class="promowa" target="_blank" rel="noopener" href="https://wa.me/'+n+'?text='+encodeURIComponent('Bonjour '+s.nom+' 👋 Je veux recevoir vos nouveautés et promos sur WhatsApp. Mon nom : ')+'"><span class="pw-ic">📲</span><span><b>Recevoir les promos sur WhatsApp</b><small>Un message part chez la boutique : elle vous ajoute à sa liste.</small></span>'+ic('wa',20,'#0E7A5F')+'</a>';}
function promoAppHTML(){const n=waNum(S.settings.support_whatsapp||'');if(n.length<11||localStorage.getItem('gbairai-promo-vu'))return '';
  return '<div class="promowa"><span class="pw-ic">🎁</span><a target="_blank" rel="noopener" data-a="promoGo" href="https://wa.me/'+n+'?text='+encodeURIComponent('Bonjour '+(S.settings.nom||'Gbairai Market')+' 👋 Je veux recevoir les bons plans et les nouvelles boutiques sur WhatsApp. Ma ville : ')+'" style="flex:1;color:inherit"><b>Les bons plans sur WhatsApp</b><small>Laissez votre numéro : promos et nouvelles boutiques près de chez vous.</small></a><button type="button" class="linkbtn" data-a="promoVu" aria-label="Fermer">✕</button></div>';}
function vBoutique(slug){
  const s=S.shops.find(x=>x.slug===slug);
  if(s&&isFollow(s.id)&&ui.seenNow!==s.id){ui.seenNow=s.id;setTimeout(()=>{seen[s.id]=new Date().toISOString();lsSet('gbairai-vus',seen);},0);}
  if(!s||s.statut!=='actif')return '<div class="wrap">'+back('#accueil')+'<div class="card"><h2>Boutique introuvable</h2><p class="muted">Cette boutique n\'existe pas ou est suspendue.</p></div></div>';
  const allP=shopProducts(s.id).filter(p=>p.visible),ray=shopRayons(s),sr=ui.shopRay&&ui.shopRay.s===s.id&&ray.includes(ui.shopRay.c)?ui.shopRay.c:null;
  const prods=sr?allP.filter(p=>p.categorie===sr):allP;
  const rayChips=ray.length>1?'<div class="chips" style="margin:-4px 0 4px">'+'<button type="button" class="chip'+(!sr?' on':'')+'" data-a="shopRay" data-s="'+s.id+'" data-id="">Tout ('+allP.length+')</button>'+ray.map(c=>'<button type="button" class="chip'+(sr===c?' on':'')+'" data-a="shopRay" data-s="'+s.id+'" data-id="'+esc(c)+'">'+esc(catName(c))+' ('+allP.filter(p=>p.categorie===c).length+')</button>').join('')+'</div>':'';
  const lines=cart.filter(l=>{const p=prodById(l.pid);return p&&p.shop_id===s.id;});
  const tot=lines.reduce((a,l)=>a+prix(prodById(l.pid))*l.qty,0);
  return '<div class="wrap shopth" style="--shopc:'+pal(s.couleur)[1]+';--shopd:'+pal(s.couleur)[2]+'"><div class="cover" style="background:'+coverBg(s)+'"><span class="ball o" style="right:30px;top:40px;width:70px;height:70px;border-radius:22px;transform:rotate(18deg)"></span><div class="row between" style="padding:16px max(16px,env(safe-area-inset-left,0px))">'+back('#accueil')+'<button type="button" class="icon-btn" data-a="copy" data-text="'+esc(shopUrl(s))+'" aria-label="Copier le lien de la boutique">'+ic('share')+'</button></div></div>'+
  '<div class="card stack" style="margin-top:-70px;position:relative"><div class="row">'+avatar(s,64)+'<div style="min-width:0"><h1 class="row" style="font-size:19px;gap:6px">'+esc(s.nom)+verifBadge(s)+'</h1><div class="muted small row" style="gap:4px;margin-top:3px">'+ic('pin',14)+esc(place(s))+(s.adresse?', '+esc(s.adresse):'')+'</div>'+presenceHTML(s)+ratingHTML(s.id)+'</div></div>'+
  (s.description?'<p style="margin:0;font-size:14px;line-height:1.5;color:#3D3256">'+esc(s.description)+'</p>':'')+
  (s.livraison_zones?'<div class="small muted">Livraison : '+esc(s.livraison_zones)+(s.livraison_frais?' · '+esc(s.livraison_frais)+' F':'')+'</div>':'')+
  '<div class="grid2"><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'">'+ic('wa',18,'#fff')+'WhatsApp</a>'+(s.telegram?'<a class="btn btn-t btn-s" target="_blank" rel="noopener" href="https://t.me/'+esc(s.telegram.replace(/^@/,''))+'">'+ic('tg',18,'#1E4FA8')+'Telegram</a>':'<button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(shopUrl(s))+'">'+ic('link',16)+'Copier le lien</button>')+'</div><a class="btn btn-v btn-s btn-block" href="#chat-'+s.id+'">💬 Discuter ici avec la boutique</a>'+followHTML(s)+'</div>'+
  trustHTML(s)+
  (window.GBX&&GBX.boutique?GBX.boutique(s):'')+
  '<div class="sec-title"><h2>Produits</h2><span class="cnt-pill">'+allP.length+'</span></div>'+rayChips+
  (prods.length?'<div class="pgrid">'+prods.map(pCard).join('')+'</div>':'<p class="muted">Cette boutique n\'a pas encore de produits.</p>')+
  (lines.length?'<a class="btn btn-v btn-block" href="#panier" style="justify-content:space-between"><span>'+lines.reduce((a,l)=>a+l.qty,0)+' article(s) · <span class="num">'+fmtN(tot)+' FCFA</span></span><span>Voir le panier</span></a>':'')+
  promoWaHTML(s)+pointsHTML(s)+reviewsHTML(s)+tipsHTML()+'<button type="button" class="linkbtn" data-a="report" data-id="'+s.id+'">'+ic('flag',14)+'Signaler cette boutique</button>'+alsoHTML(s)+'</div>';
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
  return 'Bonjour '+s.nom+', je veux commander :\n'+lines.map(l=>'• '+l.qty+' × '+l.p.nom+(l.taille?' ('+l.taille+')':'')+' – '+F(prix(l.p)*l.qty)).join('\n')+'\nTotal : '+fmtN(tot)+' FCFA'+(window.GBX&&GBX.codeLine?GBX.codeLine(s,tot):'')+(c.length?'\n\n👤 '+c.join(' · '):'')+'\n\n📦 Commande n° '+String(id).slice(0,8).toUpperCase()+'\nSuivi : '+trackUrl(id)+'\nVu sur '+(S.settings.nom||'Gbairai Market');}
function vProduit(id){
  const p=prodById(id);const s=p&&shopById(p.shop_id);
  if(!p||!s||!p.visible)return '<div class="wrap">'+back('#accueil')+'<div class="card"><h2>Produit introuvable</h2></div></div>';
  const tailles=(p.tailles||'').split(',').map(t=>t.trim()).filter(Boolean);
  if(tailles.length&&!tailles.includes(ui.taille))ui.taille=tailles[0];if(!tailles.length)ui.taille=null;
  const single=[{p,qty:1,taille:ui.taille}],sid=oid('p-'+p.id),ph=photosOf(p);
  return '<div class="wrap"><div class="row between">'+back('#boutique-'+esc(s.slug),'Retour à la boutique')+'<div class="row" style="gap:8px"><a class="icon-btn" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(prodShareText(p))+'" aria-label="Partager ce produit sur WhatsApp">'+ic('share')+'</a><button type="button" class="icon-btn" data-a="share" data-id="'+p.id+'" aria-label="Image pour le statut">'+ic('image')+'</button>'+favBtn(p.id,true)+'</div></div>'+
  '<div class="galwrap">'+(ph.length?'<button type="button" class="zoombtn" data-a="zoom" data-pid="'+p.id+'">🔍 Zoom</button>':'')+(ph.length>1?'<div class="gal" id="gal">'+ph.map((u,i)=>'<img data-a="zoom" data-pid="'+p.id+'" data-i="'+i+'" src="'+esc(u)+'" alt="Photo '+(i+1)+' de '+esc(p.nom)+'" loading="'+(i?'lazy':'eager')+'">').join('')+'</div><div class="gal-dots">'+ph.map((u,i)=>'<button type="button" class="'+(i?'':'on')+'" data-a="galGo" data-i="'+i+'" aria-label="Photo '+(i+1)+'"></button>').join('')+'</div>':tile(p,320,140))+
  (promoOn(p)?'<span class="pct big">-'+pct(p)+' %</span>':'')+'</div>'+
  (promoOn(p)&&p.promo_fin?'<div class="flashbar">'+ic('bolt',18,'#1B1033',2.4)+'<b>Vente flash</b> · se termine dans '+cdHTML(p.promo_fin)+'</div>':'')+
  '<div class="card stack"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><h1 style="font-size:21px">'+esc(p.nom)+'</h1><a class="small" href="#boutique-'+esc(s.slug)+'">'+esc(s.nom)+' · '+esc(place(s))+'</a></div><div class="pp big" style="white-space:nowrap;text-align:right">'+priceHTML(p)+'</div></div>'+
  (p.description?'<div><h2 style="font-size:13px;font-family:var(--body);font-weight:700;margin-bottom:6px">Description</h2><p style="margin:0;line-height:1.55;color:#3D3256;white-space:pre-line">'+esc(p.description)+'</p></div>':'')+
  (tailles.length?'<div><h2 style="font-size:13px;font-family:var(--body);font-weight:700;margin-bottom:8px">Taille</h2><div class="row wrapx">'+tailles.map(t=>'<button type="button" class="chip'+(ui.taille===t?' on':'')+'" data-a="taille" data-id="'+esc(t)+'" style="min-width:48px;height:44px">'+esc(t)+'</button>').join('')+'</div></div>':'')+
  '<div class="row wrapx">'+(p.stock>0?'<span class="badge b-green">En stock</span>':'<span class="badge b-grey">Rupture de stock</span>')+(p.stock>0&&p.stock<=3?'<span class="badge b-orange">Plus que '+p.stock+'</span>':'')+'<a class="badge b-violet" href="#rayon-'+esc(p.categorie||'autre')+'">'+esc(catName(p.categorie))+(p.type?' · '+esc(p.type):'')+'</a></div></div>'+
  (window.GBX&&GBX.produit?GBX.produit(p,s):'')+
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
    (window.GBX&&GBX.panier?GBX.panier(s,tot):'')+'<div class="small muted" style="font-weight:700;letter-spacing:.4px">MESSAGE ENVOYÉ AU VENDEUR</div><div class="msg" data-msg="'+s.id+'">'+esc(txt)+'</div>'+
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
  if(d.statut==='confirmee')h+='<a class="btn btn-w btn-block" href="#recu-'+esc(id)+'">🧾 Voir mon reçu</a>';
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
/* Fond de connexion : carrousel 3D des rayons qui tourne derrière le formulaire */
function a3dBg(){
  const R=[['mode','Mode'],['sacs','Sacs'],['chaussures','Chaussures'],['tel','Téléphones'],['beaute','Beauté'],['bijoux','Bijoux'],['montres','Montres'],['electronique','Électronique']];
  return '<div class="a3d-bg" aria-hidden="true"><span class="a3d-orb o1"></span><span class="a3d-orb o2"></span><div class="a3d-stage"><div class="a3d-floor"></div><div class="a3d-ring">'+
    R.map((r,i)=>'<div class="a3d-ph" style="--i:'+i+';background-image:url(icons/rayons/'+r[0]+'.jpg)"><b>'+r[1]+'</b></div>').join('')+'</div></div></div>';
}
function authForms(title,intro,allowCreate){
  const cats=DIVERS_OPT+CATS().map(c=>'<option value="'+esc(c.id)+'">'+esc(c.nom)+'</option>').join('');
  const creer=allowCreate&&ui.authMode==='creer';
  return '<div class="wrap auth3d">'+a3dBg()+logoHTML()+'<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:120px;height:120px"></span><h1>'+title+'</h1><p>'+intro+'</p></section>'+
  (allowCreate?'<div class="tabs"><button type="button" class="tab'+(creer?' on':'')+'" data-a="authMode" data-id="creer">Créer ma boutique</button><button type="button" class="tab'+(!creer?' on':'')+'" data-a="authMode" data-id="connexion">Me connecter</button></div>':'')+
  (creer?'<form class="card stack" data-f="signup"><label class="lbl">Nom de la boutique<input class="in" id="c-nom" name="nom" required maxlength="60" placeholder="Ex. : Awa Mode"></label>'+
  '<label class="lbl">Numéro WhatsApp<input class="in" id="c-wa" name="phone" type="tel" required placeholder="07 XX XX XX XX"></label>'+
  '<label class="lbl">Mot de passe (6 caractères minimum)<input class="in" id="c-pw" name="password" type="password" required minlength="6" autocomplete="new-password"></label>'+
  locFields('c')+'<label class="lbl">Catégorie<select class="in" id="c-c" name="categorie">'+cats+'</select></label>'+
  '<label class="regok"><input type="checkbox" name="regle" required><span>J\'accepte le <a href="#reglement" target="_blank">règlement intérieur</a> de la plateforme.</span></label><button class="btn btn-v btn-block" type="submit">Créer ma boutique</button><p class="small muted" style="margin:0">Gratuit jusqu\'à '+S.settings.limite_gratuit+' produits.</p></form>'
  :'<form class="card stack" data-f="login"><label class="lbl">Numéro WhatsApp<input class="in" id="l-wa" name="phone" type="tel" required placeholder="07 XX XX XX XX" autocomplete="username"></label><label class="lbl">Mot de passe<input class="in" id="l-pw" name="password" type="password" required autocomplete="current-password"></label><button class="btn btn-v btn-block" type="submit">Me connecter</button><button type="button" class="linkbtn" data-a="pwdHelp">'+ic('key',14)+'Mot de passe oublié ?</button>'+
  (ui.pwdHelp?'<div class="note stack" style="gap:8px"><span>Écrivez au support '+esc(S.settings.nom||'Gbairai Market')+' depuis votre numéro WhatsApp. Après vérification, vous recevez un nouveau mot de passe.</span>'+(S.settings.support_whatsapp?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(S.settings.support_whatsapp)+'?text='+encodeURIComponent('Bonjour, j\'ai oublié le mot de passe de ma boutique sur '+(S.settings.nom||'Gbairai Market')+'. Mon numéro : ')+'">'+ic('wa',16,'#fff')+'Écrire au support</a>':'<span class="small muted">Le numéro du support sera bientôt affiché ici.</span>')+'</div>':'')+'</form>')+'</div>';
}

/* ---------- VENDEUR ---------- */
function vVendeur(){
  if(!S.user)return authForms('Votre boutique en ligne, gratuite','Un lien à partager sur vos statuts WhatsApp, TikTok et Facebook.',true);
  const s=myShop();
  if(!s)return '<div class="wrap">'+logoHTML()+(isAdmin()?'<div class="note">Vous êtes connecté en administrateur. <a href="#admin">Aller à l\'administration</a></div>':'')+'<form class="card stack" data-f="newshop"><h1 style="font-size:19px">Créer ma boutique</h1><label class="lbl">Nom de la boutique<input class="in" id="n-nom" name="nom" required></label><label class="lbl">Numéro WhatsApp<input class="in" id="n-wa" name="phone" type="tel" required value="'+esc((S.user.user_metadata||{}).phone||'')+'"></label>'+locFields('n')+'<label class="lbl">Catégorie<select class="in" id="n-c" name="categorie">'+CATS().map(c=>'<option value="'+esc(c.id)+'">'+esc(c.nom)+'</option>').join('')+'</select></label><button class="btn btn-v btn-block" type="submit">Créer</button></form><button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button></div>';
  const tabs=[['accueil','Accueil'],['messages','Messages'],['produits','Produits'],['commandes','Commandes'],['clients','Clients'],['stock','Stock'],['caisse','Caisse'],['equipe','Équipe'],['abonnement','Abonnement'],['reglages','Réglages']];if(window.GBX&&GBX.vendeur)tabs.splice(1,0,['plus','✨ Outils magiques']);
  const pending=S.orders.filter(o=>o.shop_id===s.id&&o.statut==='envoyee').length;
  const f={messages:vvMessages,accueil:vvAccueil,produits:vvProduits,stock:vvStock,caisse:vvCaisse,commandes:vvCommandes,clients:vvClients,equipe:vvEquipe,abonnement:vvAbonnement,reglages:vvReglages,plus:s=>GBX.vendeur(s)}[ui.vTab]||vvAccueil;
  return '<div class="wrap"><div class="row between"><div class="row">'+avatar(s,44)+'<div><h1 style="font-size:19px">'+esc(s.nom)+'</h1><div class="small" style="color:'+(s.statut==='actif'?'var(--green)':'#9A3412')+';font-weight:600">'+(s.statut==='actif'?'Boutique en ligne':'Boutique suspendue')+'</div></div></div><span class="row" style="gap:8px"><button type="button" class="helpbtn" data-a="tabHelp" aria-label="Aide sur cet écran">?</button><a class="btn btn-w btn-s" href="#boutique-'+esc(s.slug)+'">Voir ma page</a></span></div>'+
  '<div class="tabs" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" class="tab'+(ui.vTab===t[0]?' on':'')+'" data-a="vtab" data-id="'+t[0]+'">'+t[1]+(t[0]==='commandes'&&pending?' <span class="badge b-orange">'+pending+'</span>':'')+(t[0]==='messages'&&unreadV()?' <span class="badge b-orange">'+unreadV()+'</span>':'')+'</button>').join('')+'</div>'+(ui.tabHelp?tabHelpHTML(ui.vTab):'')+f(s)+'</div>';
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
  return annonceHTML('vendeurs')+premiersPas(s)+dash+'<div class="grid3"><div class="stat dark"><b class="num">'+prods.length+(isFinite(lim)?'<small style="font-size:12px;opacity:.8">/'+lim+'</small>':'')+'</b><span>Produits</span></div><div class="stat"><b class="num">'+S.orders.filter(o=>o.shop_id===s.id).length+'</b><span>Commandes</span></div><div class="stat"><b class="num" style="font-size:16px">'+fmtN(rec-dep)+'</b><span>Bénéfice du mois</span></div></div>'+
  (s.verification!=='verifie'?'<div class="warn"><b>'+(s.verification==='refuse'?'Vérification refusée.':'Vérification en attente.')+'</b> '+(s.verification==='refuse'&&s.motif_refus?esc(s.motif_refus)+' ':'')+'Faites vérifier votre boutique dans « Réglages » (pièce + photo). Le badge rassure les clients.</div>':'<div class="note">Votre boutique est vérifiée '+VERIF+'</div>')+
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
const SR_API=window.SpeechRecognition||window.webkitSpeechRecognition;let voixRec=null;
function voixHTML(){if(!SR_API||!window.GbVoix)return '';const on=!!voixRec;
  return '<div class="voix'+(on?' on':'')+'"><button type="button" class="micbtn" data-a="voix" aria-label="'+(on?'J\'ai fini de parler':'Dire mon produit au micro')+'"><span>'+(on?'⏹':'🎤')+'</span></button><div class="voix-t"><b>'+(on?'Je vous écoute… touchez quand c\'est fini':'Dites votre produit')+'</b><span id="voix-txt" class="small">'+(on?'…':'Ex. : « Robe rouge en wax, 8 000 francs, taille M et L, il en reste 3 »')+'</span></div></div>';}
function voixFill(text){const f=document.querySelector('form[data-f="produit"]');if(!f||!text)return 0;const r=GbVoix.parse(text);let n=0;
  const set=(id,v)=>{const el=document.getElementById(id);if(el&&v!=null&&v!==''){el.value=v;el.classList.add('voixok');n++;}};
  if(r.categorie&&CATS().some(c=>c.id===r.categorie)){const rb=f.querySelector('input[name="categorie"][value="'+r.categorie+'"]');if(rb){rb.checked=true;document.querySelectorAll('.rpick .rayon').forEach(l=>l.classList.toggle('on',l.contains(rb)));const ft=document.getElementById('f-type');if(ft){ft.innerHTML=typeOpts(r.categorie,r.type||'');ft.value=r.type||'';ft.classList.add('voixok');}n++;rb.closest('.rayon').scrollIntoView({block:'nearest',inline:'center'});}}
  set('f-nom',r.nom);set('f-prix',r.prix);set('f-stock',r.stock);set('f-tailles',r.tailles);
  if(r.prix_barre){set('f-barre',r.prix_barre);const d=f.querySelector('.promo-box');if(d)d.open=true;}
  const de=document.getElementById('f-desc');if(de&&!de.value.trim())set('f-desc',r.description);
  return n;}
function voixStart(){if(voixRec)return voixStop();let fin='',tmp='';
  try{voixRec=new SR_API();}catch(e){voixRec=null;return toast('Le micro n\'est pas disponible sur ce téléphone');}
  voixRec.lang='fr-FR';voixRec.interimResults=true;voixRec.continuous=true;voixRec.maxAlternatives=1;
  const show=()=>{const el=document.getElementById('voix-txt');if(el)el.textContent='« '+(fin+' '+tmp).trim()+' »';};
  voixRec.onresult=e=>{tmp='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i][0].transcript;if(e.results[i].isFinal)fin+=' '+x;else tmp+=x;}show();};
  voixRec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')toast('Autorisez le micro pour cette appli, puis réessayez');else if(e.error==='no-speech')toast('Je n\'ai rien entendu. Parlez plus près du téléphone');else if(e.error==='network')toast('Il faut internet pour la dictée');};
  voixRec.onend=()=>{const text=(fin+' '+tmp).trim();voixRec=null;keepForm();const bx=document.querySelector('.voix');if(bx){bx.outerHTML=voixHTML();}
    if(text){const n=voixFill(text);const el=document.getElementById('voix-txt');if(el)el.textContent='« '+text+' »';if(window.GBX&&GBX.voixIA&&n<3)GBX.voixIA(text);else toast(n?'✨ Fiche remplie : vérifiez puis enregistrez':'Je n\'ai pas compris. Dites le nom et le prix');}};
  try{voixRec.start();}catch(e){voixRec=null;return toast('Le micro n\'a pas pu démarrer');}
  const bx=document.querySelector('.voix');if(bx)bx.outerHTML=voixHTML();}
function voixStop(){if(voixRec)try{voixRec.stop();}catch(e){}}
function productForm(s){
  const p=ui.edit==='new'?{nom:'',description:'',prix:'',categorie:s.categorie==='divers'?(lsGet('gbairai-dernier-rayon','')||(shopRayons(s)[0]||'')):s.categorie,tailles:'',stock:1,visible:true,photo:null,couleur:ui.newColor}:prodById(ui.edit);
  if(!p){ui.edit=null;return vvProduits(s);}
  const photoPreview=ui.photo!==undefined?(ui.photo?ui.photo.url:null):p.photo;
  if(ui.extras===undefined)ui.extras=(p.photos||[]).map(u=>({url:u}));
  const pf=p.promo_fin?new Date(p.promo_fin):null,pfv=pf?new Date(pf-pf.getTimezoneOffset()*6e4).toISOString().slice(0,16):'';
  const cs=CATS(),cur=(formCache&&formCache.categorie)||(cs.some(c=>c.id===p.categorie)?p.categorie:cs[0].id),curT=formCache?formCache.type:(p.type||'');
  const pick='<div class="stack" style="gap:6px"><span class="small" style="font-weight:700">1. Choisissez le type d\'article</span><div class="rpick">'+cs.map((c,i)=>'<label class="rayon'+(c.id===cur?' on':'')+'"><input type="radio" name="categorie" value="'+esc(c.id)+'"'+(c.id===cur?' checked':'')+'>'+rImg(c,i)+'<b>'+esc(c.nom)+'</b></label>').join('')+'</div></div>'+
    '<label class="lbl">2. Précisez<select class="in" id="f-type" name="type">'+typeOpts(cur,curT)+'</select></label>';
  const del=ui.edit!=='new'?(ui.confirm==='del-'+p.id?'<div class="warn row between wrapx">Supprimer ce produit ? <span class="row"><button type="button" class="btn btn-w btn-s" data-a="cancelConfirm">Non</button><button type="button" class="btn btn-o btn-s" data-a="delProd" data-id="'+p.id+'">Oui, supprimer</button></span></div>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="del-'+p.id+'">'+ic('trash',16)+'Supprimer ce produit</button>'):'';
  return '<form class="card stack" data-f="produit"><div class="row between"><h2 style="font-size:17px">'+(ui.edit==='new'?'Ajouter un produit':'Modifier le produit')+'</h2><button type="button" class="btn btn-w btn-s" data-a="cancelEdit">Annuler</button></div>'+(ui.edit==='new'?voixHTML():'')+(window.GBX&&GBX.formProduit?GBX.formProduit(p):'')+
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
  if(ui.rel)return vvReleve(s);
  const all=S.txs.filter(t=>t.shop_id===s.id);
  const tx=ui.caissePeriode==='mois'?all.filter(t=>monthOf(t.date)===monthOf(today())):ui.caissePeriode==='jour'?all.filter(t=>t.date===today()):all;
  const rec=tx.filter(t=>t.type==='recette').reduce((a,t)=>a+t.montant,0),dep=tx.filter(t=>t.type==='depense').reduce((a,t)=>a+t.montant,0);
  return '<div class="tabs">'+[['jour','Aujourd\'hui'],['mois','Ce mois'],['tout','Tout']].map(x=>'<button type="button" class="tab'+(ui.caissePeriode===x[0]?' on':'')+'" data-a="periode" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
  '<section class="hero"><span class="ball g" style="right:-24px;top:-24px;width:100px;height:100px"></span><p style="margin:0">Bénéfice</p><div class="num" style="position:relative;font-family:var(--display);font-weight:800;font-size:30px">'+(rec-dep>=0?'+':'−')+fmtN(Math.abs(rec-dep))+' F</div><div class="grid2" style="position:relative;margin-top:12px"><div style="padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.14)"><div class="small" style="color:#E9DDFF">Recettes</div><b class="num" style="font-family:var(--display);color:#A7F3D0">'+F(rec)+'</b></div><div style="padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.14)"><div class="small" style="color:#E9DDFF">Dépenses</div><b class="num" style="font-family:var(--display);color:#FFD4A8">'+F(dep)+'</b></div></div></section>'+
  '<button type="button" class="btn btn-v btn-block" data-a="releve" data-id="'+monthOf(today())+'">📄 Relevé du mois (PDF, WhatsApp)</button>'+
  '<form class="card stack" data-f="tx"><h2 style="font-size:16px">Ajouter un mouvement</h2><div class="grid2"><label class="lbl">Type<select class="in" id="t-type" name="type"><option value="recette">Recette (entrée)</option><option value="depense">Dépense (sortie)</option></select></label><label class="lbl">Montant (FCFA)<input class="in" id="t-mt" name="montant" inputmode="numeric" required placeholder="5000"></label></div><label class="lbl">Libellé<input class="in" id="t-lib" name="libelle" required placeholder="Ex. : achat tissu, transport, vente…"></label><label class="lbl">Date<input class="in" id="t-date" name="date" type="date" value="'+today()+'"></label><button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>'+
  '<div class="small muted" style="font-weight:700;letter-spacing:.4px">MOUVEMENTS</div>'+
  (tx.length?'<div class="card" style="padding:4px 14px">'+tx.map((t,i)=>'<div class="row" style="padding:10px 0;'+(i?'border-top:1px solid #F0EAFB':'')+'"><span style="width:36px;height:36px;flex-shrink:0;border-radius:12px;display:grid;place-items:center;background:'+(t.type==='recette'?'var(--green-soft)':'var(--orange-soft)')+'"><b style="color:'+(t.type==='recette'?'var(--green)':'#9A3412')+'">'+(t.type==='recette'?'+':'−')+'</b></span><span style="flex:1;min-width:0"><span class="ell" style="display:block;font-weight:600;font-size:13px">'+esc(t.libelle)+'</span><span class="small muted">'+esc(t.date)+'</span></span><b class="num" style="color:'+(t.type==='recette'?'var(--green)':'#9A3412')+'">'+(t.type==='recette'?'+':'−')+fmtN(t.montant)+'</b><button type="button" class="icon-btn" style="width:34px;height:34px;box-shadow:none;background:var(--soft)" data-a="delTx" data-id="'+t.id+'" aria-label="Supprimer">'+ic('trash',14,'#5E5276')+'</button></div>').join('')+'</div>':'<div class="card muted">Aucun mouvement sur cette période.</div>');
}
function vvCommandes(s){
  const ords=S.orders.filter(o=>o.shop_id===s.id);
  const lab={envoyee:['Nouvelle','b-orange'],confirmee:['Vendue','b-green'],annulee:['Annulée','b-grey']};
  return '<div class="note">Chaque fois qu\'un client clique sur « Commander », la commande apparaît ici. Confirmez-la quand le client a payé : la recette s\'ajoute à la caisse et le stock baisse.</div>'+
  (ords.length?ords.map(o=>'<div class="card stack" style="gap:8px"><div class="row between"><b>Commande du '+esc(String(o.created_at).slice(0,10))+'</b><span class="badge '+lab[o.statut][1]+'">'+lab[o.statut][0]+'</span></div>'+(o.items||[]).map(it=>'<div class="row between small"><span>'+it.qty+' × '+esc(it.nom)+(it.taille?' ('+esc(it.taille)+')':'')+'</span><span class="num">'+F(it.prix*it.qty)+'</span></div>').join('')+'<div class="row between"><span class="muted small">Via '+(o.canal==='telegram'?'Telegram':'WhatsApp')+' · n° '+esc(String(o.id).slice(0,8).toUpperCase())+(o.commercial_code?' · 👤 '+esc(o.commercial_code):'')+'</span><b class="price num">'+fmtN(o.total)+' FCFA</b></div>'+
  (o.client_nom||o.client_tel||o.client_adresse?'<div class="clientbox small">'+ic('user',14,'#5B21B6')+'<span>'+esc([o.client_nom,o.client_tel,o.client_adresse].filter(Boolean).join(' · '))+'</span></div>':'')+
  (o.client_tel?fiabHTML(o.client_tel,s.id):'')+(o.statut==='confirmee'?recuBlock(o,s)+livBlock(o,s):'')+
  (o.statut==='envoyee'?'<div class="grid2"><button type="button" class="btn btn-g btn-s" data-a="confOrder" data-id="'+o.id+'">Confirmer la vente</button><button type="button" class="btn btn-w btn-s" data-a="cancelOrder" data-id="'+o.id+'">Annuler</button></div>':'')+'</div>').join(''):'<div class="card muted">Pas encore de commande. Partagez votre lien sur vos statuts.</div>');
}
/* ---------- ANNONCES DE L'ADMIN ---------- */
const CIBLES={tous:'Tout le monde',vendeurs:'Vendeurs',clients:'Clients'};
function annonceHTML(pour){const vu=lsGet('gbairai-ann-vu',[]),lim=Date.now()-7*864e5;
  const a=(S.annonces||[]).find(x=>(x.cible==='tous'||x.cible===pour)&&new Date(x.created_at).getTime()>lim&&!vu.includes(x.id));if(!a)return '';
  return '<section class="annonce"><div class="row between" style="align-items:flex-start"><span class="small" style="font-weight:800;letter-spacing:.4px">📣 ANNONCE · '+esc(S.settings.nom||'Gbairai Market')+'</span><button type="button" class="linkbtn" style="color:inherit" data-a="annVu" data-id="'+a.id+'" aria-label="Fermer">✕</button></div><b>'+esc(a.titre)+'</b>'+(a.texte?'<p>'+esc(a.texte)+'</p>':'')+(a.lien?'<a class="btn btn-w btn-s" href="'+esc(a.lien)+'" data-a="annVu" data-id="'+a.id+'">Voir ›</a>':'')+'</section>';}
function aAnnonces(){const L=S.annonces||[];
  return '<form class="card stack" data-f="annonce" style="max-width:640px"><h2 style="font-size:17px">📣 Envoyer une annonce</h2><p class="small muted" style="margin:0">Elle part en <b>notification</b> sur les téléphones qui ont activé les alertes, et elle s\'affiche aussi <b>dans l\'appli</b> pendant 7 jours pour tout le monde.</p>'+
  '<label class="lbl">Pour qui ?<div class="seg">'+Object.keys(CIBLES).map((k,i)=>'<label class="segr"><input type="radio" name="cible" value="'+k+'"'+(i?'':' checked')+'><span>'+CIBLES[k]+'</span></label>').join('')+'</div></label>'+
  '<label class="lbl">Titre<input class="in" name="titre" required maxlength="80" placeholder="Ex. : Nouveau : les reçus de vente !"></label><label class="lbl">Message<textarea class="in" name="texte" rows="3" maxlength="300" style="height:auto;padding:10px 14px" placeholder="Ex. : Envoyez un reçu à vos clients en 1 clic. Allez dans Commandes."></textarea></label>'+
  '<label class="lbl">Quand on touche la notification, ouvrir<select class="in" name="lien"><option value="#accueil">L\'accueil</option><option value="#aide">La page Aide</option><option value="#vendeur">La page vendeur</option><option value="#rayons">Les rayons</option></select></label>'+
  (ui.annRes?'<div class="good small">'+esc(ui.annRes)+'</div>':'')+'<button class="btn btn-v btn-block" type="submit">📣 Envoyer maintenant</button></form>'+
  '<div class="sec-title"><h2>Annonces envoyées</h2><span class="cnt-pill">'+L.length+'</span></div>'+(L.length?'<div class="card" style="padding:4px 14px">'+L.map(a=>'<div class="row between" style="padding:10px 0;border-top:1px solid var(--line);gap:10px"><span style="min-width:0"><b>'+esc(a.titre)+'</b><span class="small muted" style="display:block">'+esc(dfr(a.created_at))+' · '+esc(CIBLES[a.cible]||a.cible)+' · '+a.envoye+' notification'+(a.envoye>1?'s':'')+'</span></span><button type="button" class="btn btn-r btn-s" data-a="delAnn" data-id="'+a.id+'" aria-label="Supprimer">'+ic('trash',14)+'</button></div>').join('')+'</div>':'<div class="card muted" style="max-width:760px">Aucune annonce pour l\'instant.</div>');}
/* ---------- AIDE : page, visite guidée, bouton ?, premiers pas ---------- */
const TAB_HELP={accueil:['📊 Vos chiffres du jour et du mois.','🔔 Les messages et commandes à traiter.','✅ « Premiers pas » vous guide jusqu\'à la 1re vente.'],
  messages:['💬 Les questions des clients posées dans l\'appli.','✍️ Touchez une discussion pour répondre.','📱 Le client peut aussi vous écrire sur WhatsApp.'],
  produits:['➕ « Ajouter un produit » : photo, nom, prix.','✏️ Touchez un produit pour le modifier ou faire une promo.','🖼️ L\'icône image crée une image pour votre statut.'],
  commandes:['🟠 Les nouvelles commandes arrivent ici.','✅ « Confirmer la vente » quand le client a payé : caisse et stock se mettent à jour.','🧾 Choisissez le paiement puis « Envoyer le reçu ».'],
  clients:['👥 Les clients qui ont commandé chez vous.','📄 « Relevé du client » : ce qu\'il a acheté et ce qu\'il doit.','💬 Relancez-les sur WhatsApp quand vous avez des nouveautés.'],
  stock:['📦 Combien il reste de chaque article.','⚠️ En rouge : bientôt fini ou en rupture.','🔄 Le stock baisse tout seul à chaque vente confirmée.'],
  caisse:['💰 Chaque vente confirmée s\'ajoute toute seule ici.','🧾 Ajoutez vos dépenses pour voir votre vrai bénéfice.','📄 « Relevé du mois » fait un PDF à garder ou à envoyer.'],
  equipe:['📍 Vos magasins et stands : placez-les sur la carte.','👥 Vos commerciaux : chacun a son lien et sa commission.','🏆 Le podium du mois motive l\'équipe.'],
  abonnement:['⭐ Passez Pro pour des produits illimités.','📢 Mise en vedette et bannière pour être vu en premier.','💳 Payez par Mobile Money, l\'admin valide.'],
  reglages:['🎨 Couleur et couverture de votre boutique.','🌙 Mode sombre et petits sons.','🔑 Vos informations et votre mot de passe.']};
function tabHelpHTML(tab){const L=TAB_HELP[tab]||TAB_HELP.accueil;
  return '<div class="helpcard"><div class="row between"><b>💡 À quoi sert cet écran ?</b><button type="button" class="linkbtn" data-a="tabHelp" aria-label="Fermer">✕</button></div>'+L.map(x=>'<div class="small">'+esc(x)+'</div>').join('')+'<div class="row between"><a class="small" style="font-weight:700" href="#aide">Voir tous les guides ›</a><button type="button" class="linkbtn" data-a="tour" data-id="vendeur">▶ Revoir la visite</button></div></div>';}
function ytEmbed(u){const m=String(u).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);return m?'https://www.youtube-nocookie.com/embed/'+m[1]:null;}
const REGLEMENT_MAJ='22 novembre 2026';
const REGLEMENT=[['⚖️','1. Objet et lois de référence','<p>Gbairai Market est une plateforme en ligne qui permet aux vendeurs de Côte d\'Ivoire d\'ouvrir une boutique, de montrer leurs produits et de recevoir des commandes par WhatsApp, Telegram ou la discussion de l\'appli.</p><p>Gbairai Market met en relation les vendeurs et les clients. La plateforme n\'est pas le vendeur : chaque vente est conclue directement entre le vendeur et le client.</p><p>Ce règlement s\'appuie notamment sur :</p><ul><li>la loi n° 2013-546 du 30 juillet 2013 relative aux transactions électroniques ;</li><li>la loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel, sous le contrôle de l\'ARTCI ;</li><li>la loi n° 2013-451 du 19 juin 2013 relative à la lutte contre la cybercriminalité ;</li><li>la loi n° 2016-412 du 15 juin 2016 relative à la consommation ;</li><li>l\'Acte uniforme OHADA relatif au droit commercial général.</li></ul>'],['📖','2. Définitions et acceptation','<ul><li><b>Plateforme</b> : le site et l\'appli Gbairai Market.</li><li><b>Administrateur</b> : l\'équipe qui gère la plateforme.</li><li><b>Vendeur</b> : toute personne ou entreprise qui ouvre une boutique.</li><li><b>Client</b> : toute personne qui consulte les boutiques ou passe une commande.</li><li><b>Commercial</b> : une personne ajoutée par un vendeur pour vendre avec un lien personnel et toucher une commission.</li></ul><p>En créant un compte, en passant une commande ou en écrivant à une boutique, chacun accepte ce règlement. Celui qui n\'est pas d\'accord ne doit pas utiliser la plateforme.</p><p>Il faut avoir au moins 18 ans pour ouvrir une boutique. Un mineur ne peut vendre qu\'avec l\'accord d\'un parent ou d\'un tuteur.</p>'],['🏪','3. Inscription et compte vendeur','<ol><li>Le vendeur s\'inscrit avec son propre numéro de téléphone et un mot de passe. Il donne des informations vraies : nom de la boutique, numéro WhatsApp, ville et quartier.</li><li>Un même vendeur ne peut pas ouvrir plusieurs boutiques pour contourner une limite ou une sanction.</li><li>Le badge <b>Vendeur vérifié</b> est donné seulement après contrôle d\'une pièce d\'identité valide (CNI, passeport ou attestation d\'identité). L\'administrateur peut le refuser ou le retirer.</li><li>Le vendeur qui exerce une activité commerciale régulière respecte ses obligations légales (immatriculation au RCCM ou statut d\'entreprenant) et fiscales. Gbairai Market ne fait pas ces démarches à sa place.</li><li>Le vendeur garde son mot de passe secret. Toute action faite depuis son compte est considérée comme faite par lui. En cas de vol ou de perte du téléphone, il prévient tout de suite le support.</li><li>Le vendeur peut fermer sa boutique à tout moment en le demandant au support.</li></ol>'],['✅','4. Obligations des vendeurs','<ol><li><b>Produits réels</b> : le vendeur ne publie que des produits qu\'il possède ou peut vraiment livrer, avec de vraies photos.</li><li><b>Prix clairs</b> : les prix sont affichés en francs CFA (FCFA), toutes taxes comprises. Les frais de livraison sont indiqués avant la commande.</li><li><b>Description honnête</b> : taille, couleur, état (neuf ou occasion), origine. Une contrefaçon ne peut jamais être présentée comme un original.</li><li><b>Stock à jour</b> : un produit épuisé est mis en rupture ou retiré.</li><li><b>Réponse rapide</b> : le vendeur répond aux clients dans un délai raisonnable, si possible sous 24 heures.</li><li><b>Livraison</b> : le vendeur respecte le délai et le prix annoncés. Il ne demande le code de livraison à 4 chiffres qu\'au moment où le client a l\'article en main.</li><li><b>Reçu</b> : le vendeur remet un reçu au client qui le demande, grâce au reçu de l\'appli.</li><li><b>Promotions vraies</b> : un prix barré correspond à un prix vraiment pratiqué avant la promotion.</li><li><b>Commerciaux</b> : le vendeur paie les commissions promises à ses commerciaux. Gbairai Market n\'intervient pas dans ces paiements.</li></ol>'],['🚫','5. Produits et contenus interdits','<p>Il est interdit de vendre ou de publier :</p><ul><li>des armes, munitions, explosifs et feux d\'artifice non autorisés ;</li><li>de la drogue, des produits stupéfiants, et du tabac ou de l\'alcool vendus à des mineurs ;</li><li>des médicaments, sauf par une pharmacie autorisée ;</li><li>des produits de dépigmentation interdits ou dangereux pour la santé ;</li><li>des contrefaçons et des copies de marques ;</li><li>des objets volés ou d\'origine douteuse ;</li><li>des espèces animales protégées, de l\'ivoire ou des peaux d\'animaux sauvages ;</li><li>des faux documents, des cartes SIM enregistrées au nom d\'une autre personne, des comptes Mobile Money ;</li><li>des contenus pornographiques, violents, haineux ou qui insultent une ethnie, une religion ou une personne ;</li><li>des arnaques : faux concours, « argent rapide », ventes pyramidales.</li></ul><p>L\'administrateur peut retirer sans préavis tout produit ou contenu interdit, et le signaler aux autorités compétentes.</p>'],['🛍','6. Droits et obligations des clients','<ol><li>Le client a droit à une information claire sur le produit, son prix total et le délai de livraison avant de commander.</li><li>Le client donne un nom et un numéro vrais. Il ne passe pas de fausse commande et ne commande pas pour nuire à un vendeur.</li><li>Pour acheter en sécurité, le client préfère le paiement à la livraison, vérifie le numéro du vendeur dans « Achetez en sécurité », et ne donne son code de livraison qu\'avec l\'article en main.</li><li>Si l\'article reçu ne correspond pas à l\'annonce, est abîmé ou défectueux, le client contacte d\'abord le vendeur. Le vendeur propose un échange, une réparation ou un remboursement, comme le prévoit la loi sur la consommation.</li><li>Si le problème n\'est pas réglé sous 7 jours, le client peut signaler la boutique dans l\'appli ou écrire au support. L\'administrateur écoute les deux parties et peut prendre une sanction (article 11).</li><li>Le client reste poli avec le vendeur, dans la discussion comme à la livraison.</li></ol>'],['🚚','7. Commandes, paiements et livraison','<ol><li>Une commande passée sur la plateforme est envoyée au vendeur par WhatsApp, Telegram ou la discussion. La vente est conclue quand le vendeur confirme la commande.</li><li>Le paiement se fait directement entre le client et le vendeur : espèces, Wave, Orange Money, MTN MoMo, Moov Money ou crédit accordé par le vendeur. Gbairai Market ne reçoit pas l\'argent des ventes et ne le garde pas.</li><li>Le vendeur est seul responsable de la livraison, de la qualité du produit et du remboursement s\'il y a lieu.</li><li>Le suivi de commande, le code de livraison et le reçu sont des outils d\'aide. Ils servent de preuve en cas de désaccord.</li><li>Pour limiter les abus, la plateforme peut refuser des commandes trop nombreuses envoyées en peu de temps avec le même numéro.</li></ol>'],['⭐','8. Offres payantes : Pro, mise en avant, bannières','@OFFRES@<ol><li>Les prix sont affichés dans l\'appli en FCFA. L\'administrateur peut les changer. Le nouveau prix ne s\'applique qu\'aux paiements suivants.</li><li>Le vendeur paie par Mobile Money et donne la référence de la transaction. L\'offre commence quand l\'administrateur a validé le paiement, en général sous 24 heures.</li><li>Une offre payée n\'est pas remboursée une fois commencée, sauf si la plateforme ne l\'a pas fournie. Un paiement refusé ou en double est remboursé sur le même numéro.</li><li>Une fausse référence de paiement entraîne la suspension du compte.</li><li>Une boutique suspendue pour faute ne récupère pas le temps restant de son offre.</li></ol>'],['💬','9. Avis, discussions et signalements','<ol><li>Un avis raconte une vraie expérience d\'achat. Les faux avis, les avis achetés et les avis laissés par le vendeur sur sa propre boutique sont interdits.</li><li>Un avis peut critiquer, mais sans insulte, menace ou information privée. L\'administrateur peut masquer un avis qui ne respecte pas ces règles.</li><li>La discussion de l\'appli sert à parler d\'une commande ou d\'un produit. Les messages en masse, les menaces et les arnaques y sont interdits.</li><li>Une discussion reste privée entre le client et le vendeur. L\'administrateur ne la lit que si l\'un des deux la signale.</li><li>Tout le monde peut signaler une boutique, un produit ou une discussion. Un signalement mensonger fait exprès peut être sanctionné.</li></ol>'],['🔒','10. Données personnelles','<p>Gbairai Market collecte seulement les données utiles au service, et ne les vend jamais.</p><div class="regt"><table><thead><tr><th>Données</th><th>Pourquoi</th><th>Qui les voit</th></tr></thead><tbody><tr><td>Numéro de téléphone et mot de passe (chiffré)</td><td>Se connecter</td><td>Personne, sauf le titulaire</td></tr><tr><td>Nom, WhatsApp, ville, quartier de la boutique</td><td>Montrer la boutique</td><td>Tout le monde</td></tr><tr><td>Pièce d\'identité du vendeur</td><td>Donner le badge Vérifié</td><td>L\'administrateur seulement</td></tr><tr><td>Nom, numéro et adresse du client</td><td>Livrer la commande</td><td>Le vendeur concerné et l\'administrateur</td></tr><tr><td>Messages des discussions</td><td>Parler d\'une commande</td><td>Le client et le vendeur ; l\'administrateur si c\'est signalé</td></tr><tr><td>Abonnement aux alertes</td><td>Envoyer les notifications</td><td>Personne</td></tr></tbody></table></div><ol><li>Les données sont gardées tant que le compte existe, puis supprimées dans un délai de 12 mois, sauf obligation légale de les garder plus longtemps.</li><li>Chacun peut demander à voir, corriger ou supprimer ses données, et peut refuser les annonces, en écrivant au support. La réponse est donnée sous 30 jours.</li><li>Les données sont hébergées chez des prestataires techniques (Supabase et Vercel), dont les serveurs peuvent se trouver hors de Côte d\'Ivoire.</li><li>En cas de plainte, chacun peut saisir l\'ARTCI, autorité de protection des données personnelles en Côte d\'Ivoire.</li></ol>'],['⚠️','11. Sanctions','<p>La sanction dépend de la gravité de la faute. L\'administrateur prévient la personne et explique le motif, sauf en cas d\'urgence.</p><div class="regt"><table><thead><tr><th>Faute</th><th>Sanction</th></tr></thead><tbody><tr><td>Petit manquement (prix flou, stock pas à jour, retard de réponse)</td><td>Avertissement</td></tr><tr><td>Manquement répété après avertissement, ou faux avis</td><td>Produits retirés, badge Vérifié ou mise en avant retirés</td></tr><tr><td>Plaintes répétées de clients, fausse référence de paiement</td><td>Suspension de la boutique</td></tr><tr><td>Arnaque, produit interdit, menace, usurpation d\'identité</td><td>Fermeture définitive et numéro mis sur liste noire</td></tr><tr><td>Infraction à la loi (vol, escroquerie, cybercriminalité)</td><td>Signalement aux autorités compétentes</td></tr></tbody></table></div><p>Un client qui passe de fausses commandes ou refuse sans raison des livraisons peut aussi être mis sur liste noire.</p><p>Toute personne sanctionnée peut contester dans les 15 jours en écrivant au support. L\'administrateur répond sous 7 jours.</p>'],['📌','12. Responsabilité, droits et dispositions finales','<ol><li><b>Responsabilité</b> : Gbairai Market fournit l\'outil et fait de son mieux pour qu\'il marche sans interruption. La plateforme n\'est pas responsable d\'une vente entre un vendeur et un client, ni d\'une panne d\'internet, de WhatsApp ou de Mobile Money.</li><li><b>Propriété</b> : le nom Gbairai Market, son logo et son design appartiennent à la plateforme. Le vendeur garde les droits sur ses photos et ses textes. Il autorise Gbairai Market à les montrer pour faire connaître sa boutique, par exemple dans les images de statut.</li><li><b>Photos des autres</b> : le vendeur ne publie pas une photo prise sur internet ou chez un autre vendeur sans son accord.</li><li><b>Modification</b> : ce règlement peut changer. Les changements importants sont annoncés dans l\'appli au moins 15 jours avant. Continuer à utiliser la plateforme vaut acceptation.</li><li><b>Droit applicable</b> : ce règlement est soumis au droit ivoirien. En cas de litige, les parties cherchent d\'abord un accord à l\'amiable. Sinon, les tribunaux d\'Abidjan sont compétents.</li><li><b>Contact</b> : le support par WhatsApp, avec le bouton ci-dessous.</li></ol>']];
function vReglement(){const lim=S.settings.limite_gratuit||20;
  const offres='<div class="regt"><table><thead><tr><th>Offre</th><th>Ce qu\'elle donne</th><th>Durée</th></tr></thead><tbody><tr><td>Gratuit</td><td>Boutique jusqu\'à '+esc(lim)+' produits</td><td>Sans limite</td></tr><tr><td>Pro</td><td>Plus de produits et outils avancés</td><td>Par mois</td></tr><tr><td>Mise en avant</td><td>Boutique montrée en premier sur l\'accueil</td><td>Par semaine</td></tr><tr><td>Bannière</td><td>Publicité sur l\'accueil</td><td>Selon la réservation</td></tr></tbody></table></div>';
  const op=ui.regOpen;
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Règlement intérieur</h1></div>'+
  '<div class="card regintro"><b>Les règles de '+esc(S.settings.nom||'Gbairai Market')+'</b><p class="small muted" style="margin:4px 0 0">Valables pour tous les vendeurs et clients, partout en Côte d\'Ivoire. Mis à jour le '+REGLEMENT_MAJ+'.</p></div>'+
  '<div class="row wrapx" style="gap:8px"><button type="button" class="chip chip-s" data-a="regAll" data-v="1">Tout ouvrir</button><button type="button" class="chip chip-s" data-a="regAll" data-v="0">Tout fermer</button><button type="button" class="chip chip-s" data-a="regPrint">🖨 Imprimer / PDF</button></div>'+
  REGLEMENT.map((a,i)=>'<details class="card regart"'+(op==='all'||op===i?' open':'')+'><summary><span class="regic">'+a[0]+'</span><b>Article '+a[1]+'</b></summary><div class="regbody">'+a[2].replace('@OFFRES@',offres)+'</div></details>').join('')+
  '<a class="btn btn-g btn-block" target="_blank" rel="noopener" href="https://wa.me/'+waNum(S.settings.support_whatsapp||'')+'?text='+encodeURIComponent('Bonjour, j\'ai une question sur le règlement de '+(S.settings.nom||'Gbairai Market')+' : ')+'">'+ic('wa',18,'#fff')+'Écrire au support</a>';
  return h+'</div>';}
function vAide(){const role=myShop()?'vendeur':'client',pub=ui.aidePub||role,qq=ui.aideQ.trim().toLowerCase(),all=(S.aide||[]).filter(x=>x.actif!==false);
  const match=x=>!qq||(x.titre+' '+(x.etapes||[]).join(' ')).toLowerCase().includes(qq);
  const G=all.filter(x=>x.type==='guide'&&(qq||x.public===pub)&&match(x)),V=all.filter(x=>x.type==='video'&&(qq||x.public===pub)&&match(x));
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Aide</h1></div>'+
  '<label class="search" style="margin:0">'+ic('search',20,'#6B5B8C')+'<input type="search" placeholder="Comment… (ex. : envoyer un reçu)" value="'+esc(ui.aideQ)+'" data-i="aideQ" aria-label="Chercher dans l\'aide"></label>'+
  '<div class="seg2">'+[['vendeur','Je vends'],['client','J\'achète']].map(x=>'<button type="button" class="chip'+(pub===x[0]?' on':'')+'" data-a="aidePub" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
  '<button type="button" class="btn btn-v btn-block" data-a="tour" data-id="'+pub+'">▶ Visite guidée ('+(pub==='vendeur'?'vendeuse':'client')+')</button>';
  h+=G.length?'<div class="card" style="padding:4px 14px">'+G.map(x=>{const on=ui.aideOpen===x.id||!!qq;return '<div class="guide'+(on?' on':'')+'"><button type="button" class="gd" data-a="aideOpen" data-id="'+x.id+'"><span class="gi">'+esc(x.icone||'💡')+'</span><span style="flex:1;min-width:0;text-align:left"><b>'+esc(x.titre)+'</b><span class="small muted" style="display:block">'+(x.etapes||[]).length+' étapes</span></span><span class="chev">›</span></button>'+(on?'<ol class="gsteps">'+(x.etapes||[]).map(e=>'<li>'+esc(e)+'</li>').join('')+'</ol>':'')+'</div>';}).join('')+'</div>':'<div class="card muted">'+(all.length?'Rien trouvé. Essayez un autre mot.':'Les guides arrivent bientôt.')+'</div>';
  if(V.length)h+='<div class="sec-title"><h2>Vidéos</h2><span class="cnt-pill">'+V.length+'</span></div>'+V.map(x=>{const yt=ytEmbed(x.video_url);return '<div class="card stack" style="gap:8px"><b>'+esc(x.icone||'🎬')+' '+esc(x.titre)+(x.duree?' <span class="small muted">· '+esc(x.duree)+'</span>':'')+'</b>'+(yt?'<div class="vidbox"><iframe src="'+esc(yt)+'" title="'+esc(x.titre)+'" loading="lazy" allowfullscreen></iframe></div>':/\.(mp4|webm)(\?|$)/i.test(x.video_url)?'<video class="vidbox" src="'+esc(x.video_url)+'" controls preload="metadata"></video>':'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="'+esc(x.video_url)+'">▶ Regarder la vidéo</a>')+'</div>';}).join('');
  h+='<a class="btn btn-w btn-block" href="#reglement">⚖️ Lire le règlement intérieur</a>';
  h+='<a class="btn btn-g btn-block" target="_blank" rel="noopener" href="https://wa.me/'+waNum(S.settings.support_whatsapp||'')+'?text='+encodeURIComponent('Bonjour, j\'ai une question sur '+(S.settings.nom||'Gbairai Market')+' : ')+'">'+ic('wa',18,'#fff')+'Je n\'ai pas trouvé : écrire au support</a>';
  return h+'</div>';}
function aAide(){const L=S.aide||[],ed=ui.aEditAide&&ui.aEditAide!=='new'?L.find(x=>x.id===ui.aEditAide):null,show=ui.aEditAide==='new'||ed,x=ed||{type:'guide',public:'vendeur',icone:'💡',etapes:[],ordre:L.length+1};
  let h='<div class="note">Ces guides et vidéos s\'affichent dans la page <b>Aide</b>. Pour une vidéo : mettez-la sur YouTube (ou TikTok, Facebook) et collez le lien.</div>';
  h+=show?'<form class="card stack" data-f="aide"'+(ed?' data-id="'+ed.id+'"':'')+' style="max-width:640px"><h2 style="font-size:17px">'+(ed?'Modifier':'Ajouter')+'</h2><div class="grid2"><label class="lbl">Type<select class="in" name="type"><option value="guide"'+(x.type==='guide'?' selected':'')+'>Guide en étapes</option><option value="video"'+(x.type==='video'?' selected':'')+'>Vidéo</option></select></label><label class="lbl">Pour<select class="in" name="public"><option value="vendeur"'+(x.public==='vendeur'?' selected':'')+'>Vendeuses</option><option value="client"'+(x.public==='client'?' selected':'')+'>Clients</option></select></label></div><div class="row" style="gap:8px"><label class="lbl" style="width:80px">Icône<input class="in" name="icone" maxlength="8" value="'+esc(x.icone)+'"></label><label class="lbl" style="flex:1">Titre<input class="in" name="titre" required maxlength="100" value="'+esc(x.titre||'')+'"></label></div><label class="lbl">Étapes (une par ligne)<textarea class="in" name="etapes" rows="5" style="height:auto;padding:10px 14px">'+esc((x.etapes||[]).join('\n'))+'</textarea></label><div class="grid2"><label class="lbl">Lien de la vidéo<input class="in" name="video_url" maxlength="400" value="'+esc(x.video_url||'')+'" placeholder="https://youtube.com/…"></label><label class="lbl">Durée<input class="in" name="duree" maxlength="10" value="'+esc(x.duree||'')+'" placeholder="0:45"></label></div><label class="lbl">Ordre<input class="in" name="ordre" inputmode="numeric" value="'+esc(String(x.ordre||0))+'"></label><div class="grid2"><button type="button" class="btn btn-w" data-a="editAide" data-id="">Annuler</button><button class="btn btn-v" type="submit">Enregistrer</button></div></form>':'<button type="button" class="btn btn-v" data-a="editAide" data-id="new" style="max-width:320px">+ Ajouter un guide ou une vidéo</button>';
  h+=['vendeur','client'].map(p=>{const l=L.filter(a=>a.public===p);return '<div class="sec-title"><h2>'+(p==='vendeur'?'Pour les vendeuses':'Pour les clients')+'</h2><span class="cnt-pill">'+l.length+'</span></div>'+(l.length?'<div class="card" style="padding:4px 14px">'+l.map(a=>'<div class="row between" style="padding:10px 0;border-top:1px solid var(--line);'+(a.actif===false?'opacity:.5':'')+'"><span style="min-width:0"><b>'+esc(a.icone)+' '+esc(a.titre)+'</b><span class="small muted" style="display:block">'+(a.type==='video'?'🎬 Vidéo':(a.etapes||[]).length+' étapes')+(a.actif===false?' · masqué':'')+'</span></span><span class="row" style="gap:6px"><button type="button" class="btn btn-w btn-s" data-a="editAide" data-id="'+a.id+'">Modifier</button><button type="button" class="btn btn-w btn-s" data-a="aideActif" data-id="'+a.id+'" data-v="'+(a.actif===false?'1':'0')+'">'+(a.actif===false?'Afficher':'Masquer')+'</button><button type="button" class="btn btn-r btn-s" data-a="delAide" data-id="'+a.id+'">'+ic('trash',14)+'</button></span></div>').join('')+'</div>':'<div class="card muted" style="max-width:760px">Rien pour l\'instant.</div>');}).join('');
  return h;}
/* Visite guidée */
const TOURS={client:[['.stories','📸 Les nouveautés','Touchez un rond pour voir les nouveaux articles des boutiques, comme un statut WhatsApp.'],['#q','🔍 Chercher','Écrivez ce que vous cherchez : robe, iPhone, nom d\'une boutique…'],['.chips','📍 Votre ville','Choisissez votre ville pour voir les boutiques près de vous.'],['.pcard [data-a="add"]','➕ Ajouter au panier','Touchez « + » pour mettre un article dans le panier.'],['.nav a[href="#panier"]','🛍 Commander','Dans le panier, touchez « Commander sur WhatsApp » : le message part tout prêt chez le vendeur.'],['.icon-btn[href="#commandes"]','🚚 Suivre ma commande','Ici, vous voyez où en est votre commande.'],['.aidebar','💡 Besoin d\'aide ?','Tous les guides et vidéos sont ici.']],
  vendeur:[['.tab[data-id="produits"]','📸 Vos produits','Ajoutez vos articles avec une photo et un prix.'],['a[href^="#boutique-"]','🔗 Votre page','Votre boutique en ligne. Partagez son lien sur vos statuts.'],['.tab[data-id="commandes"]','🛒 Les commandes','Les commandes des clients arrivent ici. Confirmez quand le client a payé.'],['.tab[data-id="caisse"]','💰 La caisse','Vos recettes, vos dépenses et votre relevé du mois.'],['.tab[data-id="equipe"]','👥 Votre équipe','Vos points de vente et vos commerciaux.'],['.helpbtn','💡 Le bouton ?','Il explique chaque écran. Touchez-le si vous êtes perdue.']]};
let TOUR=null;
function startTour(kind){const h=kind==='vendeur'?'vendeur':'accueil';if((location.hash||'#accueil').slice(1)!==h&&!(h==='accueil'&&!location.hash)){TOUR={kind,i:-1,pending:true};location.hash=h;setTimeout(()=>{if(TOUR&&TOUR.pending){TOUR.pending=false;tourStep(1);}},700);return;}TOUR={kind,i:-1};tourStep(1);}
function tourStep(d){if(!TOUR)return;const L=TOURS[TOUR.kind];let el=null;
  while(true){TOUR.i+=d;if(TOUR.i>=L.length){endTour(true);return;}el=document.querySelector(L[TOUR.i][0]);if(el&&el.getClientRects().length)break;}
  el.scrollIntoView({block:'center'});setTimeout(()=>{if(!TOUR)return;const r=el.getBoundingClientRect(),st=L[TOUR.i],below=r.top<innerHeight/2,pad=6;
    const tipTop=below?Math.min(innerHeight-200,r.bottom+16):Math.max(12,r.top-190);
    document.getElementById('layer').innerHTML='<div class="tourv"><div class="tspot" style="left:'+(r.left-pad)+'px;top:'+(r.top-pad)+'px;width:'+(r.width+pad*2)+'px;height:'+(r.height+pad*2)+'px"></div><div class="ttip" style="top:'+tipTop+'px"><div class="small muted" style="font-weight:700">ÉTAPE '+(TOUR.i+1)+' SUR '+L.length+'</div><b>'+esc(st[1])+'</b><p>'+esc(st[2])+'</p><div class="row between"><button type="button" class="linkbtn" data-a="tourEnd">Passer</button><button type="button" class="btn btn-v btn-s" data-a="tourNext">'+(TOUR.i===L.length-1?'Terminer ✓':'Suivant ›')+'</button></div></div></div>';},250);}
function endTour(done){if(TOUR)lsSet('gbairai-tour-'+TOUR.kind,1);TOUR=null;document.getElementById('layer').innerHTML='';if(done)toast('Bravo, vous connaissez l\'essentiel 👍');}
function autoTour(h){if(TOUR||document.getElementById('intro')||document.querySelector('#layer>*'))return;
  if(TOUR===null&&h==='vendeur'&&myShop()&&!isAdmin()&&!lsGet('gbairai-tour-vendeur',0)){TOUR={kind:'vendeur',i:-1};tourStep(1);}
  else if((h==='accueil')&&!S.user&&!lsGet('gbairai-tour-client',0)&&lsGet('gbairai-intro',0)){TOUR={kind:'client',i:-1};tourStep(1);}}
/* Premiers pas */
function premiersPas(s){if(lsGet('gbairai-pp-'+s.id,0))return '';const P=shopProducts(s.id);
  const L=[['Créer ma boutique',true,''],['Ajouter mon logo',!!s.logo,'<button type="button" class="chip chip-s" data-a="vtab" data-id="reglages">Faire ›</button>'],['Ajouter 3 produits',P.length>=3,'<button type="button" class="chip chip-s" data-a="vtab" data-id="produits">Faire ›</button>'],['Partager mon lien sur mon statut',!!lsGet('gbairai-partage-'+s.id,0),'<button type="button" class="chip chip-s" data-a="ppShare">Copier ›</button>'],['Recevoir ma 1re commande',S.orders.some(o=>o.shop_id===s.id),'']];
  const n=L.filter(x=>x[1]).length;if(n===L.length)return '';const pc=Math.round(n/L.length*100);
  return '<section class="card stack pp"><div class="row between"><b>🚀 Premiers pas · boutique prête à '+pc+' %</b><button type="button" class="linkbtn" data-a="ppHide" aria-label="Masquer">✕</button></div><div class="bar"><i style="width:'+pc+'%"></i></div>'+L.map(x=>'<div class="ppl'+(x[1]?' ok':'')+'"><span class="bx">'+(x[1]?'✓':'')+'</span><span style="flex:1">'+esc(x[0])+'</span>'+(x[1]?'':x[2])+'</div>').join('')+'</section>';}
/* ---------- PLUS BEAU : stories, badges, zoom, panier, thème, QR, carte, podium, fêtes ---------- */
function storyList(){const ok=new Set(S.shops.filter(s=>s.statut==='actif').map(s=>s.id)),m={},vu=lsGet('gbairai-stories',{});
  S.products.forEach(p=>{if(p.visible&&p.stock>0&&ok.has(p.shop_id))(m[p.shop_id]=m[p.shop_id]||[]).push(p);});
  return Object.keys(m).map(id=>{const ps=m[id].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,8),last=String(ps[0].created_at||'');return {s:shopById(id),ps,last,vu:!!vu[id]&&vu[id]>=last};})
    .sort((a,b)=>(a.vu-b.vu)||(b.s.vedette-a.s.vedette)||b.last.localeCompare(a.last)).slice(0,20);}
function storiesHTML(){const L=storyList();if(!L.length)return '';
  return '<div class="stories" aria-label="Nouveautés des boutiques">'+L.map((x,i)=>{const im=x.s.logo||x.ps[0].photo;return '<button type="button" class="st1" data-a="story" data-i="'+i+'"><span class="ring'+(x.vu?' seen':'')+'"><span class="ri" style="'+(im?'background-image:url(\''+esc(im)+'\')':'background:'+lin(x.s.couleur))+'">'+(im?'':esc(x.s.nom.slice(0,1).toUpperCase()))+'</span></span><span class="stn">'+esc(x.s.nom)+'</span></button>';}).join('')+'</div>';}
let storyT=null;
function storyStop(){clearTimeout(storyT);ui.story=null;}
function storyShow(){const st=ui.story;if(!st)return;const x=st.list[st.i];if(!x){document.getElementById('layer').innerHTML='';storyStop();return;}
  const p=x.ps[st.j],vu=lsGet('gbairai-stories',{});if(!vu[x.s.id]||vu[x.s.id]<x.last){vu[x.s.id]=x.last;lsSet('gbairai-stories',vu);}
  document.getElementById('layer').innerHTML='<div class="storyv" data-a="storyTap" role="dialog" aria-label="Nouveautés de '+esc(x.s.nom)+'"><div class="sv-im" style="'+(p.photo?'background-image:url(\''+esc(p.photo)+'\')':'background:'+grad(p.couleur))+'"></div><div class="sv-prog">'+x.ps.map((_,k)=>'<i class="'+(k<st.j?'done':k===st.j?'run':'')+'"><b></b></i>').join('')+'</div>'+
    '<div class="sv-head">'+avatar(x.s,34)+'<a href="#boutique-'+esc(x.s.slug)+'" data-a="storyClose" style="color:#fff;text-decoration:none"><b>'+esc(x.s.nom)+'</b></a><span>'+(p.created_at?ago(p.created_at):'')+'</span><button type="button" class="sv-x" data-a="storyClose" aria-label="Fermer">✕</button></div>'+
    '<div class="sv-foot"><div class="sv-card"><b>'+esc(p.nom)+'</b><div class="sv-pr">'+priceHTML(p)+'</div></div><div class="grid2"><a class="btn btn-w" href="#produit-'+p.id+'" data-a="storyClose">Voir</a><button type="button" class="btn btn-g" data-a="storyAdd" data-id="'+p.id+'">🛒 Ajouter</button></div></div></div>';
  clearTimeout(storyT);storyT=setTimeout(storyNext,5000);}
function storyNext(){const st=ui.story;if(!st)return;if(st.j<st.list[st.i].ps.length-1)st.j++;else{st.i++;st.j=0;}storyShow();}
function storyPrev(){const st=ui.story;if(!st)return;if(st.j>0)st.j--;else if(st.i>0){st.i--;st.j=0;}storyShow();}
function pBadge(p){const d=p.created_at?(Date.now()-new Date(p.created_at).getTime())/864e5:99;
  if(S.best&&S.best[p.id])return '<span class="pbadge b3">🏆 Meilleure vente</span>';
  if(p.stock>0&&p.stock<=3)return '<span class="pbadge b2">🔥 Plus que '+p.stock+'</span>';
  if(d<7)return '<span class="pbadge b1">✨ Nouveau</span>';return '';}
function fly(src){try{const im=src&&src.querySelector('img'),to=document.querySelector('.nav a[href="#panier"]');if(!to||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const a=(im||src).getBoundingClientRect(),b=to.getBoundingClientRect(),el=document.createElement('div');el.className='flyer';
  if(im)el.style.backgroundImage='url("'+im.src+'")';else el.style.background='var(--violet2)';
  const sz=64;el.style.cssText+=';left:'+(a.left+a.width/2-sz/2)+'px;top:'+(a.top+a.height/2-sz/2)+'px;width:'+sz+'px;height:'+sz+'px';document.body.appendChild(el);
  const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
  el.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1},{transform:'translate('+dx*0.45+'px,'+(dy*0.45-120)+'px) scale(.8) rotate(-12deg)',opacity:1,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(.2) rotate(-20deg)',opacity:.6}],{duration:750,easing:'cubic-bezier(.5,0,.6,1)'}).onfinish=()=>el.remove();
  if(navigator.vibrate)navigator.vibrate(25);}catch(e){}}
function bumpCart(){setTimeout(()=>{const n=document.querySelector('.nav a[href="#panier"]');if(n){n.classList.remove('bump');void n.offsetWidth;n.classList.add('bump');}},700);}
/* Thème de boutique */
const COVERS=[['','Couleur'],['wax','Wax'],['bogolan','Bogolan'],['degrade','Dégradé']];
function coverBg(s){const p=pal(s.couleur),c=s.couverture||'';
  if(c==='wax')return 'radial-gradient(circle at 50% 50%,rgba(255,255,255,.55) 0 5px,transparent 6px) 0 0/28px 28px,repeating-linear-gradient(45deg,'+p[1]+' 0 14px,#FF7A1A 14px 28px,#0E7A5F 28px 42px,#FACC15 42px 56px)';
  if(c==='bogolan')return 'repeating-linear-gradient(90deg,transparent 0 18px,rgba(232,213,181,.9) 18px 21px),repeating-linear-gradient(0deg,#3F2A1D 0 16px,#5C3D2A 16px 22px,#E8D5B5 22px 25px)';
  if(c==='degrade')return 'linear-gradient(135deg,'+p[1]+',#FF7A1A)';
  if(/^https:\/\/[^'"()<>\\\s]+$/.test(c))return 'linear-gradient(0deg,rgba(0,0,0,.35),transparent 60%),url(\''+esc(c)+'\') center/cover';
  return lin(s.couleur);}
function themeCard(s){const c=s.couverture||'';
  return '<section class="card stack"><h3 style="font-size:15px">🎨 Thème de ma boutique</h3><div class="small muted">Couleur des boutons et de la page</div><div class="row wrapx" style="gap:10px">'+PAL.map((p,i)=>'<button type="button" class="swatch'+((s.couleur||0)%PAL.length===i?' on':'')+'" style="background:'+p[1]+'" data-a="setCouleur" data-v="'+i+'" aria-label="Couleur '+(i+1)+'"></button>').join('')+'</div>'+
  '<div class="small muted">Couverture</div><div class="covers">'+COVERS.map(x=>'<button type="button" class="cov'+(c===x[0]?' on':'')+'" data-a="setCover" data-v="'+x[0]+'"><i style="background:'+coverBg({couleur:s.couleur,couverture:x[0]})+'"></i>'+x[1]+'</button>').join('')+
  '<label class="cov'+(/^https?:/.test(c)?' on':'')+'"><i style="'+(/^https?:/.test(c)?'background:'+coverBg(s):'')+'">📷</i>Ma photo<input type="file" accept="image/*" data-file="cover" hidden></label></div></section>';}
/* Mode sombre et son */
function themeMode(){return lsGet('gbairai-theme','auto');}
function applyTheme(){const m=themeMode(),dark=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';const mt=document.querySelector('meta[name=theme-color]');if(mt)mt.content=dark?'#130A24':'#5B21B6';}
applyTheme();try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);}catch(e){}
function prefsHTML(){const m=themeMode(),son=lsGet('gbairai-son',true);
  return '<section class="card stack" style="gap:10px"><div class="row between"><b>🌙 Affichage</b><div class="seg">'+[['auto','Auto'],['light','Clair'],['dark','Sombre']].map(x=>'<button type="button" class="'+(m===x[0]?'on':'')+'" data-a="setTheme" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div><div class="row between"><b>🔔 Petits sons</b><div class="seg">'+[['1','Oui'],['0','Non']].map(x=>'<button type="button" class="'+((son?'1':'0')===x[0]?'on':'')+'" data-a="setSon" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div><span class="small muted">« Auto » suit le réglage du téléphone.</span></section>';}
let actx=null;
function tchin(){if(!lsGet('gbairai-son',true))return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime;[[1318.5,0],[1760,.09],[2637,.18]].forEach(n=>{const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.value=n[0];g.gain.setValueAtTime(0,t+n[1]);g.gain.linearRampToValueAtTime(.18,t+n[1]+.01);g.gain.exponentialRampToValueAtTime(.001,t+n[1]+.5);o.connect(g).connect(actx.destination);o.start(t+n[1]);o.stop(t+n[1]+.55);});}catch(e){}}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas');c.className='confetti';c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);const x=c.getContext('2d'),col=['#FF7A1A','#8B5CF6','#0E7A5F','#FACC15','#DB2777','#3B82F6'];
  const P=Array.from({length:140},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,r:Math.random()*6.28,vr:(Math.random()-.5)*.4,w:6+Math.random()*6,h:9+Math.random()*7,c:col[Math.floor(Math.random()*col.length)]}));const t0=performance.now();
  (function f(t){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore();});if(t-t0<2600)requestAnimationFrame(f);else c.remove();})(t0);}
const PALIERS=[1,10,25,50,100,250,500,1000];
function celebrate(o){confetti();tchin();if(navigator.vibrate)navigator.vibrate([30,40,30]);
  const s=myShop(),n=s?S.orders.filter(x=>x.shop_id===s.id&&x.statut==='confirmee').length:0,pal_=PALIERS.includes(n);
  const el=document.createElement('div');el.className='celeb';el.innerHTML='<div class="celeb-card"><div style="font-size:46px">'+(pal_?'🏅':'🎉')+'</div><b>'+(pal_?(n===1?'Première vente !':'Objectif atteint : '+n+' ventes !'):'Vente confirmée !')+'</b><span>'+(o?'+'+F(o.total)+' dans votre caisse':'')+'</span></div>';document.body.appendChild(el);setTimeout(()=>el.remove(),2600);}
/* QR code du reçu */
let qrLoad=null;
function fillQR(){const el=document.getElementById('recuqr');if(!el||el.dataset.done)return;
  qrLoad=qrLoad||new Promise((ok,ko)=>{if(window.qrcode)return ok();const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';sc.onload=ok;sc.onerror=()=>{qrLoad=null;ko();};document.head.appendChild(sc);});
  qrLoad.then(()=>{const e2=document.getElementById('recuqr');if(!e2||e2.dataset.done)return;const qr=window.qrcode(0,'M');qr.addData(e2.dataset.url);qr.make();e2.innerHTML=qr.createSvgTag(4,0);e2.dataset.done='1';},()=>{const e2=document.getElementById('recuqr');if(e2)e2.closest('.recu-qr').remove();});}
/* Carte des points de vente */
function geo(cb){if(!navigator.geolocation){toast('Position non disponible sur ce téléphone');return;}toast('Recherche de votre position…');
  navigator.geolocation.getCurrentPosition(p=>cb({lat:Math.round(p.coords.latitude*1e6)/1e6,lng:Math.round(p.coords.longitude*1e6)/1e6}),()=>toast('Autorisez la position, puis réessayez'),{enableHighAccuracy:true,timeout:15000});}
const mapsUrl=(p,s)=>p.lat!=null&&p.lng!=null?'https://www.google.com/maps/dir/?api=1&destination='+p.lat+','+p.lng:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([p.nom,p.adresse,s.quartier,villeOf(s),'Côte d\'Ivoire'].filter(Boolean).join(', '));
function pointsHTML(s){const pts=(S.points||[]).filter(p=>p.shop_id===s.id).sort((a,b)=>(b.principal?1:0)-(a.principal?1:0));if(!pts.length)return '';
  const geoP=pts.filter(p=>p.lat!=null&&p.lng!=null),sel=geoP.find(p=>p.id===ui.pvSel[s.id])||geoP[0];
  const map=sel?'<div class="pvmap"><iframe title="Carte" loading="lazy" referrerpolicy="no-referrer" src="https://www.openstreetmap.org/export/embed.html?bbox='+(sel.lng-.008)+','+(sel.lat-.005)+','+(sel.lng+.008)+','+(sel.lat+.005)+'&layer=mapnik&marker='+sel.lat+','+sel.lng+'"></iframe><span class="pvtag">📍 '+esc(sel.nom)+'</span></div>':'';
  return '<section class="card stack"><h2 style="font-size:17px">Nos points de vente</h2>'+map+pts.map(p=>'<div class="pvrow'+(sel&&sel.id===p.id?' on':'')+'"'+(p.lat!=null?' data-a="pvSel" data-shop="'+s.id+'" data-id="'+p.id+'"':'')+'><div class="row" style="gap:10px;align-items:flex-start">'+ic('pin',18,'#5B21B6')+'<div style="min-width:0;flex:1"><b>'+esc(p.nom)+'</b>'+(p.principal?' <span class="badge b-green">Principal</span>':'')+(p.adresse||p.horaires?'<div class="small muted">'+esc([p.adresse,p.horaires].filter(Boolean).join(' · '))+'</div>':'')+'</div></div><div class="grid2"><a class="btn btn-v btn-s" target="_blank" rel="noopener" href="'+esc(mapsUrl(p,s))+'">🧭 Itinéraire</a>'+(p.tel?'<a class="btn btn-w btn-s" href="tel:'+esc(p.tel.replace(/\s/g,''))+'">📞 Appeler</a>':'<a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'">'+ic('wa',14,'#0E7A5F')+'WhatsApp</a>')+'</div></div>').join('')+'</section>';}
/* Podium */
function podiumHTML(L,title){const t=L.slice(0,3),o=[t[1],t[0],t[2]],med=['🥈','🥇','🥉'],cls=['p2','p1','p3'];
  return '<section class="card stack"><b>🏆 '+esc(title)+'</b><div class="podium">'+o.map((x,i)=>x?'<div class="pd '+cls[i]+(x.moi?' moi':'')+'"><span class="md">'+med[i]+'</span><b>'+esc(x.nom)+'</b><small>'+x.ventes+' vente'+(x.ventes>1?'s':'')+'</small></div>':'<div class="pd empty"></div>').join('')+'</div>'+
  (L.length>3?'<div class="stack" style="gap:0">'+L.slice(3,8).map((x,i)=>'<div class="row between small" style="padding:7px 0;border-top:1px solid var(--line)"><span>'+(i+4)+'. '+esc(x.nom)+(x.moi?' (vous)':'')+'</span><b>'+x.ventes+'</b></div>').join('')+'</div>':'')+'</section>';}
function espacePodium(sec){const d=ui.podium[sec];if(d===undefined){ui.podium[sec]=null;sb.rpc('podium_commercial',{sec}).then(r=>{ui.podium[sec]=r.data||[];render(true);},()=>{ui.podium[sec]=[];});return '';}
  if(!d||!d.length||!d.some(x=>x.ventes))return '';const me=d.findIndex(x=>x.moi);
  return (me>=0?'<div class="note" style="text-align:center;font-size:14px">'+(me===0?'🥇 Vous êtes premier ce mois-ci, bravo !':'Vous êtes <b>'+(me+1)+'e</b> ce mois-ci. Encore un effort ! 💪')+'</div>':'')+podiumHTML(d,'Podium du mois');}
/* Fêtes */
const FETES=[{id:'noel',nom:'Noël et Nouvel An',e:'🎄',k:'Joyeuses fêtes 🎅',t:'Les cadeaux de Noël sont ici',c:'Offrez ivoirien',bg:'linear-gradient(150deg,#B91C1C,#7F1D1D)',snow:1},
  {id:'valentin',nom:'Saint-Valentin',e:'💝',k:'Saint-Valentin',t:'Un cadeau pour votre chéri(e)',c:'Bijoux, parfums, tenues',bg:'linear-gradient(150deg,#DB2777,#9D174D)'},
  {id:'ramadan',nom:'Ramadan',e:'🌙',k:'Ramadan Moubarak',t:'Tout pour la rupture et la fête',c:'Boubous, bazin, cuisine',bg:'linear-gradient(150deg,#1E3A8A,#0F172A)',snow:1},
  {id:'korite',nom:'Korité',e:'🌙',k:'Bonne fête de Korité',t:'Bazin, boubous et cadeaux',c:'Tenues de fête',bg:'linear-gradient(150deg,#065F46,#064E3B)'},
  {id:'paques',nom:'Pâques',e:'🐣',k:'Joyeuses Pâques',t:'Tenues et cadeaux pour la fête',c:'Pour toute la famille',bg:'linear-gradient(150deg,#F59E0B,#B45309)'},
  {id:'meres',nom:'Fête des mères',e:'💐',k:'Bonne fête maman',t:'Gâtez maman cette semaine',c:'Idées cadeaux',bg:'linear-gradient(150deg,#EC4899,#BE185D)'},
  {id:'tabaski',nom:'Tabaski',e:'🐑',k:'Bonne fête de Tabaski',t:'Bazin, boubous et cadeaux',c:'Tenues de fête',bg:'linear-gradient(150deg,#065F46,#064E3B)'},
  {id:'independance',nom:'Fête de l\'indépendance',e:'🇨🇮',k:'7 août · Fête de l\'indépendance',t:'Fiers d\'acheter ivoirien !',c:'Made in CI à l\'honneur',bg:'linear-gradient(150deg,#F77F00 0 33%,#FFFFFF 33% 66%,#009E60 66%)',dark:1}];
const LUNE={ramadan:{2026:'2026-02-18',2027:'2027-02-08',2028:'2028-01-28',2029:'2029-01-16'},korite:{2026:'2026-03-20',2027:'2027-03-10',2028:'2028-02-27',2029:'2029-02-15'},tabaski:{2026:'2026-05-27',2027:'2027-05-17',2028:'2028-05-05',2029:'2029-04-24'}};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addD=(s_,n)=>{const a=s_.split('-').map(Number),d=new Date(a[0],a[1]-1,a[2]+n);return ymd(d);};
function paques(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return ymd(new Date(y,mo-1,da));}
function feteRange(id,y){
  if(id==='noel')return [y+'-12-15',(y+1)+'-01-02'];if(id==='valentin')return [y+'-02-07',y+'-02-14'];if(id==='independance')return [y+'-08-01',y+'-08-07'];
  if(id==='paques'){const p=paques(y);return [addD(p,-7),addD(p,1)];}
  if(id==='meres'){const d=new Date(y,4,31);d.setDate(31-d.getDay());const e=ymd(d);return [addD(e,-7),e];}
  const L=LUNE[id]&&LUNE[id][y];if(!L)return null;
  if(id==='ramadan')return [L,addD(LUNE.korite[y]||addD(L,29),-3)];if(id==='korite')return [addD(L,-2),addD(L,1)];if(id==='tabaski')return [addD(L,-10),addD(L,1)];return null;}
function feteNext(id){const t=today(),y=+t.slice(0,4);for(const yy of [y-1,y,y+1]){const r=feteRange(id,yy);if(r&&r[1]>=t)return r;}return null;}
function feteDates(id){const o=(S.settings.fetes||{}).dates||{},ov=o[id];if(ov&&ov[1]>=addD(today(),-60))return ov;return feteNext(id);}
function feteActive(){if(ui.fete)return FETES.find(f=>f.id===ui.fete)||null;const off=(S.settings.fetes||{}).off||[],t=today();return FETES.find(f=>{if(off.includes(f.id))return false;const r=feteDates(f.id);return r&&r[0]<=t&&t<=r[1];})||null;}
function feteHTML(){const f=feteActive();if(!f)return '';
  return '<section class="fete'+(f.dark?' clair':'')+'" style="background:'+f.bg+'">'+(f.snow?'<span class="snow"></span>':'')+'<span class="fe">'+f.e+'</span><small>'+esc(f.k)+'</small><h2>'+esc(f.t)+'</h2><span class="fchip">'+esc(f.c)+'</span></section>';}
function aFetes(){const o=S.settings.fetes||{},off=o.off||[];
  return '<form class="card stack" data-f="fetes" style="max-width:640px"><h2 style="font-size:17px">🎉 Accueil des fêtes</h2><p class="small muted" style="margin:0">L\'accueil se décore tout seul pendant ces dates. Ramadan, Korité et Tabaski suivent la lune : corrigez les dates si besoin. Aperçu : ajoutez <b>?fete=noel</b> à l\'adresse du site.</p>'+
  FETES.map(f=>{const r=feteDates(f.id)||['',''];return '<div class="row wrapx" style="gap:8px;border-top:1px solid var(--line);padding-top:8px"><label class="row" style="gap:6px;flex:1 1 180px;font-weight:600"><input type="checkbox" name="on_'+f.id+'" value="1"'+(off.includes(f.id)?'':' checked')+'> '+f.e+' '+esc(f.nom)+'</label><input class="in" type="date" name="du_'+f.id+'" value="'+r[0]+'" style="flex:1 1 130px;height:40px" aria-label="Début"><input class="in" type="date" name="au_'+f.id+'" value="'+r[1]+'" style="flex:1 1 130px;height:40px" aria-label="Fin"></div>';}).join('')+
  '<button class="btn btn-v btn-block" type="submit">Enregistrer les fêtes</button></form>';}
/* ---------- REÇUS, RELEVÉS, ÉQUIPE ---------- */
function recuBlock(o,s){const pts=(S.points||[]).filter(p=>p.shop_id===s.id),pm=o.paye_mode||'';
  let h='<div class="stack recublk" style="gap:8px"><span class="small" style="font-weight:700">🧾 Paiement'+(o.recu_num?' · Reçu n° '+recuNo(o.recu_num):'')+'</span><div class="chips wrapc">'+PAYE.map(x=>'<button type="button" class="chip chip-s'+(pm===x[0]?' on':'')+'" data-a="payeMode" data-id="'+o.id+'" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  if(pts.length)h+='<div class="chips wrapc"><span class="small muted" style="align-self:center">Point de vente :</span>'+pts.map(p=>'<button type="button" class="chip chip-s'+(ptOf(o)===p.id?' on':'')+'" data-a="pointOrder" data-id="'+o.id+'" data-v="'+p.id+'">'+esc(p.nom)+'</button>').join('')+'</div>';
  const txt='Bonjour '+(o.client_nom||'')+', voici votre reçu'+(o.recu_num?' n° '+recuNo(o.recu_num):'')+' de '+s.nom+' ('+fmtN(o.total)+' FCFA'+(pm?', '+payeName(pm).toLowerCase():'')+') :\n'+recuUrl(o.id)+'\nMerci pour votre achat !';
  h+='<div class="grid2"><a class="btn btn-w btn-s" href="#recu-'+o.id+'">🧾 Voir le reçu</a>'+(o.client_tel?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(o.client_tel)+'?text='+encodeURIComponent(txt)+'">'+ic('wa',16,'#fff')+'Envoyer le reçu</a>':'<button type="button" class="btn btn-g btn-s" data-a="copy" data-text="'+esc(txt)+'">Copier le reçu</button>')+'</div>';
  return h+'</div>';}
function vRecu(id){
  const d=ui.recu[id];
  if(d===undefined){ui.recu[id]=null;sb.rpc('recu_public',{oid:id}).then(r=>{ui.recu[id]=(r.data&&r.data[0])||false;render(true);},()=>{ui.recu[id]=false;render(true);});}
  const seller=S.user&&!isAdmin()&&myShop();
  let h='<div class="wrap"><div class="row noprint">'+back(seller?'#vendeur':'#suivi-'+esc(id))+'<h1 style="font-size:20px">Reçu</h1></div>';
  if(!d)return h+'<div class="card">'+(d===false?'<h2 style="font-size:17px">Reçu pas encore disponible</h2><p class="muted" style="margin:0">Le reçu apparaît quand le vendeur a confirmé la vente.</p>':'<p class="muted" style="margin:0">Chargement…</p>')+'</div></div>';
  const pm=d.paye_mode||'',paid=pm&&pm!=='credit',n=recuNo(d.recu_num),it=d.items||[];
  h+='<div class="recu" id="recu"><div class="recu-top"><div class="row" style="min-width:0">'+(d.logo?'<img class="recu-logo" src="'+esc(d.logo)+'" alt="">':'<span class="recu-logo ph">'+esc(String(d.boutique||'?').slice(0,1))+'</span>')+'<div style="min-width:0"><b class="recu-shop">'+esc(d.boutique)+'</b><div class="small muted">'+esc([d.quartier,d.ville].filter(Boolean).join(', '))+(d.point?' · '+esc(d.point):'')+'</div><div class="small muted">WhatsApp : '+esc(d.whatsapp||'')+'</div></div></div>'+(pm?'<span class="stamp'+(paid?'':' credit')+'">'+(paid?'PAYÉ':'À CRÉDIT')+'</span>':'')+'</div>'+
    '<div class="recu-meta"><div><span>Reçu n°</span><b class="num">'+n+'</b></div><div><span>Date</span><b>'+esc(dfr(d.created_at))+'</b></div><div><span>Client</span><b>'+esc(d.client_nom||'—')+'</b></div></div>'+
    '<table class="recu-t"><thead><tr><th>Article</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead><tbody>'+it.map(x=>'<tr><td>'+esc(x.nom)+(x.taille?' ('+esc(x.taille)+')':'')+'</td><td class="num">'+x.qty+'</td><td class="num">'+fmtN(x.prix)+'</td><td class="num">'+fmtN(x.prix*x.qty)+'</td></tr>').join('')+'</tbody></table>'+
    '<div class="recu-tot"><span>TOTAL</span><b class="num">'+fmtN(d.total)+' FCFA</b></div>'+
    (pm?'<div class="small">Paiement : <b>'+esc(payeName(pm))+'</b>'+(pm==='credit'?' (reste à payer)':'')+'</div>':'<div class="small muted">Mode de paiement pas encore indiqué.</div>')+
    (d.livree_code?'<div class="small" style="color:var(--green);font-weight:700">✔ Livraison confirmée par le code du client</div>':'')+
    '<div class="recu-qr"><div id="recuqr" data-url="'+esc(recuUrl(id))+'"></div><div class="small"><b>Scannez pour vérifier</b><br><span class="muted">Le code ouvre le vrai reçu sur '+esc(S.settings.nom||'Gbairai Market')+'. Un faux reçu ne peut pas avoir ce code.</span></div></div>'+
    '<div class="recu-foot small muted">Reçu vérifiable en ligne :<br><b>'+esc(recuUrl(id).replace(/^https?:\/\//,''))+'</b><br>Merci pour votre achat · '+esc(S.settings.nom||'Gbairai Market')+'</div></div>';
  const txt='🧾 Reçu n° '+n+' · '+d.boutique+'\n'+it.map(x=>'• '+x.qty+' × '+x.nom+' – '+F(x.prix*x.qty)).join('\n')+'\nTotal : '+fmtN(d.total)+' FCFA'+(pm?'\nPaiement : '+payeName(pm):'')+'\nVoir le reçu : '+recuUrl(id);
  h+='<div class="grid2 noprint"><a class="btn btn-g" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(txt)+'">'+ic('wa',18,'#fff')+'Partager</a><button type="button" class="btn btn-v" data-a="print">📄 PDF / Imprimer</button></div>';
  setTimeout(fillQR,0);
  return h+'<p class="small muted noprint" style="text-align:center;margin:0">Pour le PDF : touchez « PDF / Imprimer » puis choisissez « Enregistrer en PDF ».</p></div>';}
function vvReleve(s){const m=ui.rel,cur=monthOf(today());
  const tx=S.txs.filter(t=>t.shop_id===s.id&&monthOf(t.date)===m).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const rec=sumT(tx.filter(t=>t.type==='recette')),dep=sumT(tx.filter(t=>t.type==='depense'));
  const ok=S.orders.filter(o=>o.shop_id===s.id&&o.statut==='confirmee'),om=ok.filter(o=>monthOf(o.created_at)===m),ca=sumT(om),nb=om.length;
  const vers=(S.versements||[]).filter(v=>v.shop_id===s.id),due=Math.max(0,sumT(ok.filter(o=>o.paye_mode==='credit'))-sumT(vers));
  const wk=[0,0,0,0,0];tx.filter(t=>t.type==='recette').forEach(t=>{wk[Math.min(4,Math.floor((Number(String(t.date).slice(8,10))-1)/7))]+=t.montant;});const mx=Math.max(1,...wk);
  let bal=0;const rows=tx.map(t=>{bal+=t.type==='recette'?t.montant:-t.montant;return '<tr><td>'+esc(String(t.date).slice(8,10)+'/'+String(t.date).slice(5,7))+'</td><td>'+esc(t.libelle)+'</td><td class="num" style="color:'+(t.type==='recette'?'var(--green)':'#9A3412')+'">'+(t.type==='recette'?'+':'−')+fmtN(t.montant)+'</td><td class="num">'+fmtN(bal)+'</td></tr>';}).join('');
  const txt='📄 Relevé de '+moisFr(m)+' · '+s.nom+'\nVentes confirmées : '+nb+' ('+F(ca)+')\nRecettes : '+F(rec)+'\nDépenses : '+F(dep)+'\nBénéfice : '+(rec-dep<0?'−':'')+F(Math.abs(rec-dep))+(due?'\nÀ encaisser (crédits) : '+F(due):'')+'\n'+(S.settings.nom||'Gbairai Market');
  return '<div class="row between noprint"><button type="button" class="btn btn-w btn-s" data-a="relClose">‹ Caisse</button><div class="row" style="gap:6px"><button type="button" class="icon-btn" style="width:36px;height:36px" data-a="releve" data-id="'+addMonth(m,-1)+'" aria-label="Mois d\'avant">‹</button><b style="min-width:110px;text-align:center;text-transform:capitalize">'+esc(moisFr(m))+'</b><button type="button" class="icon-btn" style="width:36px;height:36px" data-a="releve" data-id="'+addMonth(m,1)+'"'+(m>=cur?' disabled':'')+' aria-label="Mois d\'après">›</button></div></div>'+
  '<div class="recu" id="recu"><div class="recu-top"><div class="row" style="min-width:0">'+avatar(s,44)+'<div style="min-width:0"><b class="recu-shop">'+esc(s.nom)+'</b><div class="small muted">Relevé de compte · <span style="text-transform:capitalize">'+esc(moisFr(m))+'</span></div></div></div></div>'+
  '<div class="relk"><div><span>Ventes</span><b class="num">'+nb+'</b></div><div><span>Panier moyen</span><b class="num">'+F(nb?Math.round(ca/nb):0)+'</b></div><div><span>Recettes</span><b class="num" style="color:var(--green)">'+F(rec)+'</b></div><div><span>Dépenses</span><b class="num" style="color:#9A3412">'+F(dep)+'</b></div><div class="big"><span>Bénéfice</span><b class="num">'+(rec-dep<0?'−':'')+F(Math.abs(rec-dep))+'</b></div><div class="big"><span>À encaisser (crédits)</span><b class="num" style="color:'+(due?'#EA580C':'inherit')+'">'+F(due)+'</b></div></div>'+
  '<div class="small" style="font-weight:700">Recettes par semaine</div><div class="wkbars">'+wk.map((v,i)=>'<div><i style="height:'+Math.round(v/mx*100)+'%"></i><span>S'+(i+1)+'</span></div>').join('')+'</div>'+
  (rows?'<table class="recu-t"><thead><tr><th>Date</th><th>Libellé</th><th>Montant</th><th>Solde</th></tr></thead><tbody>'+rows+'</tbody></table>':'<p class="muted small" style="margin:0">Aucun mouvement ce mois-ci.</p>')+
  '<div class="recu-foot small muted">Relevé établi le '+esc(dfr(new Date()))+' · '+esc(S.settings.nom||'Gbairai Market')+'</div></div>'+
  '<div class="grid2 noprint"><button type="button" class="btn btn-v" data-a="print">📄 PDF / Imprimer</button><a class="btn btn-g" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(txt)+'">'+ic('wa',18,'#fff')+'Envoyer</a></div>';}
function cliStats(s,key){const os=S.orders.filter(o=>o.shop_id===s.id&&o.statut==='confirmee'&&o.client_tel&&waNum(o.client_tel)===key);
  const vs=(S.versements||[]).filter(v=>v.shop_id===s.id&&waNum(v.client_tel)===key),credit=sumT(os.filter(o=>o.paye_mode==='credit')),verse=sumT(vs);
  return {os,vs,credit,verse,reste:Math.max(0,credit-verse),achats:sumT(os)};}
function cliDue(s,tel){const k=waNum(tel),c=cliStats(s,k);
  return '<div class="row between" style="gap:8px">'+(c.reste?'<span class="badge b-orange">Doit '+F(c.reste)+'</span>':c.credit?'<span class="badge b-green">Crédit soldé ✔</span>':'<span></span>')+'<button type="button" class="btn btn-w btn-s" data-a="cliOpen" data-id="'+esc(k)+'">📄 Relevé du client</button></div>';}
function vvClient(s,key){const c=cliStats(s,key),o0=S.orders.find(o=>o.shop_id===s.id&&o.client_tel&&waNum(o.client_tel)===key)||{},nom=(S.orders.find(o=>o.shop_id===s.id&&o.client_tel&&waNum(o.client_tel)===key&&o.client_nom)||{}).client_nom||'Client',tel=o0.client_tel||key;
  const L=c.os.map(o=>({d:String(o.created_at).slice(0,10),t:'Achat'+(o.recu_num?' · reçu n° '+recuNo(o.recu_num):'')+(o.paye_mode?' · '+payeName(o.paye_mode):''),m:o.total,cr:o.paye_mode==='credit'})).concat(c.vs.map(v=>({d:String(v.date).slice(0,10),t:'Versement · '+payeName(v.mode)+(v.note?' · '+v.note:''),m:-v.montant,id:v.id}))).sort((a,b)=>a.d.localeCompare(b.d));
  let bal=0;const rows=L.map(x=>{if(x.cr)bal+=x.m;else if(x.m<0)bal+=x.m;return '<tr><td>'+esc(x.d.slice(8,10)+'/'+x.d.slice(5,7)+'/'+x.d.slice(2,4))+'</td><td>'+esc(x.t)+(x.id?' <button type="button" class="linkbtn noprint" style="display:inline;padding:0" data-a="delVers" data-id="'+x.id+'" aria-label="Supprimer">✕</button>':'')+'</td><td class="num" style="color:'+(x.m<0?'var(--green)':x.cr?'#EA580C':'inherit')+'">'+(x.m<0?'−'+fmtN(-x.m):fmtN(x.m))+'</td><td class="num">'+(x.cr||x.m<0?fmtN(Math.max(0,bal)):'—')+'</td></tr>';}).join('');
  const txt='Bonjour '+nom+', voici votre relevé chez '+s.nom+' ('+dfr(new Date())+') :\nAchats : '+F(c.achats)+'\nDont à crédit : '+F(c.credit)+'\nDéjà versé : '+F(c.verse)+'\nReste à payer : '+F(c.reste)+'\nMerci pour votre confiance !';
  return '<div class="row between noprint"><button type="button" class="btn btn-w btn-s" data-a="cliClose">‹ Clients</button><button type="button" class="btn btn-w btn-s" data-a="print">📄 PDF</button></div>'+
  '<div class="recu" id="recu"><div class="recu-top"><div style="min-width:0"><b class="recu-shop">'+esc(s.nom)+'</b><div class="small muted">Relevé du client · '+esc(dfr(new Date()))+'</div></div>'+(c.reste?'<span class="stamp credit">DOIT '+fmtN(c.reste)+' F</span>':c.credit?'<span class="stamp">SOLDÉ</span>':'')+'</div>'+
  '<div class="recu-meta"><div><span>Client</span><b>'+esc(nom)+'</b></div><div><span>Téléphone</span><b>'+esc(tel)+'</b></div><div><span>Achats</span><b class="num">'+c.os.length+'</b></div></div>'+
  '<div class="relk"><div><span>Total acheté</span><b class="num">'+F(c.achats)+'</b></div><div><span>À crédit</span><b class="num" style="color:#EA580C">'+F(c.credit)+'</b></div><div><span>Déjà versé</span><b class="num" style="color:var(--green)">'+F(c.verse)+'</b></div><div class="big"><span>Reste à payer</span><b class="num">'+F(c.reste)+'</b></div></div>'+
  (rows?'<table class="recu-t"><thead><tr><th>Date</th><th>Opération</th><th>Montant</th><th>Reste</th></tr></thead><tbody>'+rows+'</tbody></table>':'<p class="muted small" style="margin:0">Pas encore d\'achat confirmé.</p>')+
  '<div class="recu-foot small muted">'+esc(S.settings.nom||'Gbairai Market')+'</div></div>'+
  '<form class="card stack noprint" data-f="versement" data-tel="'+esc(key)+'"><h2 style="font-size:16px">+ Enregistrer un versement</h2><div class="grid2"><label class="lbl">Montant (FCFA)<input class="in" name="montant" inputmode="numeric" required placeholder="5000"></label><label class="lbl">Mode<select class="in" name="mode">'+PAYE.filter(x=>x[0]!=='credit').map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select></label></div><label class="lbl">Note (facultatif)<input class="in" name="note" maxlength="120" placeholder="Ex. : 2e tranche"></label><button class="btn btn-v btn-block" type="submit">Enregistrer le versement</button><p class="small muted" style="margin:0">La vente est déjà dans votre caisse : le versement réduit seulement ce que le client doit.</p></form>'+
  '<a class="btn btn-g btn-block noprint" target="_blank" rel="noopener" href="https://wa.me/'+waNum(tel)+'?text='+encodeURIComponent(txt)+'">'+ic('wa',18,'#fff')+'Envoyer le relevé au client</a>';}
function codeFrom(nom,shopId){let b=String(nom||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);if(b.length<2)b='COM'+b;
  const used=new Set((S.commerciaux||[]).filter(c=>c.shop_id===shopId).map(c=>c.code));let c=b,i=2;while(used.has(c))c=b.slice(0,7)+(i++);return c;}
const ptOf=(o,cms)=>o.point_id||(o.commercial_code&&((cms||S.commerciaux||[]).find(c=>c.shop_id===o.shop_id&&c.code===o.commercial_code)||{}).point_id)||null;
function vvEquipe(s){
  const pts=(S.points||[]).filter(p=>p.shop_id===s.id),ok=S.orders.filter(o=>o.shop_id===s.id&&o.statut==='confirmee'),cms=(S.commerciaux||[]).filter(c=>c.shop_id===s.id);
  let h='<div class="note">Ajoutez vos points de vente (magasin, stand, dépôt) et vos commerciaux. Chaque commercial reçoit son propre lien : les commandes passées avec son lien sont comptées pour lui.</div>';
  h+='<div class="sec-title"><h2>Points de vente</h2><span class="cnt-pill">'+pts.length+'</span></div>';
  h+=pts.map(p=>{const o=ok.filter(x=>ptOf(x,cms)===p.id),pc=cms.filter(c=>c.point_id===p.id);return '<div class="card stack" style="gap:6px"><div class="row between"><b>📍 '+esc(p.nom)+'</b>'+(p.principal?'<span class="badge b-green">Principal</span>':'')+'</div>'+(p.adresse||p.horaires||p.responsable||p.tel?'<div class="small muted">'+esc([p.adresse,p.horaires,p.responsable?'Resp. : '+p.responsable:'',p.tel].filter(Boolean).join(' · '))+'</div>':'')+(pc.length?'<div class="small">👥 Commerciaux : <b>'+pc.map(c=>esc(c.nom)).join(', ')+'</b></div>':'')+'<div class="row between small"><span>'+o.length+' vente'+(o.length>1?'s':'')+' confirmée'+(o.length>1?'s':'')+'</span><b class="num">'+F(sumT(o))+'</b></div><div class="row between"><button type="button" class="linkbtn" data-a="geoPoint" data-id="'+p.id+'">📍 '+(p.lat!=null?'Position enregistrée ✔ (changer)':'Placer sur la carte (ma position)')+'</button><button type="button" class="linkbtn" data-a="delPoint" data-id="'+p.id+'">'+ic('trash',13)+'Supprimer</button></div></div>';}).join('');
  h+='<form class="card stack" data-f="point"><h2 style="font-size:16px">+ Ajouter un point de vente</h2><label class="lbl">Nom<input class="in" name="nom" required maxlength="60" placeholder="Ex. : Boutique Adjamé"></label><div class="grid2"><label class="lbl">Adresse<input class="in" name="adresse" maxlength="160" placeholder="Marché, rue…"></label><label class="lbl">Horaires<input class="in" name="horaires" maxlength="60" placeholder="8h-19h, lun-sam"></label><label class="lbl">Responsable<input class="in" name="responsable" maxlength="60"></label><label class="lbl">Téléphone<input class="in" name="tel" type="tel" maxlength="30"></label></div><label class="row small" style="gap:8px"><input type="checkbox" name="principal" value="1"> Point principal</label><input type="hidden" name="lat"><input type="hidden" name="lng"><button type="button" class="btn btn-w btn-s" data-a="geoFill">📍 Je suis au point de vente : prendre ma position</button><button class="btn btn-v btn-block" type="submit">Ajouter</button></form>';
  h+='<div class="sec-title"><h2>Commerciaux</h2><span class="cnt-pill">'+cms.length+'</span></div>';
  {const mo=monthOf(today()),L=cms.map(c=>({nom:c.nom.split(' ')[0],ventes:S.orders.filter(o=>o.shop_id===s.id&&o.commercial_code===c.code&&o.statut==='confirmee'&&monthOf(o.created_at)===mo).length})).sort((a,b)=>b.ventes-a.ventes);if(L.some(x=>x.ventes))h+=podiumHTML(L,'Podium de '+moisFr(mo));}
  h+=cms.map(c=>{const all=S.orders.filter(o=>o.shop_id===s.id&&o.commercial_code===c.code),v=all.filter(o=>o.statut==='confirmee'),lv=v.filter(o=>o.livree_code),com=Math.round(sumT(lv)*Number(c.commission||0)/100),link=refUrl(s.slug,c.code);
    const msg='Bonjour '+c.nom+' 👋\nVotre lien de vente pour '+s.nom+' (partagez-le à vos clients et sur vos statuts) :\n'+link+'\n\nVotre espace pour suivre vos ventes et votre commission (ne le partagez pas) :\n'+espaceUrl(c.secret);
    return '<div class="card stack" style="gap:8px'+(c.actif?'':';opacity:.6')+'"><div class="row between"><span class="row" style="gap:8px;min-width:0"><span class="av-c">'+esc(c.nom.slice(0,1).toUpperCase())+'</span><span style="min-width:0"><b class="ell" style="display:block">'+esc(c.nom)+'</b><span class="small muted">Code <b>'+esc(c.code)+'</b> · '+esc(String(c.commission))+' %'+(c.tel?' · '+esc(c.tel):'')+'</span></span></span>'+(c.actif?'':'<span class="badge b-grey">En pause</span>')+'</div>'+
    (pts.length?'<div class="chips wrapc"><span class="small muted" style="align-self:center">📍 Point de vente :</span>'+pts.map(p=>'<button type="button" class="chip chip-s'+(c.point_id===p.id?' on':'')+'" data-a="cmPoint" data-id="'+c.id+'" data-v="'+p.id+'">'+esc(p.nom)+'</button>').join('')+'</div>':'')+
    '<div class="relk sm"><div><span>Commandes</span><b class="num">'+all.length+'</b></div><div><span>Ventes</span><b class="num">'+F(sumT(v))+'</b></div><div><span>Livrées ✔</span><b class="num">'+lv.length+'</b></div><div><span>Commission</span><b class="num" style="color:var(--green)">'+F(com)+'</b></div></div>'+
    '<div class="grid2"><button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(link)+'">🔗 Copier son lien</button>'+(c.tel?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.tel)+'?text='+encodeURIComponent(msg)+'">'+ic('wa',16,'#fff')+'Lui envoyer</a>':'<button type="button" class="btn btn-g btn-s" data-a="copy" data-text="'+esc(msg)+'">Copier pour lui</button>')+'</div>'+
    '<div class="row between"><button type="button" class="linkbtn" data-a="cmActif" data-id="'+c.id+'" data-v="'+(c.actif?'0':'1')+'">'+(c.actif?'⏸ Mettre en pause':'▶ Réactiver')+'</button><button type="button" class="linkbtn" data-a="delCm" data-id="'+c.id+'">'+ic('trash',13)+'Supprimer</button></div></div>';}).join('');
  h+='<form class="card stack" data-f="commercial"><h2 style="font-size:16px">+ Ajouter un commercial</h2><div class="grid2"><label class="lbl">Nom<input class="in" name="nom" required maxlength="60" placeholder="Ex. : Koffi"></label><label class="lbl">WhatsApp<input class="in" name="tel" type="tel" maxlength="30"></label></div><label class="lbl">Commission (%)<input class="in" name="commission" inputmode="decimal" value="10"></label>'+(pts.length?'<label class="lbl">Point de vente<select class="in" name="point_id"><option value="">Aucun</option>'+pts.map(p=>'<option value="'+p.id+'">'+esc(p.nom)+'</option>').join('')+'</select></label>':'')+'<p class="small muted" style="margin:0">La commission compte seulement les ventes livrées et confirmées par le code du client.</p><button class="btn btn-v btn-block" type="submit">Ajouter</button></form>';
  return h;}
function vCommercial(sec){
  const d=ui.espace[sec];
  if(d===undefined){ui.espace[sec]=null;sb.rpc('espace_commercial',{sec}).then(r=>{ui.espace[sec]=(r.data&&r.data[0])||false;render(true);},()=>{ui.espace[sec]=false;render(true);});}
  let h='<div class="wrap">'+logoHTML();
  if(!d)return h+'<div class="card">'+(d===false?'<h2 style="font-size:17px">Espace introuvable</h2><p class="muted" style="margin:0">Ce lien n\'est plus valable. Demandez un nouveau lien à la boutique.</p>':'<p class="muted" style="margin:0">Chargement…</p>')+'</div></div>';
  const v=d.ventes||[],ok=v.filter(x=>x.statut==='confirmee'),lv=ok.filter(x=>x.code),com=Math.round(sumT(lv)*Number(d.commission||0)/100),link=refUrl(d.slug,d.code);
  const lab={envoyee:['Nouvelle','b-orange'],confirmee:['Vendue','b-green'],annulee:['Annulée','b-grey']};
  h+='<section class="hero"><span class="ball g" style="right:-24px;top:-24px;width:100px;height:100px"></span><p style="margin:0">Bonjour '+esc(d.nom)+' · commercial de '+esc(d.boutique)+'</p><div class="small" style="color:#E9DDFF;margin-top:8px">Votre commission</div><div class="num" style="position:relative;font-family:var(--display);font-weight:800;font-size:30px">'+F(com)+'</div><div class="small" style="color:#E9DDFF">'+esc(String(d.commission))+' % des ventes livrées et confirmées par le client</div></section>'+
  '<div class="kpis">'+kpi(v.length,'Commandes')+kpi(ok.length,'Ventes confirmées')+kpi(F(sumT(ok)),'Chiffre d\'affaires')+kpi(lv.length,'Livrées ✔')+'</div>'+
  '<section class="card stack"><h2 style="font-size:16px">Votre lien de vente</h2><p class="small muted" style="margin:0">Partagez ce lien à vos clients et sur vos statuts. Chaque commande passée avec ce lien compte pour vous (code <b>'+esc(d.code)+'</b>).</p><div class="linkbox small">'+esc(link)+'</div><div class="grid2"><button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(link)+'">🔗 Copier</button><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('🛍 Commandez chez '+d.boutique+' : '+link)+'">'+ic('wa',16,'#fff')+'Partager</a></div></section>'+
  espacePodium(sec)+
  '<div class="sec-title"><h2>Vos ventes (4 derniers mois)</h2><span class="cnt-pill">'+v.length+'</span></div>'+
  (v.length?'<div class="card" style="padding:4px 14px">'+v.map((x,i)=>'<div class="row between" style="padding:10px 0;'+(i?'border-top:1px solid #F0EAFB':'')+'"><span style="min-width:0"><b style="display:block;font-size:13px">'+esc(x.client||'Client')+' · n° '+esc(String(x.id).toUpperCase())+'</b><span class="small muted">'+esc(dfr(x.date))+(x.code?' · livrée ✔':'')+'</span></span><span class="row" style="gap:6px"><span class="badge '+(lab[x.statut]||lab.envoyee)[1]+'">'+(lab[x.statut]||lab.envoyee)[0]+'</span><b class="num">'+F(x.total)+'</b></span></div>').join('')+'</div>':'<div class="card muted">Pas encore de vente avec votre lien.</div>')+
  '<p class="small muted" style="text-align:center;margin:0">Cette page est personnelle : ne partagez pas son lien.</p>';
  return h+'</div>';}
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
  if(ui.cli)return vvClient(s,ui.cli);
  const m={};S.orders.filter(o=>o.shop_id===s.id&&(o.client_tel||o.client_nom)).forEach(o=>{const k=o.client_tel?waNum(o.client_tel):'nom:'+o.client_nom.toLowerCase();
    const c=m[k]=m[k]||{nom:'',tel:o.client_tel,adresse:'',n:0,ok:0,total:0,last:o.created_at};c.n++;if(o.client_nom)c.nom=c.nom||o.client_nom;if(o.client_adresse)c.adresse=c.adresse||o.client_adresse;
    if(o.statut==='confirmee'){c.ok++;c.total+=o.total;}if(String(o.created_at)>String(c.last))c.last=o.created_at;});
  const L=Object.values(m).sort((a,b)=>b.total-a.total||b.n-a.n);
  return '<div class="kpis">'+kpi(L.length,'Clients','','hero')+kpi(L.filter(c=>c.ok>1).length,'Clients fidèles (2 achats et +)')+kpi(F(L.reduce((a,c)=>a+c.total,0)),'Total dépensé')+'</div>'+
  '<div class="note">Les clients qui laissent leur nom et leur numéro dans le panier apparaissent ici. Ceux qui touchent « Recevoir les promos » sur votre page vous écrivent directement sur WhatsApp : ajoutez-les à votre liste de diffusion.</div>'+
  (L.length?L.map(c=>'<div class="card stack" style="gap:6px"><div class="row between"><b>'+esc(c.nom||'Client')+'</b>'+(c.ok>1?'<span class="badge b-orange">Fidèle</span>':'')+'</div><div class="small muted">'+esc([c.tel,c.adresse].filter(Boolean).join(' · '))+'</div><div class="row between small"><span>'+c.n+' commande'+(c.n>1?'s':'')+' · dernière '+ago(c.last)+'</span><b class="num">'+F(c.total)+'</b></div>'+(c.tel?cliDue(s,c.tel):'')+(c.tel?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.tel)+'?text='+encodeURIComponent('Bonjour '+(c.nom||'')+' 👋 Nouveautés chez '+s.nom+' ! Venez voir : '+shopUrl(s))+'">'+ic('wa',16,'#fff')+'Relancer sur WhatsApp</a>':'')+'</div>').join(''):'<div class="card muted">Pas encore de fiche client.</div>');
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
  const co=DIVERS_OPT.replace('<option','<option'+(s.categorie==='divers'?' selected':''))+CATS().map(x=>'<option value="'+esc(x.id)+'"'+(x.id===s.categorie?' selected':'')+'>'+esc(x.nom)+'</option>').join('');
  const inp=(k,l,ph,t)=>'<label class="lbl">'+l+'<input class="in" id="s-'+k+'" name="'+k+'" '+(t?'type="'+t+'" ':'')+'value="'+esc(s[k])+'" placeholder="'+esc(ph||'')+'"></label>';
  return '<h3 style="font-size:15px">Boutique</h3>'+inp('nom','Nom de la boutique')+(admin?inp('slug','Lien (après #boutique-)'):'')+'<div class="grid2">'+inp('gerant','Nom du gérant')+'<label class="lbl">Catégorie<select class="in" id="s-categorie" name="categorie">'+co+'</select></label></div>'+
  '<label class="lbl">Description de la boutique<textarea class="in" id="s-description" name="description" rows="3">'+esc(s.description)+'</textarea></label>'+
  '<h3 style="font-size:15px">Contacts</h3><div class="grid2">'+inp('whatsapp','WhatsApp (commandes)','07 XX XX XX XX','tel')+inp('telegram','Telegram','@nom')+inp('telephone','Téléphone d\'appel','','tel')+inp('email','E-mail','facultatif','email')+inp('facebook','Facebook','lien de la page')+inp('tiktok','TikTok','@compte')+'</div>'+
  '<h3 style="font-size:15px">Localisation et livraison</h3>'+locFields('s',s)+''+inp('adresse','Adresse ou point de repère')+'<div class="grid2">'+inp('livraison_zones','Zones de livraison')+inp('livraison_frais','Frais de livraison (F)')+'</div>'+('paiement_livraison' in s?'<label class="lbl">Paiement à la livraison<select class="in" name="paiement_livraison"><option value="oui"'+(s.paiement_livraison!==false?' selected':'')+'>Oui, j\'accepte (recommandé, inspire confiance)</option><option value="non"'+(s.paiement_livraison===false?' selected':'')+'>Non, je demande le paiement avant</option></select></label>':'');
}
const PIECES=[['cni','🪪','CNI'],['passeport','📘','Passeport'],['scolaire','🎓','Carte scolaire'],['consulaire','🏛','Carte consulaire'],['permis','🚗','Permis'],['attestation','📄','Attestation']];
function verifHTML(s){const pv=S.priv[s.id]||{},vd=ui.vd=ui.vd||{type:'cni',num:''};
  if(s.verification==='verifie')return '<section class="card stack"><h3 style="font-size:15px">Vérification</h3><div class="good">✅ Votre boutique est vérifiée. Le badge s\'affiche sur votre page.</div></section>';
  const shot=(k,lab)=>'<label class="vshot'+(vd[k]?' ok':'')+'">'+(vd[k]?'<img src="'+vd[k].url+'" alt="">'+'<span>✔ '+lab+'</span>':'<span class="cam">📷</span><span>'+lab+'</span>')+'<input type="file" accept="image/*" capture="environment" data-file="vd-'+k+'" hidden></label>';
  return '<section class="card stack" id="verif"><h3 style="font-size:15px">Faire vérifier ma boutique</h3>'+
  (s.verification==='refuse'?'<div class="warn"><b>Vérification refusée.</b> '+esc(s.motif_refus||'')+' Vous pouvez envoyer de nouvelles photos.</div>':pv.cni?'<div class="warn"><b>⏳ En attente de vérification</b><br><span class="small">'+esc(pv.cni)+'. Réponse en général sous 24 h.</span></div>':'<div class="good">Le badge <b>Vendeur vérifié</b> rassure les clients : ils achètent plus.</div>')+
  '<b class="small">1. Quelle pièce avez-vous ?</b><div class="vdocs">'+PIECES.map(x=>'<button type="button" class="'+(vd.type===x[0]?'on':'')+'" data-a="vdType" data-id="'+x[0]+'"><i>'+x[1]+'</i>'+x[2]+'</button>').join('')+'</div>'+
  '<label class="lbl">2. Numéro de la pièce<input class="in" data-i2="vdNum" maxlength="40" value="'+esc(vd.num)+'" placeholder="'+(vd.type==='scolaire'?'Matricule et nom de l\'école':'Ex. : C 0123 4567 89')+'"></label>'+
  '<b class="small">3. Photos</b><div class="row" style="gap:10px">'+shot('recto','Recto de la pièce')+shot('selfie','Selfie avec la pièce')+'</div>'+
  '<div class="note small">🔒 Vos photos sont gardées dans un coffre privé. Seule l\'équipe '+esc(S.settings.nom||'Gbairai Market')+' peut les voir, jamais les clients.</div>'+
  '<button type="button" class="btn btn-v btn-block" data-a="vdSend"'+(ui.vdBusy?' disabled':'')+'>'+(ui.vdBusy?'⏳ Envoi en cours…':'🔒 Envoyer pour vérification')+'</button></section>';}
function aVerifs(){const L=S.shops.filter(s=>s.verification!=='verifie'&&s.statut!=='suspendu').sort((a,b)=>(!!(S.priv[b.id]||{}).cni)-(!!(S.priv[a.id]||{}).cni)||String(b.created_at).localeCompare(String(a.created_at)));
  return '<section class="card stack"><h2 style="font-size:17px">Vérifications ('+L.filter(s=>(S.priv[s.id]||{}).cni).length+' à traiter)</h2><div class="note small">Touchez « Voir les photos », comparez avec le nom de la boutique, puis validez. Au refus, écrivez le motif : le vendeur le voit.</div></section>'+
  (L.length?L.map(s=>{const pv=S.priv[s.id]||{},r=ui.vdRef===s.id;return '<section class="card stack" style="gap:10px"><div class="row" style="gap:12px">'+ctAv(s.logo,s.nom,s.id,enLigne(s))+'<div style="flex:1;min-width:0"><b>'+esc(s.nom)+'</b><div class="small muted">'+(pv.cni?esc(pv.cni):'Pas encore de pièce envoyée')+'</div></div>'+(s.verification==='refuse'?'<span class="badge b-red">Refusée</span>':'<span class="badge b-orange">En attente</span>')+'</div>'+
    (r?'<form class="row" style="gap:8px" data-f="vdRefus" data-id="'+s.id+'"><input class="in" name="motif" required maxlength="200" placeholder="Motif : photo floue, nom différent…" style="flex:1"><button class="btn btn-o btn-s" type="submit">Refuser</button><button type="button" class="btn btn-w btn-s" data-a="vdRefOff">✕</button></form>':
    (pv.cni?(ui.vdPics&&ui.vdPics[s.id]?'<div class="row" style="gap:8px">'+['recto','selfie'].map(k=>ui.vdPics[s.id][k]?'<a href="'+esc(ui.vdPics[s.id][k])+'" target="_blank" rel="noopener" class="vpic"><img src="'+esc(ui.vdPics[s.id][k])+'" alt="'+k+'"><span>'+(k==='recto'?'Recto':'Selfie')+'</span></a>':'<span class="vpic none">'+(k==='recto'?'Recto':'Selfie')+' absent</span>').join('')+'</div>':'<button type="button" class="btn btn-w btn-s" data-a="vdVoir" data-id="'+s.id+'">👁 Voir les photos</button>'):'')+
    '<div class="row" style="gap:8px"><button type="button" class="btn btn-g btn-s" style="flex:1" data-a="aVerif" data-id="'+s.id+'">✅ Valider</button><button type="button" class="btn btn-w btn-s" style="flex:1" data-a="vdRefOn" data-id="'+s.id+'">✖ Refuser</button><a class="btn btn-w btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'" aria-label="Écrire au vendeur">💬</a></div>')+'</section>';}).join(''):'<div class="card muted" style="text-align:center">Tous les vendeurs sont vérifiés 🎉</div>');}
function vvReglages(s){
  const pv=S.priv[s.id]||{};
  return themeCard(s)+prefsHTML()+'<section class="card row" style="gap:14px">'+avatar(s,72)+'<div class="stack" style="gap:8px;min-width:0"><b>Logo de la boutique</b><span class="small muted">Carré de préférence. Il s\'affiche sur l\'accueil et sur votre page.</span><div class="row" style="gap:8px"><label class="btn btn-v btn-s">'+(s.logo?'Changer':'Ajouter mon logo')+'<input type="file" accept="image/*" data-file="logo" hidden></label>'+(s.logo?'<button type="button" class="btn btn-w btn-s" data-a="rmLogo">Retirer</button>':'')+'</div></div></section>'+
  '<form class="card stack" data-f="shop" data-id="'+s.id+'">'+shopFields(s,false)+'<button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>'+verifHTML(s)+
  '<form class="card stack" data-f="pwd"><h3 class="row" style="font-size:15px;gap:6px">'+ic('key',16,'#5B21B6')+'Changer mon mot de passe</h3><label class="lbl">Nouveau mot de passe<input class="in" name="password" type="password" required minlength="6" autocomplete="new-password"></label><label class="lbl">Répéter le mot de passe<input class="in" name="password2" type="password" required minlength="6" autocomplete="new-password"></label><button class="btn btn-w btn-block" type="submit">Changer le mot de passe</button></form>'+
  '<button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button>';
}

/* ---------- ADMIN ---------- */
function vAdmin(){
  if(!S.user)return authForms('Espace administrateur','Connectez-vous avec votre compte administrateur.',false);
  if(!isAdmin())return '<div class="wrap">'+logoHTML()+'<div class="card stack"><h1 style="font-size:19px">Accès réservé</h1><p class="muted" style="margin:0">Ce compte n\'est pas administrateur.</p><button type="button" class="btn btn-w" data-a="logout">Se déconnecter</button></div></div>';
  const tabs=[['tableau','Tableau de bord'],['stats','📊 Statistiques'],['contacts','💬 Contacts'],['verifs','✅ Vérifications'+((()=>{const n=S.shops.filter(s=>s.verification==='attente'&&(S.priv[s.id]||{}).cni).length;return n?' ('+n+')':'';})())],['vendeurs','Vendeurs'],['paiements','Paiements'],['bannieres','Bannières'],['moderation','Avis et signalements'],['litiges','Litiges'+((S.litiges||[]).length?' ('+S.litiges.length+')':'')],['produits','Produits'],['commandes','Commandes'],['catalogue','Catégories et quartiers'],['annonces','📣 Annonces'],['aide','Aide'],['parametres','Paramètres']];
  const wait=S.shops.filter(s=>s.verification==='attente').length,payW=S.payments.filter(p=>p.statut==='attente').length,repW=S.reports.filter(r=>r.statut==='nouveau').length;
  const h='<div class="wrap wide"><div class="row between wrapx">'+logoHTML()+'<div class="row"><span class="badge b-violet">Administrateur</span><button type="button" class="btn btn-w btn-s" data-a="logout">Se déconnecter</button></div></div><div class="tabs">'+tabs.map(t=>'<button type="button" class="tab'+(ui.aTab===t[0]?' on':'')+'" data-a="atab" data-id="'+t[0]+'">'+t[1]+(t[0]==='vendeurs'&&wait?' <span class="badge b-orange">'+wait+'</span>':'')+(t[0]==='paiements'&&payW?' <span class="badge b-orange">'+payW+'</span>':'')+(t[0]==='moderation'&&repW?' <span class="badge b-orange">'+repW+'</span>':'')+'</button>').join('')+'</div>';
  if(ui.aTab==='vendeurs'&&ui.adminShop)return h+aFiche(shopById(ui.adminShop))+'</div>';
  return h+({tableau:aTableau,stats:aStats,contacts:aContacts,verifs:aVerifs,vendeurs:aVendeurs,paiements:aPaiements,bannieres:aBannieres,moderation:aModeration,litiges:aLitiges,produits:aProduits,commandes:aCommandes,catalogue:aCatalogue,annonces:aAnnonces,aide:aAide,parametres:aParams}[ui.aTab]||aTableau)()+'</div>';
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
/* ---------- ADMIN : STATISTIQUES ---------- */
const ST_PER=[['1','Aujourd\'hui'],['7','7 jours'],['30','30 jours'],['90','90 jours']];
function stLoad(){const d=ui.stD||7;ui.stats={d:d,loading:true};sb.rpc('stats_admin',{jours:d}).then(r=>{ui.stats={d:d,data:r.error?null:r.data,err:r.error?errMsg(r.error):null};render(true);},()=>{ui.stats={d:d,err:'Pas de connexion internet.'};render(true);});}
function telFmt(t){t=String(t||'').replace(/\D/g,'');if(t.length===13&&t.startsWith('225'))t=t.slice(3);return t.replace(/(\d{2})(?=\d)/g,'$1 ');}
function stNum(n){return String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function stCard(title,body,sub){return '<section class="card stack"><div class="row between wrapx" style="gap:6px"><h2 style="font-size:17px">'+title+'</h2>'+(sub?'<span class="small muted">'+sub+'</span>':'')+'</div>'+body+'</section>';}
function stMeters(rows){const m=Math.max(1,...rows.map(r=>r[1]));return rows.length?rows.map(r=>'<div class="row small"><span class="ell" style="width:120px">'+r[0]+'</span><span class="bar"><span style="width:'+(r[1]/m*100)+'%"></span></span><b class="num" style="min-width:34px;text-align:right">'+r[2]+'</b></div>').join(''):'<p class="muted" style="margin:0">Pas encore de données.</p>';}
function aDormants(){const lim=Date.now()-7*DAY,L=S.shops.filter(s=>s.statut==='actif'&&new Date(s.vu_le||s.created_at).getTime()<lim).sort((a,b)=>new Date(a.vu_le||a.created_at)-new Date(b.vu_le||b.created_at));
  const show=ui.stDormAll?L:L.slice(0,8),site=location.origin+'/#vendeur';
  const msg=s=>'Bonjour '+(s.gerant||s.nom)+' 👋 Ici l\'équipe '+(S.settings.nom||'Gbairai Market')+'. Votre boutique « '+s.nom+' » vous attend : des clients passent la voir. Ajoutez vos nouveaux articles et vos promos ici : '+site;
  return stCard('😴 Vendeurs endormis','<p class="small muted" style="margin:0">Pas connectés depuis plus de 7 jours. Un petit message les fait souvent revenir.</p>'+(L.length?show.map(s=>'<div class="row between rank" style="gap:10px"><span class="row" style="gap:10px;min-width:0">'+avatar(s,34)+'<span class="stack" style="gap:0;min-width:0"><b class="ell">'+esc(s.nom)+'</b><span class="small muted">'+(s.vu_le?'Vu '+ago(s.vu_le):'Jamais connecté')+' · '+esc(place(s))+'</span></span></span>'+(s.whatsapp?'<a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(msg(s))+'">Relancer</a>':'')+'</div>').join('')+(L.length>8?'<button type="button" class="btn btn-w btn-s" data-a="stDormAll">'+(ui.stDormAll?'Voir moins':'Voir les '+L.length)+'</button>':''):'<p class="muted" style="margin:0">Tous vos vendeurs sont actifs. 👏</p>'),L.length?L.length+' vendeur'+(L.length>1?'s':''):'');}
function aStats(){
  const D=ui.stD||7;if(!ui.stats||ui.stats.d!==D)stLoad();
  const so=ui.stats||{},x=so.data;
  let h='<div class="row between wrapx" style="gap:10px"><h2 style="font-size:19px">Statistiques du site</h2><div class="row wrapx" style="gap:6px">'+ST_PER.map(p=>'<button type="button" class="chip'+(String(D)===p[0]?' on':'')+'" data-a="stPer" data-id="'+p[0]+'">'+p[1]+'</button>').join('')+'<button type="button" class="chip" data-a="stReload" aria-label="Actualiser">↻ Actualiser</button></div></div>';
  if(so.err)return h+'<div class="card stack"><b>Les statistiques ne sont pas encore prêtes.</b><p class="muted" style="margin:0">Il reste une étape : collez le fichier <b>supabase/mise-a-jour-14.sql</b> dans Supabase › SQL Editor, puis touchez Run. Les chiffres commencent à partir de ce moment-là.</p><p class="small muted" style="margin:0">Détail : '+esc(so.err)+'</p></div><div class="gridf">'+aDormants()+'</div>';
  if(!x)return h+'<div class="card"><p class="muted" style="margin:0">Chargement des statistiques…</p></div>';
  const Op=S.orders.filter(o=>Date.now()-new Date(o.created_at)<D*DAY),vis=x.visiteurs||0;
  const pctC=vis?Math.round((x.commandeurs||0)/vis*1000)/10:0;
  h+='<div class="kpis">'+kpi(stNum(vis),'Visiteurs',D<90?trend(vis,x.visiteurs_avant||0):'','hero')+
    kpi(stNum(x.pages),'Pages vues','<em>'+(vis?String(Math.round(x.pages/vis*10)/10).replace('.',','):0)+' pages par visiteur</em>')+
    kpi(stNum(x.cx_vendeurs),'Connexions vendeurs','<em>'+x.cx_vendeurs_diff+' vendeur'+(x.cx_vendeurs_diff>1?'s':'')+' différent'+(x.cx_vendeurs_diff>1?'s':'')+'</em>')+
    kpi(stNum(x.cx_clients),'Connexions clients','<em>'+x.cx_clients_diff+' client'+(x.cx_clients_diff>1?'s':'')+' différent'+(x.cx_clients_diff>1?'s':'')+'</em>')+
    kpi(String(pctC).replace('.',',')+' %','Visiteurs qui commandent','<em>'+stNum(x.commandeurs)+' visiteur'+(x.commandeurs>1?'s':'')+'</em>')+
    kpi(stNum(x.paniers_abandon),'Paniers abandonnés','<em class="down">sur '+stNum(x.paniers)+' panier'+(x.paniers>1?'s':'')+'</em>')+'</div>';
  // Visiteurs par jour
  const n=Math.max(1,Math.min(D,30)),keys=[];for(let i=n-1;i>=0;i--)keys.push(dayKey(Date.now()-i*DAY));
  const pj={};(x.par_jour||[]).forEach(r=>pj[r.j]=r);const mv=Math.max(1,...keys.map(k=>(pj[k]||{}).v||0));
  const jours=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const chart='<div class="stbars">'+keys.map((k,i)=>{const r=pj[k]||{v:0,c:0},d=new Date(k+'T12:00:00');return '<div title="'+k.slice(8)+'/'+k.slice(5,7)+' : '+r.v+' visiteur(s), '+r.c+' ont commandé"><span class="v'+(i===n-1?' t':'')+'" style="height:'+(r.v/mv*100)+'%"><i style="height:'+(r.v?r.c/r.v*100:0)+'%"></i></span>'+(n<=10?'<em>'+(i===n-1?'Auj.':jours[d.getDay()]+' '+d.getDate())+'</em>':'')+'</div>';}).join('')+'</div><div class="row small muted" style="gap:14px"><span class="row" style="gap:5px"><i class="sw" style="background:#D9CCF7"></i>Visiteurs</span><span class="row" style="gap:5px"><i class="sw" style="background:#FF7A1A"></i>Ont commandé</span></div>';
  const hr=Array(24).fill(0);(x.par_heure||[]).forEach(r=>hr[r.h]=r.n);const mh=Math.max(1,...hr);
  let bi=0,bv=-1;for(let i=0;i<23;i++){const v=hr[i]+hr[i+1];if(v>bv){bv=v;bi=i;}}
  const heat='<div class="sthr">'+hr.map((v,i)=>'<span title="'+i+' h : '+v+' pages vues" style="background:rgba(124,58,237,'+(0.07+v/mh*0.93).toFixed(2)+')"></span>').join('')+'</div><div class="row between small muted"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span></div>';
  h+='<div class="gridf">'+stCard('Visiteurs par jour',chart,n>1?n+' derniers jours':'aujourd\'hui')+
    stCard('Heures les plus actives',heat+(bv>0?'<p class="small" style="margin:0">💡 Meilleur moment pour publier : <b>'+bi+' h – '+(bi+2)+' h</b></p>':''),'pages vues par heure');
  // Boutiques
  const B=(x.boutiques||[]).map(b=>Object.assign({s:shopById(b.id)},b)).filter(b=>b.s);
  const cmd=id=>Op.filter(o=>o.shop_id===id).length;
  h+=rankList('Boutiques les plus visitées',B.slice(0,8).map(b=>[avatar(b.s,30)+esc(b.s.nom),stNum(b.v)+' visites · '+cmd(b.id)+' cmd']));
  const W=B.filter(b=>b.wa+b.tg>0).sort((a,b)=>(b.wa+b.tg)-(a.wa+a.tg)).slice(0,8);
  h+=rankList('Clics WhatsApp et Telegram',W.map(b=>[avatar(b.s,30)+esc(b.s.nom),'💬 '+b.wa+(b.tg?' · ✈️ '+b.tg:'')]),'Aucun clic pour l\'instant.');
  // Villes et appareils
  const V=x.villes||[],tv=Math.max(1,V.reduce((a,r)=>a+r.n,0)),ap={};(x.appareils||[]).forEach(r=>ap[r.a]=r.n);const ta=Math.max(1,(ap.tel||0)+(ap.pc||0));
  h+=stCard('Villes des visiteurs',stMeters(V.map(r=>[esc(r.ville),r.n,Math.round(r.n/tv*100)+' %']))+'<div class="row between small" style="margin-top:4px"><b>📱 Téléphone '+Math.round((ap.tel||0)/ta*100)+' %</b><b>💻 Ordinateur '+Math.round((ap.pc||0)/ta*100)+' %</b></div>','selon la connexion internet');
  // Recherches
  const R=x.recherches||[],Rv=R.filter(r=>r.vide);
  h+=rankList('Ce que les clients cherchent',R.slice(0,8).map(r=>[esc(r.q)+(r.vide?' <span class="badge b-red">0 résultat</span>':''),r.n+' pers.']),'Aucune recherche pour l\'instant.');
  h+=stCard('🔎 Cherché sans rien trouver',(Rv.length?'<p class="small muted" style="margin:0">Trouvez des vendeurs qui proposent ces articles : les clients les attendent.</p>'+Rv.slice(0,8).map(r=>'<div class="row between rank"><b>'+esc(r.q)+'</b><span class="small">'+r.n+' personne'+(r.n>1?'s':'')+'</span></div>').join(''):'<p class="muted" style="margin:0">Les clients trouvent ce qu\'ils cherchent. 👍</p>'));
  // Paniers abandonnés
  const AP=(x.abandon_produits||[]).map(r=>[prodById(r.id),r.n]).filter(r=>r[0]);
  h+=stCard('🛒 Paniers abandonnés','<p class="small muted" style="margin:0"><b>'+stNum(x.paniers_abandon)+'</b> visiteur'+(x.paniers_abandon>1?'s ont':' a')+' mis un article au panier sans commander.</p>'+(AP.length?'<b class="small">Articles laissés dans le panier</b>'+AP.map(r=>'<div class="row between rank"><a class="ell" href="#produit-'+r[0].id+'">'+esc(r[0].nom)+'</a><span class="small">'+r[1]+' fois</span></div>').join(''):''));
  // Produits regardés mais peu commandés
  const oq={};Op.forEach(o=>(o.items||[]).forEach(it=>{if(it.pid)oq[it.pid]=(oq[it.pid]||0)+n0(it.qty);}));
  const PV=(x.produits_vus||[]).map(r=>({p:prodById(r.id),o:oq[r.id]||0,v:r.v})).filter(r=>r.p&&r.v>=3&&r.o/r.v<0.1).slice(0,6);
  h+=stCard('👀 Très regardés, peu commandés',(PV.length?'<p class="small muted" style="margin:0">Prix trop haut ou photo à refaire ? Conseillez le vendeur.</p>'+PV.map(r=>'<div class="row between rank" style="gap:8px"><a class="ell" style="flex:1;min-width:0" href="#produit-'+r.p.id+'">'+esc(r.p.nom)+'</a><span class="small" style="white-space:nowrap">'+r.v+' vues · '+r.o+' cmd</span></div>').join(''):'<p class="muted" style="margin:0">Rien à signaler pour l\'instant.</p>'));
  h+=aDormants()+'</div>';
  // Connexions
  const F_=ui.cxF||'tout',C=(x.connexions||[]).filter(c=>F_==='tout'||(F_==='echec'?c.k==='echec':c.k==='connexion'&&c.role===F_));
  const roleB={vendeur:'<span class="badge b-violet">Vendeur</span>',client:'<span class="badge b-blue">Client</span>',admin:'<span class="badge b-dark">Admin</span>'};
  const who=c=>{const sh=c.shop&&shopById(c.shop);if(sh)return avatar(sh,30)+'<span class="ell">'+esc(sh.nom)+'</span>';const nm=c.role==='admin'?'Vous':c.nom||(c.uid?'Client':'Numéro inconnu');return ctAv(null,nm,c.uid||c.tel,false).replace('class="tav"','class="tav sm"')+'<span class="ell">'+esc(nm)+(c.tel&&c.role!=='admin'?' · '+esc(telFmt(c.tel)):'')+'</span>';};
  const AL=(x.alertes||[]).map(a=>{const c=(x.connexions||[]).find(c=>c.k==='echec'&&c.tel===a.tel),sh=c&&c.shop&&shopById(c.shop);return '<div class="stalert">⚠ '+a.n+' mots de passe incorrects sur le compte « '+esc(sh?sh.nom:telFmt(a.tel))+' » '+quand(a.t)+'. Vérifiez avec la personne.</div>';}).join('');
  const lim=ui.cxAll?300:40;
  h+='<section class="card stack"><div class="row between wrapx" style="gap:8px"><h2 style="font-size:17px">Suivi des connexions</h2><span class="small muted"><i class="stdot"></i>'+stNum(x.en_ligne)+' visiteur'+(x.en_ligne>1?'s':'')+' en ce moment · gardé 90 jours</span></div>'+
    '<div class="row wrapx" style="gap:6px">'+[['tout','Tout'],['vendeur','Vendeurs'],['client','Clients'],['admin','Admin'],['echec','Échecs']].map(f=>'<button type="button" class="chip'+(F_===f[0]?' on':'')+'" data-a="cxF" data-id="'+f[0]+'">'+f[1]+'</button>').join('')+'</div>'+AL+
    (C.length?'<div class="cxlist"><div class="cxrow cxh"><span>Quand</span><span>Qui</span><span>Rôle</span><span>Résultat</span><span>Appareil · Ville</span></div>'+C.slice(0,lim).map(c=>'<div class="cxrow"><span class="small">'+quand(c.t).replace(/^à /,'Aujourd\'hui ').replace(/^hier/,'Hier').replace(/^le /,'')+'</span><span class="row cxwho" style="gap:8px;min-width:0">'+who(c)+'</span><span>'+(roleB[c.role]||'')+'</span><span>'+(c.k==='echec'?'<b class="cxko">✗ Mot de passe incorrect</b>':'<b class="cxok">✓ Connecté</b>')+'</span><span class="small muted">'+esc([c.app,c.ville].filter(Boolean).join(' · '))+'</span></div>').join('')+'</div>'+(C.length>lim?'<button type="button" class="btn btn-w btn-s" data-a="cxAll">Voir plus</button>':''):'<p class="muted" style="margin:0">Aucune connexion sur cette période.</p>')+'</section>';
  return h;
}
const badgeVerif=s=>s.verification==='verifie'?'<span class="badge b-blue">Vérifié</span>':s.verification==='refuse'?'<span class="badge b-grey">Refusé</span>':'<span class="badge b-amber">En attente</span>';
const CT_COLS=['#6D28D9','#FF7A1A','#0E7A5F','#2563EB','#DB2777','#E11D48','#0891B2','#CA8A04','#7C3AED'];
function ctCol(k){let h=0;for(const c of String(k))h=(h*31+c.charCodeAt(0))>>>0;return CT_COLS[h%CT_COLS.length];}
function quand(d){if(!d)return '';const t=new Date(d),n=new Date(),hm=String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
  const j=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),diff=Math.round((j(n)-j(t))/864e5);
  return diff<=0?'à '+hm:diff===1?'hier à '+hm:'le '+String(t.getDate()).padStart(2,'0')+'/'+String(t.getMonth()+1).padStart(2,'0')+(t.getFullYear()!==n.getFullYear()?'/'+String(t.getFullYear()).slice(2):'');}
function ctAv(img,nom,key,on,big){return '<div class="tav'+(big?' big':'')+'" style="background:'+(img?'#fff':ctCol(key))+'">'+(img?'<img src="'+esc(img)+'" alt="" loading="lazy">':esc(initials(nom||'?')))+(on?'<i class="on" aria-label="En ligne"></i>':'')+'</div>';}
function ctShopStatus(s){return enLigne(s)?'<span class="live">en ligne</span>':s.vu_le?'<span>'+(Date.now()-new Date(s.vu_le)<864e5*2?'en ligne ':'vu ')+quand(s.vu_le)+'</span>':'<span>jamais connecté</span>';}
function ctShopBadge(s){return s.statut==='suspendu'?'<span class="badge b-red">Suspendu</span>':s.verification==='attente'?'<span class="badge b-orange">En attente</span>':s.formule==='pro'?'<span class="badge b-violet">PRO</span>':s.verification==='verifie'?'<span class="badge b-green">✅ Vérifié</span>':'';}
function aContacts(){if(ui.ctSel)return ctFiche();
  const t=ui.ctTab||'vendeurs',qq=(ui.ctQ||'').trim().toLowerCase();
  const V=S.shops.slice().sort((a,b)=>(enLigne(b)-enLigne(a))||String(b.vu_le||'').localeCompare(String(a.vu_le||'')));
  const C=clientsAgg(S.orders).sort((a,b)=>String(b.last).localeCompare(String(a.last)));
  const vRow=s=>'<button type="button" class="trow" data-a="ctOpen" data-id="v:'+s.id+'">'+ctAv(s.logo,s.nom,s.id,enLigne(s))+'<span class="tx"><b>'+esc(s.nom)+'</b>'+ctShopStatus(s)+'</span>'+ctShopBadge(s)+'</button>';
  const cKey=c=>c.tel?waNum(c.tel):'nom:'+String(c.nom).toLowerCase();
  const cRow=c=>'<button type="button" class="trow" data-a="ctOpen" data-id="c:'+esc(cKey(c))+'">'+ctAv(null,c.nom||'Client',cKey(c),false)+'<span class="tx"><b>'+esc(c.nom||'Client')+'</b><span>a commandé '+quand(c.last)+(c.shops.size?' · '+esc([...c.shops].join(', ')):'')+'</span></span><span class="tot num">'+F(c.total)+'</span></button>';
  const mV=V.filter(s=>!qq||(s.nom+' '+s.whatsapp+' '+place(s)).toLowerCase().includes(qq)),mC=C.filter(c=>!qq||(c.nom+' '+c.tel+' '+c.adresse).toLowerCase().includes(qq));
  const tabs=[['tous','Tous',V.length+C.length],['vendeurs','Vendeurs',V.length],['clients','Clients',C.length]];
  let h='<section class="card ctbox"><div class="row between"><h2 class="ct-h">Contacts</h2><button type="button" class="icon-btn" data-a="cliCSVall" aria-label="Télécharger les clients en Excel" title="Télécharger les clients (Excel)">⬇</button></div>'+
  '<div class="cttabs">'+tabs.map(x=>'<button type="button" class="'+(t===x[0]?'on':'')+'" data-a="ctTab" data-id="'+x[0]+'">'+x[1]+' <em>'+x[2]+'</em></button>').join('')+'</div>'+
  '<label class="search" style="margin:8px 0 4px;box-shadow:none;border:1.5px solid #E2D9F8">'+ic('search',18,'#6B5B8C')+'<input type="search" placeholder="Nom, numéro, quartier…" value="'+esc(ui.ctQ||'')+'" data-i="ctQ" aria-label="Chercher un contact"></label><div class="tlist">';
  if(t!=='clients'){if(t==='tous'&&mV.length)h+='<div class="tsec">Vendeurs · '+S.shops.filter(enLigne).length+' en ligne</div>';h+=mV.map(vRow).join('');}
  if(t!=='vendeurs'){if(t==='tous'&&mC.length)h+='<div class="tsec">Clients</div>';h+=mC.map(cRow).join('');}
  if(!(t!=='clients'&&mV.length)&&!(t!=='vendeurs'&&mC.length))h+='<p class="muted" style="text-align:center;padding:20px">Aucun contact'+(qq?' pour « '+esc(qq)+' »':'')+'.</p>';
  return h+'</div></section>';}
function ctFiche(){const [k,id]=[ui.ctSel.slice(0,1),ui.ctSel.slice(2)];
  const kv=(a,b)=>'<div class="kv"><span>'+a+'</span><b>'+b+'</b></div>';
  const act=(href,ico,bg,lab,data)=>(href?'<a target="_blank" rel="noopener" href="'+href+'"':'<button type="button" '+data)+' class="ctact"><i style="background:'+bg+'">'+ico+'</i>'+lab+(href?'</a>':'</button>');
  let h='<section class="card ctfiche"><div class="row"><button type="button" class="icon-btn" data-a="ctBack" aria-label="Retour aux contacts">'+ic('back')+'</button><h2 style="font-size:18px;margin:0">Contact</h2></div>';
  if(k==='v'){const s=shopById(id);if(!s){ui.ctSel=null;return aContacts();}
    const ords=S.orders.filter(o=>o.shop_id===s.id),mois=new Date().toISOString().slice(0,7),vm=sumT(ords.filter(o=>o.statut==='confirmee'&&String(o.created_at).slice(0,7)===mois));
    h+='<div class="cthead">'+ctAv(s.logo,s.nom,s.id,enLigne(s),true)+'<h2>'+esc(s.nom)+'</h2><div class="ctst">'+ctShopStatus(s)+'</div><div class="small muted">'+esc(place(s))+' · Inscrite le '+esc(dfr(new Date(s.created_at)))+'</div></div>'+
    '<div class="ctacts">'+act('https://wa.me/'+waNum(s.whatsapp),'💬','#0E7A5F','WhatsApp')+act('tel:'+esc(String(s.telephone||s.whatsapp).replace(/[^\d+]/g,'')),'📞','#2563EB','Appeler')+act('#boutique-'+esc(s.slug),'🏪','#6D28D9','Boutique')+act(null,'📣','#FF7A1A','Annonce','data-a="atab" data-id="annonces"')+'</div>'+
    '<div class="ctinfo">'+kv('WhatsApp',esc(s.whatsapp||'—'))+kv('Formule',s.formule==='pro'?'<span class="badge b-violet">PRO</span>'+(s.pro_fin?' jusqu\'au '+esc(dfr(new Date(s.pro_fin))):''):'Gratuit')+kv('Vérification',s.verification==='verifie'?'<span class="badge b-green">✅ Vérifiée</span>':s.verification==='refuse'?'<span class="badge b-red">Refusée</span>':'<span class="badge b-orange">En attente</span>')+kv('Statut',s.statut==='suspendu'?'<span class="badge b-red">Suspendue</span>':'Active')+kv('Produits',shopProducts(s.id).length)+kv('Ventes ce mois',F(vm))+kv('Clients',clientsAgg(ords).length)+'</div>'+
    '<div class="grid2"><button type="button" class="btn btn-w" data-a="aSusp" data-id="'+s.id+'">'+(s.statut==='actif'?'⏸ Suspendre':'▶ Réactiver')+'</button><button type="button" class="btn btn-w" data-a="aOpen" data-id="'+s.id+'">⚙ Gérer</button></div>';
  }else{const C=clientsAgg(S.orders),c=C.find(x=>(x.tel?waNum(x.tel):'nom:'+String(x.nom).toLowerCase())===id);if(!c){ui.ctSel=null;return aContacts();}
    const os=S.orders.filter(o=>(o.client_tel?waNum(o.client_tel):'nom:'+String(o.client_nom).toLowerCase())===id).slice(0,8);
    h+='<div class="cthead">'+ctAv(null,c.nom||'Client',id,false,true)+'<h2>'+esc(c.nom||'Client')+'</h2><div class="ctst"><span>a commandé '+quand(c.last)+'</span></div><div class="small muted">Client depuis le '+esc(dfr(new Date(c.first)))+'</div></div>'+
    (c.tel?'<div class="ctacts">'+act('https://wa.me/'+waNum(c.tel),'💬','#0E7A5F','WhatsApp')+act('tel:'+esc(String(c.tel).replace(/[^\d+]/g,'')),'📞','#2563EB','Appeler')+'</div>':'')+
    '<div class="ctinfo">'+kv('Téléphone',esc(c.tel||'—'))+kv('Adresse',esc(c.adresse||'—'))+kv('Commandes',c.n+' (dont '+c.ok+' confirmée'+(c.ok>1?'s':'')+')')+kv('Total dépensé',F(c.total))+kv('Boutiques',esc([...c.shops].join(', ')||'—'))+'</div>'+
    '<h3 style="font-size:15px;margin:6px 0 0">Dernières commandes</h3><div class="ctinfo">'+os.map(o=>kv(esc(quand(o.created_at))+' · '+esc((shopById(o.shop_id)||{}).nom||''),F(o.total)+' <span class="small muted">'+({envoyee:'envoyée',confirmee:'confirmée',annulee:'annulée'}[o.statut]||'')+'</span>')).join('')+'</div>';}
  return h+'</section>';}
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
  return '<section class="card stack"><div class="row between wrapx" style="gap:8px"><h2 style="font-size:17px">Commandes ('+S.orders.length+')</h2><button type="button" class="btn btn-w btn-s" data-a="cliCSVall">⬇ Tous les clients (Excel)</button></div>'+(S.orders.length?'<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Boutique</th><th>Articles</th><th>Total</th><th>Canal</th><th>Statut</th></tr></thead><tbody>'+S.orders.map(x=>{const s=shopById(x.shop_id);return '<tr><td>'+esc(String(x.created_at).slice(0,16).replace('T',' '))+'</td><td>'+esc(s?s.nom:'?')+'</td><td>'+(x.items||[]).map(i=>i.qty+' × '+esc(i.nom)).join('<br>')+'</td><td class="num"><b>'+fmtN(x.total)+' F</b></td><td>'+(x.canal==='telegram'?'Telegram':'WhatsApp')+'</td><td>'+lab[x.statut]+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="muted" style="margin:0">Aucune commande pour l\'instant.</p>')+'</section>';
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
  '<button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>'+aFetes()+aNotif();
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
  const base=h.startsWith('boutique-')||h.startsWith('produit-')||h.startsWith('rayon-')||h==='rayons'||h==='compte'||h==='aide'||h==='reglement'||h.startsWith('chat-')||h==='discussions'||h==='favoris'||h==='verifier'?'accueil':h.startsWith('suivi-')||h==='commandes'?'panier':h;
  const it=(id,label,icon,extra)=>'<a href="#'+id+'" class="'+(base===id?'on':'')+'">'+ic(icon,22)+label+(extra||'')+'</a>';
  const c=cartCount();
  return '<nav class="nav" aria-label="Navigation">'+it('accueil','Accueil','home')+it('panier','Panier','bag',c?'<span class="cnt">'+c+'</span>':'')+(isAdmin()?it('admin','Admin','shield'):it('vendeur','Vendeur','user'))+'</nav>';
}
let lastHash=null;
function render(keep){
  if(!S.loaded){app.innerHTML='<div class="loading">Chargement…</div>';return;}
  let h=(location.hash||'#accueil').slice(1)||'accueil';
  if(h.startsWith('discussion-')){ui.vTab='messages';ui.conv=h.slice(11);history.replaceState(null,'','#vendeur');h='vendeur';}
  stPage(h);
  let html;
  if(h.startsWith('boutique-'))html=vBoutique(decodeURIComponent(h.slice(9)));
  else if(h.startsWith('produit-'))html=vProduit(h.slice(8));
  else if(h.startsWith('rayon-'))html=vRayon(decodeURIComponent(h.slice(6)));
  else if(h==='rayons')html=vRayons();
  else if(h.startsWith('chat-'))html=vChat(decodeURIComponent(h.slice(5)));
  else if(h==='discussions')html=vDiscussions();
  else if(h==='compte')html=vCompte();
  else if(h==='aide')html=vAide();
  else if(h==='reglement')html=vReglement();
  else if(h==='panier')html=vPanier();
  else if(h==='favoris')html=vFavoris();
  else if(h.startsWith('suivi-'))html=vSuivi(h.slice(6));
  else if(h.startsWith('recu-'))html=vRecu(h.slice(5));
  else if(h.startsWith('commercial-'))html=vCommercial(h.slice(11));
  else if(h==='commandes')html=vMesCommandes();
  else if(h==='verifier')html=vVerifier();
  else if(h==='vendeur')html=isAdmin()?vAdmin():vVendeur();
  else if(h==='admin')html=vAdmin();
  else if(window.GBX&&GBX.route&&GBX.route(h)!=null)html=GBX.route(h);
  else html=vAccueil();
  if(h.startsWith('produit-')||h==='panier'||h==='compte'||h==='aide'||h==='reglement'||h.startsWith('suivi-')||h.startsWith('recu-')||h.startsWith('commercial-')||(!S.user&&(h==='vendeur'||h==='admin')))html=html.replace('class="wrap"','class="wrap narrow"');
  if(S.error)html='<div class="wrap" style="padding-bottom:0"><div class="err">'+esc(S.error)+' <button type="button" class="btn btn-w btn-s" data-a="reload">Réessayer</button></div></div>'+html;
  const y=window.scrollY;app.innerHTML=html+nav(h);setTimeout(()=>autoTour(h),900);
  if(keep&&lastHash===h)window.scrollTo(0,y);else window.scrollTo(0,0);lastHash=h;
}
let toastT;
function toast(t){const l=document.getElementById('layer');if(l.querySelector('.modal'))return;l.innerHTML='<div class="toast" role="status">'+esc(t)+'</div>';clearTimeout(toastT);toastT=setTimeout(()=>{if(!l.querySelector('.modal'))l.innerHTML='';},2800);}
function copy(text,msg){const done=()=>toast(msg||'Lien copié');
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){toast('Copiez le texte à la main');}ta.remove();};
  try{navigator.clipboard.writeText(text).then(done,fb);}catch(e){fb();}}
function addToCart(pid,taille){const p=prodById(pid);if(!p||p.stock<=0)return;
  const l=cart.find(x=>x.pid===pid&&(x.taille||null)===(taille||null));
  if(l){if(l.qty<p.stock)l.qty++;}else cart.push({pid,qty:1,taille:taille||null});saveCart();toast('Ajouté au panier');st('panier',{s:p.shop_id,p:p.id});}
function logOrder(shopId,canal,single,id){
  const lines=single?[{p:prodById(single),qty:1,taille:ui.taille}]:cart.map(l=>({p:prodById(l.pid),qty:l.qty,taille:l.taille})).filter(l=>l.p&&l.p.shop_id===shopId);
  if(!lines.length)return;id=id||uuid();st('commande',{s:shopId});
  const row={id,shop_id:shopId,canal,statut:'envoyee',items:lines.map(l=>({pid:l.p.id,nom:l.p.nom,prix:prix(l.p),qty:l.qty,taille:l.taille||null})),total:lines.reduce((a,l)=>a+prix(l.p)*l.qty,0),
    client_nom:String(client.nom||'').trim().slice(0,80),client_tel:String(client.tel||'').trim().slice(0,30),client_adresse:String(client.adresse||'').trim().slice(0,200)};
  const rf=lsGet('gbairai-ref',null),sh0=shopById(shopId);if(rf&&sh0&&rf.slug===sh0.slug&&rf.code&&Date.now()-rf.ts<30*864e5)row.commercial_code=String(rf.code).slice(0,20);
  const mkCode=()=>sb.rpc('creer_code',{oid:id,c:code}).then(()=>{},()=>{});
  sb.from('orders').insert(row).then(r=>{if(r&&r.error){delete row.commercial_code;delete row.client_nom;delete row.client_tel;delete row.client_adresse;sb.from('orders').insert(row).then(mkCode,()=>{});}else mkCode();},()=>{});
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
  add:t=>{const p=prodById(t.dataset.id);if(p.tailles&&p.tailles.trim()){location.hash='produit-'+p.id;return;}const n=cartCount();addToCart(p.id);if(cartCount()>n)fly(t.closest('.pcard'));render(true);bumpCart();},
  addT:t=>{const n=cartCount();addToCart(t.dataset.id,ui.taille);if(cartCount()>n)fly(document.querySelector('.galwrap'));render(true);bumpCart();},
  taille:t=>{ui.taille=t.dataset.id;render(true);},
  qty:t=>{const i=+t.dataset.i,l=cart[i];if(!l)return;const p=prodById(l.pid);l.qty+=+t.dataset.d;if(l.qty<=0)cart.splice(i,1);else if(p&&l.qty>p.stock){l.qty=p.stock;toast('Stock disponible : '+p.stock);}saveCart();render(true);},
  order:t=>logOrder(t.dataset.shop,'whatsapp',t.dataset.single,t.dataset.oid),
  orderTg:t=>{copy(t.dataset.text,'Message copié : collez-le sur Telegram');logOrder(t.dataset.shop,'telegram',null,t.dataset.oid);},
  fav:t=>{const id=t.dataset.id;favs=isFav(id)?favs.filter(x=>x!==id):[id].concat(favs);lsSet('gbairai-favoris',favs);toast(isFav(id)?'Ajouté aux favoris':'Retiré des favoris');render(true);},
  galGo:t=>{const g=document.getElementById('gal');if(g)g.scrollTo({left:g.clientWidth*(+t.dataset.i),behavior:'smooth'});},
  copy:t=>{copy(t.dataset.text);const m=myShop();if(m&&String(t.dataset.text||'').includes(m.slug))lsSet('gbairai-partage-'+m.id,1);},
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
  vtab:t=>{ui.tabHelp=false;ui.vTab=t.dataset.id;ui.rel=null;ui.cli=null;ui.edit=null;ui.photo=undefined;ui.extras=undefined;ui.confirm=null;render();},
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
  releve:t=>{ui.rel=t.dataset.id;render(true);},
  annVu:t=>{const v=lsGet('gbairai-ann-vu',[]);v.push(t.dataset.id);lsSet('gbairai-ann-vu',v.slice(-50));render(true);},
  delAnn:t=>act(()=>q(sb.from('annonces').delete().eq('id',t.dataset.id)),'Annonce supprimée'),
  tabHelp:()=>{ui.tabHelp=!ui.tabHelp;render(true);},
  aidePub:t=>{ui.aidePub=t.dataset.id;ui.aideOpen=null;render(true);},
  aideOpen:t=>{ui.aideOpen=ui.aideOpen===t.dataset.id?null:t.dataset.id;render(true);},
  tour:t=>startTour(t.dataset.id),
  tourNext:()=>tourStep(1),
  tourEnd:()=>endTour(),
  ppHide:()=>{const m=myShop();if(m)lsSet('gbairai-pp-'+m.id,1);render(true);},
  ppShare:()=>{const m=myShop();if(!m)return;copy(shopUrl(m),'Lien copié : collez-le sur votre statut');lsSet('gbairai-partage-'+m.id,1);render(true);},
  editAide:t=>{ui.aEditAide=t.dataset.id;render(true);},
  cliCSVall:()=>{if(isAdmin())clientsCSV(S.orders,true,'clients-gbairai');},
  promoVu:()=>{try{localStorage.setItem('gbairai-promo-vu','1');}catch(e){}render();},
  promoGo:()=>{try{localStorage.setItem('gbairai-promo-vu','1');}catch(e){}setTimeout(render,500);},
  regAll:t=>{ui.regOpen=t.dataset.v==='1'?'all':null;render();},
  regPrint:()=>{document.querySelectorAll('details.regart').forEach(d=>d.open=true);setTimeout(()=>window.print(),100);},
  delAide:t=>act(()=>q(sb.from('aide').delete().eq('id',t.dataset.id)),'Supprimé'),
  aideActif:t=>act(()=>q(sb.from('aide').update({actif:t.dataset.v==='1'}).eq('id',t.dataset.id))),
  story:t=>{const L=storyList();ui.story={list:L,i:+t.dataset.i,j:0};storyShow();},
  storyTap:(t,e)=>{if(!ui.story)return;if(e.clientX<window.innerWidth/3)storyPrev();else storyNext();},
  storyClose:()=>{storyStop();document.getElementById('layer').innerHTML='';},
  storyAdd:t=>{const n=cartCount();addToCart(t.dataset.id);if(cartCount()>n){toast('Ajouté au panier');navigator.vibrate&&navigator.vibrate(25);}},
  zoom:t=>{const p=prodById(t.dataset.pid);if(!p)return;const ph=photosOf(p),g=document.getElementById('gal'),i=t.dataset.i!=null?+t.dataset.i:g?Math.round(g.scrollLeft/Math.max(1,g.clientWidth)):0;
    document.getElementById('layer').innerHTML='<div class="zoomv" data-a="closeModal"><div class="zoombar"><span>'+esc(p.nom)+'</span><button type="button" class="icon-btn" data-a="closeModal" aria-label="Fermer">✕</button></div><div class="zoomsc" data-stop="1">'+ph.map(u=>'<img src="'+esc(u)+'" alt="" data-a="zoomT">').join('')+'</div><div class="zoomhint">Touchez deux fois pour zoomer · glissez pour changer de photo</div></div>';
    const sc=document.querySelector('.zoomsc');if(sc)sc.scrollLeft=sc.clientWidth*i;},
  zoomT:t=>{const now=Date.now();if(now-(t._last||0)<350){t.classList.toggle('z2');}t._last=now;},
  setCouleur:t=>act(()=>q(sb.from('shops').update({couleur:+t.dataset.v}).eq('id',myShop().id)),'Couleur changée'),
  setCover:t=>act(()=>q(sb.from('shops').update({couverture:t.dataset.v}).eq('id',myShop().id)),'Couverture changée'),
  setTheme:t=>{lsSet('gbairai-theme',t.dataset.v);applyTheme();render(true);},
  setSon:t=>{lsSet('gbairai-son',t.dataset.v==='1');render(true);if(t.dataset.v==='1')tchin();},
  pvSel:t=>{ui.pvSel[t.dataset.shop]=t.dataset.id;render(true);},
  geoFill:t=>geo(pos=>{const f=t.closest('form');f.elements.lat.value=pos.lat;f.elements.lng.value=pos.lng;t.textContent='📍 Position prise ✔';}),
  geoPoint:t=>geo(pos=>act(()=>q(sb.from('points_vente').update(pos).eq('id',t.dataset.id)),'Position enregistrée')),
  relClose:()=>{ui.rel=null;render();},
  cliOpen:t=>{ui.cli=t.dataset.id;render();},
  cliClose:()=>{ui.cli=null;render();},
  print:()=>window.print(),
  payeMode:t=>{const o=S.orders.find(x=>x.id===t.dataset.id);act(()=>q(sb.from('orders').update({paye_mode:o&&o.paye_mode===t.dataset.v?'':t.dataset.v}).eq('id',t.dataset.id)),'Paiement enregistré');},
  pointOrder:t=>{const o=S.orders.find(x=>x.id===t.dataset.id);act(()=>q(sb.from('orders').update({point_id:o&&o.point_id===t.dataset.v?null:t.dataset.v}).eq('id',t.dataset.id)),'Point de vente enregistré');},
  delVers:t=>act(()=>q(sb.from('versements').delete().eq('id',t.dataset.id)),'Versement supprimé'),
  delPoint:t=>act(()=>q(sb.from('points_vente').delete().eq('id',t.dataset.id)),'Point de vente supprimé'),
  delCm:t=>act(()=>q(sb.from('commerciaux').delete().eq('id',t.dataset.id)),'Commercial supprimé'),
  cmPoint:t=>{const c=(S.commerciaux||[]).find(x=>x.id===t.dataset.id);act(()=>q(sb.from('commerciaux').update({point_id:c&&c.point_id===t.dataset.v?null:t.dataset.v}).eq('id',t.dataset.id)),'Point de vente enregistré');},
  cmActif:t=>act(()=>q(sb.from('commerciaux').update({actif:t.dataset.v==='1'}).eq('id',t.dataset.id))),
  delTx:t=>act(()=>q(sb.from('txs').delete().eq('id',t.dataset.id))),
  confOrder:t=>act(async()=>{const o=S.orders.find(x=>x.id===t.dataset.id);
    await q(sb.from('orders').update({statut:'confirmee'}).eq('id',o.id));notify({kind:'commande',order_id:o.id});
    for(const it of (o.items||[])){const p=prodById(it.pid);if(p)await q(sb.from('products').update({stock:Math.max(0,p.stock-it.qty)}).eq('id',p.id));}
    await q(sb.from('txs').insert({shop_id:o.shop_id,type:'recette',montant:o.total,libelle:'Vente · '+(o.items||[]).map(i=>i.qty+' '+i.nom).join(', ').slice(0,120),date:today()}));setTimeout(()=>celebrate(o),300);},'Vente confirmée : caisse et stock mis à jour'),
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
  stPer:t=>{ui.stD=Number(t.dataset.id);render(true);},
  stReload:()=>{ui.stats=null;render(true);},
  stDormAll:()=>{ui.stDormAll=!ui.stDormAll;render(true);},
  cxF:t=>{ui.cxF=t.dataset.id;ui.cxAll=false;render(true);},
  cxAll:()=>{ui.cxAll=true;render(true);},
  vdType:t=>{ui.vd.type=t.dataset.id;render(true);},
  vdRefOn:t=>{ui.vdRef=t.dataset.id;render(true);},
  vdRefOff:()=>{ui.vdRef=null;render(true);},
  vdSend:async()=>{const s=myShop(),vd=ui.vd||{};if(!s||ui.vdBusy)return;const P=PIECES.find(x=>x[0]===vd.type)||PIECES[0],num=String(vd.num||'').trim();
    if(num.length<3)return toast('Écrivez le numéro de la pièce');if(!vd.recto||!vd.selfie)return toast('Ajoutez les 2 photos');
    const b64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});
    ui.vdBusy=true;render(true);
    try{for(const k of ['recto','selfie']){const r=await fetch('/api/piece',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({action:'envoyer',kind:k,data:await b64(vd[k].blob)})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Envoi impossible');}
      const d=new Date(),txt=(P[2]+' n° '+num+' · envoyée le '+dfr(d)+' à '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')).slice(0,120);
      await q(sb.from('shop_private').upsert({shop_id:s.id,cni:txt}));S.priv[s.id]=Object.assign({},S.priv[s.id],{cni:txt});
      ui.vd={type:vd.type,num:''};ui.vdBusy=false;render();toast('Photos envoyées ✅ Réponse sous 24 h');
    }catch(e){ui.vdBusy=false;render(true);toast('Erreur : '+e.message);}},
  vdVoir:async t=>{const id=t.dataset.id;try{const r=await fetch('/api/piece',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({action:'voir',shop_id:id})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Erreur');ui.vdPics=ui.vdPics||{};ui.vdPics[id]=j;render(true);if(!j.recto&&!j.selfie)toast('Aucune photo trouvée');}catch(e){toast('Erreur : '+e.message);}},
  shopRay:t=>{ui.shopRay=t.dataset.id?{s:t.dataset.s,c:t.dataset.id}:null;render(true);},
  voix:()=>voixStart(),
  ctTab:t=>{ui.ctTab=t.dataset.id;render();},
  ctOpen:t=>{ui.ctSel=t.dataset.id;render();window.scrollTo(0,0);},
  ctBack:()=>{ui.ctSel=null;render();},
  atab:t=>{ui.ctSel=null;ui.aTab=t.dataset.id;ui.adminShop=null;ui.confirm=null;ui.edit=null;ui.photo=undefined;ui.extras=undefined;render();},
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
  if(DEL.has(t.dataset.a)){delAsk(t);return;}
  const f=A[t.dataset.a];if(f)f(t,e);
});
/* Code image obligatoire avant toute suppression */
const DEL=new Set(['delAnn','delAide','delProd','delVers','delPoint','delCm','delTx','bnDel','blDel','rvDel','delShop','delCat','delQ']);
let delPending=null,delCode='';
function delDraw(){const cv=document.getElementById('delcv');if(!cv)return;const A_='ABCDEFGHJKMNPRSTUVWXYZ23456789';delCode='';for(let i=0;i<5;i++)delCode+=A_[Math.floor(Math.random()*A_.length)];
  const x=cv.getContext('2d'),w=cv.width,h=cv.height,g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#EDE7FB');g.addColorStop(1,'#FFE9D6');x.fillStyle=g;x.fillRect(0,0,w,h);
  const col=['#5B21B6','#EA580C','#059669','#1E3A8A','#9D174D'];
  for(let i=0;i<6;i++){x.strokeStyle=col[i%5]+'66';x.lineWidth=1.5;x.beginPath();x.moveTo(Math.random()*w,Math.random()*h);x.bezierCurveTo(Math.random()*w,Math.random()*h,Math.random()*w,Math.random()*h,Math.random()*w,Math.random()*h);x.stroke();}
  for(let i=0;i<40;i++){x.fillStyle=col[i%5]+'55';x.beginPath();x.arc(Math.random()*w,Math.random()*h,1.5,0,7);x.fill();}
  x.textBaseline='middle';for(let i=0;i<5;i++){x.save();x.translate(22+i*(w-40)/4.4,h/2+(Math.random()*10-5));x.rotate((Math.random()-.5)*.6);x.font='800 '+(30+Math.random()*6)+'px Sora, Arial, sans-serif';x.fillStyle=col[i%5];x.fillText(delCode[i],-10,0);x.restore();}
  const inp=document.getElementById('delin');if(inp){inp.value='';inp.focus();}}
function delAsk(t){delPending=t;const lab=(t.textContent||'').trim();
  document.getElementById('layer').innerHTML='<div class="modal" data-a="closeModal"><form class="card stack" data-stop="1" data-f="delCode" autocomplete="off"><h2 style="font-size:17px">🔒 Confirmer la suppression</h2><p class="small muted" style="margin:0">Pour éviter les erreurs, recopiez le code de l\'image. La suppression est définitive.</p><div class="row" style="gap:8px"><canvas id="delcv" width="220" height="64" style="border-radius:14px;flex:1;max-width:240px;height:64px"></canvas><button type="button" class="icon-btn" data-a="delNew" aria-label="Autre code">↻</button></div><input class="in" id="delin" name="code" required maxlength="5" placeholder="Code de l\'image" style="letter-spacing:6px;font-weight:800;text-transform:uppercase" aria-label="Code de l\'image"><div class="grid2"><button type="button" class="btn btn-w" data-a="closeModal">Annuler</button><button class="btn btn-r" type="submit">Supprimer</button></div></form></div>';
  delDraw();}
A.delNew=()=>delDraw();

function refreshOrderLinks(){
  document.querySelectorAll('[data-msg]').forEach(el=>{const sid=el.dataset.msg,s=shopById(sid);if(!s)return;
    const lines=cart.map(l=>({p:prodById(l.pid),qty:l.qty,taille:l.taille})).filter(l=>l.p&&l.p.shop_id===sid),o=oid('c-'+sid),txt=orderText(s,lines,o);
    el.textContent=txt;const a=document.querySelector('a[data-a="order"][data-shop="'+sid+'"]');if(a)a.href='https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(txt);
    const tg=document.querySelector('[data-a="orderTg"][data-shop="'+sid+'"]');if(tg)tg.dataset.text=txt;});}
document.addEventListener('input',e=>{
  const ck=e.target.dataset&&e.target.dataset.client;if(ck){client[ck]=e.target.value;lsSet('gbairai-client',client);refreshOrderLinks();return;}
  if(e.target.dataset&&e.target.dataset.i2==='vdNum'){ui.vd=ui.vd||{type:'cni',num:''};ui.vd.num=e.target.value;return;}
  const k=e.target.dataset&&e.target.dataset.i;if(!k)return;ui[k]=e.target.value;
  if(k==='q'){document.getElementById('results').innerHTML=results();clearTimeout(stQT);stQT=setTimeout(()=>{const v=ui.q.trim().toLowerCase().slice(0,80);if(v.length>=2&&v!==stQ){stQ=v;st('recherche',{q:v,n:ui.qN||0});}},1500);}
  else if(k==='ctQ'){const pos=e.target.selectionStart;render(true);const el=document.querySelector('[data-i="ctQ"]');if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(_){}}}
  else if(k==='aideQ'){const pos=e.target.selectionStart;render(true);const el=document.querySelector('[data-i="aideQ"]');if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(_){}}}
  else if(k==='aQ'){const pos=e.target.selectionStart;render(true);const el=document.getElementById('aq');if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(_){}}}
});
let formCache=null;
function keepForm(){const f=document.querySelector('form[data-f="produit"]');if(!f)return;formCache={};new FormData(f).forEach((v,k)=>formCache[k]=v);formCache.visible=f.querySelector('#f-vis').checked;}
function restoreForm(){const f=document.querySelector('form[data-f="produit"]');if(!f||!formCache)return;Object.keys(formCache).forEach(k=>{const el=f.elements[k];if(!el)return;if(el.type==='checkbox')el.checked=formCache[k];else el.value=formCache[k];});formCache=null;}
document.addEventListener('change',async e=>{
  if(e.target.name==='categorie'&&e.target.type==='radio'&&e.target.closest('form[data-f="produit"]')){const t=document.getElementById('f-type');if(t)t.innerHTML=typeOpts(e.target.value,'');document.querySelectorAll('.rpick .rayon').forEach(l=>l.classList.toggle('on',l.contains(e.target)));return;}
  if(e.target.dataset&&e.target.dataset.file==='catphoto'&&e.target.files[0]){const id=e.target.dataset.id;try{const r=await resizePhoto(e.target.files[0],700);act(async()=>{const url=await uploadPhoto(r.blob);await saveCat(id,{photo:url});},'Photo du rayon changée');}catch(err){toast('Impossible de lire cette photo');}return;}
  if(e.target.dataset&&e.target.dataset.a2==='payDuree'){ui.pay.duree=+e.target.value;render(true);return;}
  if(e.target.dataset&&/^vd-(recto|selfie)$/.test(e.target.dataset.file||'')&&e.target.files[0]){const k=e.target.dataset.file.slice(3);try{const r=await resizePhoto(e.target.files[0],1400);ui.vd=ui.vd||{type:'cni',num:''};ui.vd[k]=r;render(true);}catch(err){toast('Impossible de lire cette photo');}return;}
  if(e.target.dataset&&e.target.dataset.file==='cover'&&e.target.files[0]){try{const r=await resizePhoto(e.target.files[0],1200);act(async()=>{const url=await uploadPhoto(r.blob);await q(sb.from('shops').update({couverture:url}).eq('id',myShop().id));},'Couverture changée');}catch(err){toast('Impossible de lire cette photo');}return;}
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
  annonce:(d,f)=>{if(ui.busy)return;const row={titre:String(d.titre||'').trim().slice(0,80),texte:String(d.texte||'').trim().slice(0,300),lien:/^#[\w-]{1,80}$/.test(d.lien||'')?d.lien:'',cible:['tous','vendeurs','clients'].includes(d.cible)?d.cible:'tous'};
    if(!row.titre){toast('Écrivez un titre.');return;}
    act(async()=>{const r=await q(sb.from('annonces').insert(row).select('id').single());let n=null;
      try{const x=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({kind:'annonce',annonce_id:r.id})});const j=await x.json();n=j&&typeof j.envoye==='number'?j.envoye:null;if(j&&j.pret===false)n=-1;}catch(e){}
      ui.annRes=n===-1?'Annonce publiée dans l\'appli. Notifications pas encore prêtes (voir Paramètres → Notifications).':n===null?'Annonce publiée dans l\'appli.':'Annonce publiée et envoyée sur '+n+' téléphone'+(n>1?'s':'')+'.';f.reset();},'Annonce envoyée');},
  aide:(d,f)=>act(async()=>{const row={type:d.type==='video'?'video':'guide',public:d.public==='client'?'client':'vendeur',titre:String(d.titre||'').trim().slice(0,100),icone:String(d.icone||'💡').trim().slice(0,8)||'💡',etapes:String(d.etapes||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,15),video_url:String(d.video_url||'').trim().slice(0,400),duree:String(d.duree||'').trim().slice(0,10),ordre:Math.round(n0(d.ordre))};
    if(!row.titre)throw new Error('Indiquez un titre.');if(row.type==='video'&&!/^https?:\/\//.test(row.video_url))throw new Error('Collez le lien de la vidéo (YouTube, TikTok, Facebook…).');
    const id=f.dataset.id;await q(id?sb.from('aide').update(row).eq('id',id):sb.from('aide').insert(row));ui.aEditAide=null;},'Aide enregistrée'),
  fetes:(d,f)=>act(async()=>{const o={off:[],dates:{}};FETES.forEach(x=>{if(!d['on_'+x.id])o.off.push(x.id);const a=d['du_'+x.id],b=d['au_'+x.id],c=feteNext(x.id);if(a&&b&&c&&(a!==c[0]||b!==c[1]))o.dates[x.id]=[a,b];});await q(sb.from('settings').update({fetes:o}).eq('id',1));},'Fêtes enregistrées'),
  versement:(d,f)=>act(async()=>{const m=Math.round(n0(d.montant));if(m<=0)throw new Error('Indiquez un montant.');await q(sb.from('versements').insert({shop_id:myShop().id,client_tel:f.dataset.tel,montant:m,mode:d.mode||'especes',note:String(d.note||'').trim().slice(0,120),date:today()}));},'Versement enregistré'),
  point:d=>act(async()=>{const s=myShop(),pr=!!d.principal;if(pr)await safe(sb.from('points_vente').update({principal:false}).eq('shop_id',s.id));await q(sb.from('points_vente').insert(Object.assign({shop_id:s.id,nom:String(d.nom).trim().slice(0,60),adresse:String(d.adresse||'').trim().slice(0,160),horaires:String(d.horaires||'').trim().slice(0,60),responsable:String(d.responsable||'').trim().slice(0,60),tel:String(d.tel||'').trim().slice(0,30),principal:pr},d.lat&&d.lng?{lat:+d.lat,lng:+d.lng}:{})));},'Point de vente ajouté'),
  commercial:d=>act(async()=>{const s=myShop(),nom=String(d.nom).trim().slice(0,60);if(!nom)throw new Error('Indiquez le nom.');const cm=Math.max(0,Math.min(50,Math.round(n0(String(d.commission||'0').replace(',','.'))*10)/10));await q(sb.from('commerciaux').insert({shop_id:s.id,nom,tel:String(d.tel||'').trim().slice(0,30),code:codeFrom(nom,s.id),commission:cm,point_id:d.point_id||null}));},'Commercial ajouté'),
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
  clogin:d=>act(async()=>{const r=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(r.error){st('echec',{q:waNum(d.phone)});throw new Error('Numéro ou mot de passe incorrect.');}lsSet('gbairai-cx','');},'Connecté'),
  login:d=>act(async()=>{const r=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(r.error){st('echec',{q:waNum(d.phone)});throw r.error;}lsSet('gbairai-cx','');},'Connecté'),
  newshop:d=>act(()=>createShop(d),'Boutique créée'),
  produit:(d,f)=>act(async()=>{if(d.categorie)lsSet('gbairai-dernier-rayon',d.categorie);
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
  vdRefus:(d,f)=>act(async()=>{await q(sb.from('shops').update({verification:'refuse',motif_refus:String(d.motif||'').trim().slice(0,200)}).eq('id',f.dataset.id));await q(sb.from('shop_private').upsert({shop_id:f.dataset.id,cni:''}));fetch('/api/piece',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({action:'effacer',shop_id:f.dataset.id})}).catch(()=>{});ui.vdRef=null;},'Vérification refusée'),
  shop:(d,f)=>act(async()=>{
    const id=f.dataset.id,admin=f.dataset.admin==='1';
    const keys=['nom','gerant','categorie','description','whatsapp','telegram','telephone','email','facebook','tiktok','ville','quartier','adresse','livraison_zones','livraison_frais'];
    if(admin)keys.push('verification','motif_refus','formule','statut');
    const row={};keys.forEach(k=>{if(k in d)row[k]=String(d[k]).trim();});
    if('paiement_livraison' in d)row.paiement_livraison=d.paiement_livraison==='oui';
    if(admin&&'vedette' in d)row.vedette=d.vedette==='true';
    if(admin&&d.slug){const sl=slugify(d.slug);if(S.shops.some(x=>x.slug===sl&&x.id!==id))throw new Error('Ce lien est déjà pris.');row.slug=sl;}
    await q(sb.from('shops').update(row).eq('id',id));
    if('cni' in d||admin){const pv={shop_id:id,cni:String(d.cni||'').trim()};if(admin)pv.notes=String(d.notes||'');await q(sb.from('shop_private').upsert(pv));}
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
FORMS.delCode=d=>{if(String(d.code||'').trim().toUpperCase()!==delCode){document.getElementById('layer').querySelector('h2').textContent='❌ Code faux, réessayez';delDraw();return;}
  const t=delPending;delPending=null;document.getElementById('layer').innerHTML='';if(t&&A[t.dataset.a])A[t.dataset.a](t);};
document.addEventListener('submit',e=>{
  const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();
  const d={};new FormData(f).forEach((v,k)=>d[k]=v);const fn=FORMS[f.dataset.f];if(fn)fn(d,f);
});
window.addEventListener('hashchange',()=>{storyStop();ui.confirm=null;ui.suivi={};ui.recu={};ui.espace={};ui.mes=null;ui.taille=null;ui.type=null;ui.dl=undefined;document.getElementById('layer').innerHTML='';render();});
(function(){try{const c=new URLSearchParams(location.search).get('c');if(!c)return;const code=c.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20),m=(location.hash||'').match(/^#boutique-(.+)$/);if(code&&m)lsSet('gbairai-ref',{slug:decodeURIComponent(m[1]),code,ts:Date.now()});history.replaceState(null,'',location.pathname+location.hash);}catch(e){}})();
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'||ev==='TOKEN_REFRESHED')return;});
render();
function ping(){if(S.user&&!isAdmin()&&myShop()&&!document.hidden)sb.rpc('je_suis_la').then(()=>{},()=>{});}
setInterval(()=>{ping();if(document.hidden||!S.loaded)return;sb.from('shops').select('id,vu_le').then(r=>{if(r&&!r.error&&r.data)r.data.forEach(x=>{const s=shopById(x.id);if(s)s.vu_le=x.vu_le;});},()=>{});},120000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping();});
/* Œil dans chaque champ mot de passe : afficher / cacher ce qu'on tape */
const EYE_ON='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></svg>';
function addEyes(root){(root||document).querySelectorAll('input[type="password"]:not([data-eye])').forEach(i=>{i.setAttribute('data-eye','1');const w=document.createElement('span');w.className='pwbox';i.parentNode.insertBefore(w,i);w.appendChild(i);const b=document.createElement('button');b.type='button';b.className='pweye';b.setAttribute('aria-label','Afficher le mot de passe');b.innerHTML=EYE_ON;w.appendChild(b);});}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.pweye');if(!b)return;e.preventDefault();e.stopPropagation();const i=b.parentNode.querySelector('input');const vis=i.type==='password';i.type=vis?'text':'password';b.innerHTML=vis?EYE_OFF:EYE_ON;b.setAttribute('aria-label',vis?'Cacher le mot de passe':'Afficher le mot de passe');b.classList.toggle('on',vis);},true);
new MutationObserver(()=>addEyes()).observe(document.body,{childList:true,subtree:true});
window.GB={S:S,shopById:shopById,prodById:prodById,askAlerts:askAlerts,ui:ui,A:A,FORMS:FORMS,render:render,esc:esc,toast:toast,sb:sb,q:q,safe:safe,act:act,myShop:myShop,shopProducts:shopProducts,addToCart:addToCart,photosOf:photosOf,place:place,waNum:waNum,uuid:uuid,copy:copy,lsGet:lsGet,lsSet:lsSet,catName:catName,CATS:CATS,villeOf:villeOf,avatar:avatar,tile:tile,pCard:pCard,resizePhoto:resizePhoto,uploadPhoto:uploadPhoto,keepForm:keepForm,restoreForm:restoreForm,F:F,fmtN:fmtN,prix:prix,ic:ic,back:back,isAdmin:isAdmin,verifBadge:verifBadge,presenceHTML:presenceHTML,geo:geo,loadAll:loadAll,errMsg:errMsg,getCart:()=>cart,getClient:()=>client,typeOpts:typeOpts};
loadAll().then(()=>render());
})();
