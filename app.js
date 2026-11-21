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
  autre:'<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
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
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
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
const S={settings:{nom:'Gbairai Market',limite_gratuit:20,quartiers:[],categories:[]},shops:[],products:[],orders:[],txs:[],priv:{},user:null,role:'visiteur',loaded:false,error:null};
let cart=[];try{cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]')||[];}catch(e){cart=[];}
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch(e){}}
const ui={q:'',quartier:'Tous',cat:null,taille:null,vTab:'accueil',aTab:'tableau',edit:null,photo:undefined,adminShop:null,confirm:null,caissePeriode:'mois',aFilter:'tous',aQ:'',busy:false,authMode:'creer'};

const shopById=id=>S.shops.find(s=>s.id===id);
const prodById=id=>S.products.find(p=>p.id===id);
const catName=id=>{const c=(S.settings.categories||[]).find(c=>c.id===id);return c?c.nom:'Autre';};
const shopProducts=id=>S.products.filter(p=>p.shop_id===id);
const myShop=()=>S.user?S.shops.find(s=>s.owner===S.user.id):null;
const shopUrl=s=>location.origin+location.pathname+'#boutique-'+s.slug;
const cartCount=()=>cart.reduce((a,l)=>a+l.qty,0);
const isAdmin=()=>S.role==='admin';

async function q(promise){const r=await promise;if(r.error)throw r.error;return r.data;}
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
    const sess=await sb.auth.getSession();S.user=sess.data.session?sess.data.session.user:null;
    const [st,shops,prods]=await Promise.all([q(sb.from('settings').select('*').eq('id',1).single()),q(sb.from('shops').select('*').order('created_at')),q(sb.from('products').select('*').order('created_at',{ascending:false}))]);
    S.settings=st;S.shops=shops;S.products=prods;S.role='visiteur';S.orders=[];S.txs=[];S.priv={};
    if(S.user){
      const prof=await q(sb.from('profiles').select('role').eq('id',S.user.id).maybeSingle());
      S.role=prof&&prof.role==='admin'?'admin':'vendeur';
      const mine=myShop();
      if(isAdmin()){
        const [o,p]=await Promise.all([q(sb.from('orders').select('*').order('created_at',{ascending:false})),q(sb.from('shop_private').select('*'))]);
        S.orders=o;p.forEach(x=>S.priv[x.shop_id]=x);
        if(mine)S.txs=await q(sb.from('txs').select('*').eq('shop_id',mine.id).order('date',{ascending:false}));
      }else if(mine){
        const [o,t,p]=await Promise.all([q(sb.from('orders').select('*').eq('shop_id',mine.id).order('created_at',{ascending:false})),q(sb.from('txs').select('*').eq('shop_id',mine.id).order('date',{ascending:false})),q(sb.from('shop_private').select('*').eq('shop_id',mine.id))]);
        S.orders=o;S.txs=t;p.forEach(x=>S.priv[x.shop_id]=x);
      }
    }
    S.error=null;
  }catch(e){S.error=errMsg(e);}
  S.loaded=true;
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
  const inner=p.photo?'<img src="'+esc(p.photo)+'" alt="" loading="lazy">':ic(ICON[p.categorie]?p.categorie:'autre',iconSize||54,'#fff',1.6);
  return '<div class="tile" style="height:'+h+'px;background:'+grad(p.couleur)+'">'+inner+'</div>';
}
function avatar(s,size){return '<div class="avatar" style="background:'+lin(s.couleur)+(size?';width:'+size+'px;height:'+size+'px':'')+'">'+esc(initials(s.nom))+'</div>';}
const verifBadge=s=>s.verification==='verifie'?VERIF:'';
function logoHTML(){const n=S.settings.nom||'Gbairai Market';return '<a class="logo" href="#accueil"><span class="logo-mark">'+ic('bag',22,'#fff')+'</span><span class="logo-name">'+esc(n)+'<i>.</i></span></a>';}
function back(href,label){return '<a class="icon-btn" href="'+href+'" aria-label="'+(label||'Retour')+'">'+ic('back')+'</a>';}

/* ---------- CLIENT ---------- */
function vAccueil(){
  const qs=(S.settings.quartiers||[]).slice(0,8);
  const cats=(S.settings.categories||[]).slice(0,5).map((c,i)=>'<button type="button" class="cat'+(ui.cat===c.id?' on':'')+'" data-a="cat" data-id="'+esc(c.id)+'"><span class="cat-ico" style="background:linear-gradient(145deg,'+pal(i)[0]+','+pal(i)[1]+');box-shadow:inset 0 2px 0 rgba(255,255,255,.5),0 5px 0 '+pal(i)[2]+'">'+ic(ICON[c.id]?c.id:'autre',26,'#fff',2)+'</span>'+esc(c.nom)+'</button>').join('');
  return '<div class="wrap"><div class="row between">'+logoHTML()+'<a class="btn btn-w btn-s" href="#vendeur">Je suis vendeur</a></div>'+
  '<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:140px;height:140px"></span><span class="ball g" style="right:70px;top:70px;width:38px;height:38px"></span><h1>Toutes les boutiques d\'Abidjan, au même endroit</h1><p>Choisissez, puis commandez directement sur WhatsApp</p>'+
  '<label class="search">'+ic('search',20,'#6B5B8C')+'<span hidden>Rechercher</span><input id="q" type="search" placeholder="Robe, sneakers, iPhone, boutique…" value="'+esc(ui.q)+'" data-i="q"></label></section>'+
  '<div class="chips">'+['Tous'].concat(qs).map(x=>'<button type="button" class="chip'+(ui.quartier===x?' on':'')+'" data-a="quartier" data-id="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>'+
  '<div class="cats">'+cats+'</div><div id="results" class="stack">'+results()+'</div></div>';
}
function results(){
  const qq=ui.q.trim().toLowerCase();
  const ok=s=>s.statut==='actif'&&(ui.quartier==='Tous'||s.quartier===ui.quartier);
  const shops=S.shops.filter(s=>ok(s)&&(!ui.cat||s.categorie===ui.cat||shopProducts(s.id).some(p=>p.categorie===ui.cat))&&(!qq||(s.nom+' '+s.quartier).toLowerCase().includes(qq)))
    .sort((a,b)=>(b.vedette-a.vedette)||((b.verification==='verifie')-(a.verification==='verifie')));
  const prods=S.products.filter(p=>{const s=shopById(p.shop_id);return s&&ok(s)&&p.visible&&p.stock>0&&(!ui.cat||p.categorie===ui.cat)&&(!qq||(p.nom+' '+(p.description||'')+' '+s.nom).toLowerCase().includes(qq));});
  let h='<div class="sec-title"><h2>Boutiques</h2><span class="muted small">'+shops.length+'</span></div>';
  h+=shops.length?'<div class="shops">'+shops.map(shopCard).join('')+'</div>':'<p class="muted">Aucune boutique pour l\'instant.'+(S.shops.length?'':' <a href="#vendeur">Créez la première !</a>')+'</p>';
  h+='<div class="sec-title"><h2>Produits</h2><span class="muted small">'+prods.length+'</span></div>';
  h+=prods.length?'<div class="pgrid">'+prods.map(pCard).join('')+'</div>':'<p class="muted">Aucun produit trouvé.</p>';
  return h;
}
function shopCard(s){const n=shopProducts(s.id).filter(p=>p.visible).length;
  return '<a class="shop" href="#boutique-'+esc(s.slug)+'"><div class="shop-cover" style="background:'+lin(s.couleur)+'">'+avatar(s)+(s.vedette?'<span class="badge b-orange" style="position:absolute;right:10px;top:10px">Vedette</span>':'')+'</div><div class="shop-body"><div class="shop-name">'+esc(s.nom)+verifBadge(s)+'</div><div class="muted small" style="margin-top:4px">'+esc(s.quartier)+' · '+esc(catName(s.categorie))+' · '+n+' produit'+(n>1?'s':'')+'</div></div></a>';}
function pCard(p){const inCart=cart.some(l=>l.pid===p.id);
  return '<div class="pcard"><a href="#produit-'+p.id+'">'+tile(p,120)+'<div class="pname">'+esc(p.nom)+'</div></a><div class="pfoot"><span class="price num">'+F(p.prix)+'</span>'+
  (p.stock>0?'<button type="button" class="add'+(inCart?' in':'')+'" data-a="add" data-id="'+p.id+'" aria-label="'+(inCart?'Déjà dans le panier':'Ajouter au panier')+'">'+ic(inCart?'check':'plus',18,'#fff',2.6)+'</button>':'<span class="badge b-grey">Rupture</span>')+'</div></div>';}
function vBoutique(slug){
  const s=S.shops.find(x=>x.slug===slug);
  if(!s||s.statut!=='actif')return '<div class="wrap">'+back('#accueil')+'<div class="card"><h2>Boutique introuvable</h2><p class="muted">Cette boutique n\'existe pas ou est suspendue.</p></div></div>';
  const prods=shopProducts(s.id).filter(p=>p.visible);
  const lines=cart.filter(l=>{const p=prodById(l.pid);return p&&p.shop_id===s.id;});
  const tot=lines.reduce((a,l)=>a+prodById(l.pid).prix*l.qty,0);
  return '<div class="wrap"><div class="cover" style="background:'+lin(s.couleur)+'"><span class="ball o" style="right:30px;top:40px;width:70px;height:70px;border-radius:22px;transform:rotate(18deg)"></span><div class="row between" style="padding:16px max(16px,env(safe-area-inset-left,0px))">'+back('#accueil')+'<button type="button" class="icon-btn" data-a="copy" data-text="'+esc(shopUrl(s))+'" aria-label="Copier le lien de la boutique">'+ic('share')+'</button></div></div>'+
  '<div class="card stack" style="margin-top:-70px;position:relative"><div class="row">'+avatar(s,64)+'<div style="min-width:0"><h1 class="row" style="font-size:19px;gap:6px">'+esc(s.nom)+verifBadge(s)+'</h1><div class="muted small row" style="gap:4px;margin-top:3px">'+ic('pin',14)+esc(s.quartier)+(s.adresse?', '+esc(s.adresse):'')+'</div></div></div>'+
  (s.description?'<p style="margin:0;font-size:14px;line-height:1.5;color:#3D3256">'+esc(s.description)+'</p>':'')+
  (s.livraison_zones?'<div class="small muted">Livraison : '+esc(s.livraison_zones)+(s.livraison_frais?' · '+esc(s.livraison_frais)+' F':'')+'</div>':'')+
  '<div class="grid2"><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/'+waNum(s.whatsapp)+'">'+ic('wa',18,'#fff')+'WhatsApp</a>'+(s.telegram?'<a class="btn btn-t btn-s" target="_blank" rel="noopener" href="https://t.me/'+esc(s.telegram.replace(/^@/,''))+'">'+ic('tg',18,'#1E4FA8')+'Telegram</a>':'<button type="button" class="btn btn-w btn-s" data-a="copy" data-text="'+esc(shopUrl(s))+'">'+ic('link',16)+'Copier le lien</button>')+'</div></div>'+
  '<div class="sec-title"><h2>Produits</h2><span class="muted small">'+prods.length+'</span></div>'+
  (prods.length?'<div class="pgrid">'+prods.map(pCard).join('')+'</div>':'<p class="muted">Cette boutique n\'a pas encore de produits.</p>')+
  (lines.length?'<a class="btn btn-v btn-block" href="#panier" style="justify-content:space-between"><span>'+lines.reduce((a,l)=>a+l.qty,0)+' article(s) · <span class="num">'+fmtN(tot)+' FCFA</span></span><span>Voir le panier</span></a>':'')+'</div>';
}
function orderText(s,lines){const tot=lines.reduce((a,l)=>a+l.p.prix*l.qty,0);
  return 'Bonjour '+s.nom+', je veux commander :\n'+lines.map(l=>'• '+l.qty+' × '+l.p.nom+(l.taille?' ('+l.taille+')':'')+' – '+F(l.p.prix*l.qty)).join('\n')+'\nTotal : '+fmtN(tot)+' FCFA\nVu sur '+(S.settings.nom||'Gbairai Market')+' : '+shopUrl(s);}
function vProduit(id){
  const p=prodById(id);const s=p&&shopById(p.shop_id);
  if(!p||!s||!p.visible)return '<div class="wrap">'+back('#accueil')+'<div class="card"><h2>Produit introuvable</h2></div></div>';
  const tailles=(p.tailles||'').split(',').map(t=>t.trim()).filter(Boolean);
  if(tailles.length&&!tailles.includes(ui.taille))ui.taille=tailles[0];if(!tailles.length)ui.taille=null;
  const single=[{p,qty:1,taille:ui.taille}];
  return '<div class="wrap"><div class="row between">'+back('#boutique-'+esc(s.slug),'Retour à la boutique')+'<button type="button" class="icon-btn" data-a="share" data-id="'+p.id+'" aria-label="Image pour le statut">'+ic('image')+'</button></div>'+
  '<div style="border-radius:26px;overflow:hidden;box-shadow:0 30px 40px -24px rgba(27,16,51,.6)">'+tile(p,320,140)+'</div>'+
  '<div class="card stack"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><h1 style="font-size:21px">'+esc(p.nom)+'</h1><a class="small" href="#boutique-'+esc(s.slug)+'">'+esc(s.nom)+' · '+esc(s.quartier)+'</a></div><div class="price num" style="font-size:20px;white-space:nowrap">'+F(p.prix)+'</div></div>'+
  (p.description?'<div><h2 style="font-size:13px;font-family:var(--body);font-weight:700;margin-bottom:6px">Description</h2><p style="margin:0;line-height:1.55;color:#3D3256;white-space:pre-line">'+esc(p.description)+'</p></div>':'')+
  (tailles.length?'<div><h2 style="font-size:13px;font-family:var(--body);font-weight:700;margin-bottom:8px">Taille</h2><div class="row wrapx">'+tailles.map(t=>'<button type="button" class="chip'+(ui.taille===t?' on':'')+'" data-a="taille" data-id="'+esc(t)+'" style="min-width:48px;height:44px">'+esc(t)+'</button>').join('')+'</div></div>':'')+
  '<div class="row wrapx">'+(p.stock>0?'<span class="badge b-green">En stock</span>':'<span class="badge b-grey">Rupture de stock</span>')+(p.stock>0&&p.stock<=3?'<span class="badge b-orange">Plus que '+p.stock+'</span>':'')+'<span class="badge b-violet">'+esc(catName(p.categorie))+'</span></div></div>'+
  (p.stock>0?'<div class="row"><button type="button" class="btn btn-v" style="flex:1" data-a="addT" data-id="'+p.id+'">Ajouter au panier</button><a class="btn btn-g" style="width:58px;padding:0" target="_blank" rel="noopener" data-a="order" data-shop="'+s.id+'" data-single="'+p.id+'" href="https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(orderText(s,single))+'" aria-label="Commander ce produit sur WhatsApp">'+ic('wa',24,'#fff')+'</a></div>':'')+'</div>';
}
function vPanier(){
  const groups={};cart.forEach((l,i)=>{const p=prodById(l.pid);if(!p)return;(groups[p.shop_id]=groups[p.shop_id]||[]).push({p,qty:l.qty,taille:l.taille,i});});
  const ids=Object.keys(groups).filter(id=>shopById(id));
  let h='<div class="wrap"><div class="row">'+back('#accueil')+'<h1 style="font-size:20px">Mon panier</h1></div>';
  if(!ids.length)return h+'<div class="card stack" style="text-align:center;padding:28px"><h2 style="font-size:18px">Votre panier est vide</h2><p class="muted" style="margin:0">Ajoutez des produits depuis une boutique, puis commandez sur WhatsApp.</p><a class="btn btn-v" href="#accueil">Voir les boutiques</a></div></div>';
  if(ids.length>1)h+='<div class="note">Vous avez des articles de '+ids.length+' boutiques : une commande est envoyée à chaque vendeur.</div>';
  ids.forEach(id=>{const s=shopById(id),lines=groups[id],tot=lines.reduce((a,l)=>a+l.p.prix*l.qty,0),txt=orderText(s,lines);
    h+='<section class="stack"><div class="row between"><a href="#boutique-'+esc(s.slug)+'" class="row" style="text-decoration:none;color:var(--ink);font-weight:700">'+avatar(s,36)+esc(s.nom)+verifBadge(s)+'</a><span class="muted small">'+esc(s.quartier)+'</span></div>'+
    lines.map(l=>'<div class="line"><div style="width:64px;flex-shrink:0">'+tile(l.p,64,30)+'</div><div class="grow"><div class="ell" style="font-weight:600">'+esc(l.p.nom)+'</div>'+(l.taille?'<div class="small muted">Taille '+esc(l.taille)+'</div>':'')+'<div class="price num">'+F(l.p.prix*l.qty)+'</div></div><div class="stepper"><button type="button" data-a="qty" data-i="'+l.i+'" data-d="-1" aria-label="Retirer un">−</button><span>'+l.qty+'</span><button type="button" data-a="qty" data-i="'+l.i+'" data-d="1" aria-label="Ajouter un">+</button></div></div>').join('')+
    '<div class="card stack" style="gap:8px"><div class="row between"><span class="muted">Livraison</span><span style="font-weight:600;text-align:right">À voir avec le vendeur</span></div><div class="row between"><b>Total</b><span class="price num" style="font-size:22px">'+fmtN(tot)+' FCFA</span></div></div>'+
    '<div class="small muted" style="font-weight:700;letter-spacing:.4px">MESSAGE ENVOYÉ AU VENDEUR</div><div class="msg">'+esc(txt)+'</div>'+
    '<a class="btn btn-g btn-block" style="min-height:56px" target="_blank" rel="noopener" data-a="order" data-shop="'+s.id+'" href="https://wa.me/'+waNum(s.whatsapp)+'?text='+encodeURIComponent(txt)+'">'+ic('wa',22,'#fff')+'Commander sur WhatsApp</a>'+
    (s.telegram?'<a class="btn btn-t btn-block" target="_blank" rel="noopener" data-a="orderTg" data-shop="'+s.id+'" data-text="'+esc(txt)+'" href="https://t.me/'+esc(s.telegram.replace(/^@/,''))+'">'+ic('tg',20,'#1E4FA8')+'Commander sur Telegram</a><p class="small muted" style="margin:0">Sur Telegram, le message est copié : collez-le dans la discussion.</p>':'')+'</section>';});
  return h+'</div>';
}

/* ---------- AUTH ---------- */
function authForms(title,intro,allowCreate){
  const opts=(S.settings.quartiers||[]).map(x=>'<option>'+esc(x)+'</option>').join('');
  const cats=(S.settings.categories||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.nom)+'</option>').join('');
  const creer=allowCreate&&ui.authMode==='creer';
  return '<div class="wrap">'+logoHTML()+'<section class="hero"><span class="ball o" style="right:-30px;top:-30px;width:120px;height:120px"></span><h1>'+title+'</h1><p>'+intro+'</p></section>'+
  (allowCreate?'<div class="tabs"><button type="button" class="tab'+(creer?' on':'')+'" data-a="authMode" data-id="creer">Créer ma boutique</button><button type="button" class="tab'+(!creer?' on':'')+'" data-a="authMode" data-id="connexion">Me connecter</button></div>':'')+
  (creer?'<form class="card stack" data-f="signup"><label class="lbl">Nom de la boutique<input class="in" id="c-nom" name="nom" required maxlength="60" placeholder="Ex. : Awa Mode"></label>'+
  '<label class="lbl">Numéro WhatsApp<input class="in" id="c-wa" name="phone" type="tel" required placeholder="07 XX XX XX XX"></label>'+
  '<label class="lbl">Mot de passe (6 caractères minimum)<input class="in" id="c-pw" name="password" type="password" required minlength="6" autocomplete="new-password"></label>'+
  '<div class="grid2"><label class="lbl">Quartier<select class="in" id="c-q" name="quartier">'+opts+'</select></label><label class="lbl">Catégorie<select class="in" id="c-c" name="categorie">'+cats+'</select></label></div>'+
  '<button class="btn btn-v btn-block" type="submit">Créer ma boutique</button><p class="small muted" style="margin:0">Gratuit jusqu\'à '+S.settings.limite_gratuit+' produits.</p></form>'
  :'<form class="card stack" data-f="login"><label class="lbl">Numéro WhatsApp<input class="in" id="l-wa" name="phone" type="tel" required placeholder="07 XX XX XX XX" autocomplete="username"></label><label class="lbl">Mot de passe<input class="in" id="l-pw" name="password" type="password" required autocomplete="current-password"></label><button class="btn btn-v btn-block" type="submit">Me connecter</button><p class="small muted" style="margin:0">Mot de passe oublié ? Contactez le support '+esc(S.settings.nom)+'.</p></form>')+'</div>';
}

/* ---------- VENDEUR ---------- */
function vVendeur(){
  if(!S.user)return authForms('Votre boutique en ligne, gratuite','Un lien à partager sur vos statuts WhatsApp, TikTok et Facebook.',true);
  const s=myShop();
  if(!s)return '<div class="wrap">'+logoHTML()+(isAdmin()?'<div class="note">Vous êtes connecté en administrateur. <a href="#admin">Aller à l\'administration</a></div>':'')+'<form class="card stack" data-f="newshop"><h1 style="font-size:19px">Créer ma boutique</h1><label class="lbl">Nom de la boutique<input class="in" id="n-nom" name="nom" required></label><label class="lbl">Numéro WhatsApp<input class="in" id="n-wa" name="phone" type="tel" required value="'+esc((S.user.user_metadata||{}).phone||'')+'"></label><div class="grid2"><label class="lbl">Quartier<select class="in" id="n-q" name="quartier">'+(S.settings.quartiers||[]).map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label><label class="lbl">Catégorie<select class="in" id="n-c" name="categorie">'+(S.settings.categories||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.nom)+'</option>').join('')+'</select></label></div><button class="btn btn-v btn-block" type="submit">Créer</button></form><button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button></div>';
  const tabs=[['accueil','Accueil'],['produits','Produits'],['stock','Stock'],['caisse','Caisse'],['commandes','Commandes'],['reglages','Réglages']];
  const pending=S.orders.filter(o=>o.shop_id===s.id&&o.statut==='envoyee').length;
  const f={accueil:vvAccueil,produits:vvProduits,stock:vvStock,caisse:vvCaisse,commandes:vvCommandes,reglages:vvReglages}[ui.vTab]||vvAccueil;
  return '<div class="wrap"><div class="row between"><div class="row">'+avatar(s,44)+'<div><h1 style="font-size:19px">'+esc(s.nom)+'</h1><div class="small" style="color:'+(s.statut==='actif'?'var(--green)':'#9A3412')+';font-weight:600">'+(s.statut==='actif'?'Boutique en ligne':'Boutique suspendue')+'</div></div></div><a class="btn btn-w btn-s" href="#boutique-'+esc(s.slug)+'">Voir ma page</a></div>'+
  '<div class="tabs" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" class="tab'+(ui.vTab===t[0]?' on':'')+'" data-a="vtab" data-id="'+t[0]+'">'+t[1]+(t[0]==='commandes'&&pending?' <span class="badge b-orange">'+pending+'</span>':'')+'</button>').join('')+'</div>'+f(s)+'</div>';
}
function vvAccueil(s){
  const prods=shopProducts(s.id),lim=s.formule==='pro'?Infinity:S.settings.limite_gratuit;
  const tx=S.txs.filter(t=>t.shop_id===s.id&&monthOf(t.date)===monthOf(today()));
  const rec=tx.filter(t=>t.type==='recette').reduce((a,t)=>a+t.montant,0),dep=tx.filter(t=>t.type==='depense').reduce((a,t)=>a+t.montant,0);
  const low=prods.filter(p=>p.stock>0&&p.stock<=3).length,out=prods.filter(p=>p.stock<=0).length;
  return '<div class="grid3"><div class="stat dark"><b class="num">'+prods.length+(isFinite(lim)?'<small style="font-size:12px;opacity:.8">/'+lim+'</small>':'')+'</b><span>Produits</span></div><div class="stat"><b class="num">'+S.orders.filter(o=>o.shop_id===s.id).length+'</b><span>Commandes</span></div><div class="stat"><b class="num" style="font-size:16px">'+fmtN(rec-dep)+'</b><span>Bénéfice du mois</span></div></div>'+
  (s.verification!=='verifie'?'<div class="warn"><b>'+(s.verification==='refuse'?'Vérification refusée.':'Vérification en attente.')+'</b> '+(s.verification==='refuse'&&s.motif_refus?esc(s.motif_refus)+' ':'')+'Ajoutez votre numéro de CNI dans « Réglages ». Le badge bleu rassure les clients.</div>':'<div class="note">Votre boutique est vérifiée '+VERIF+'</div>')+
  '<div class="card stack"><h2 style="font-size:16px">Mon lien à partager</h2><div class="in ell" style="display:flex;align-items:center;font-size:13px">'+esc(shopUrl(s))+'</div><div class="grid2"><button type="button" class="btn btn-v btn-s" data-a="copy" data-text="'+esc(shopUrl(s))+'">'+ic('link',16,'#fff')+'Copier</button><a class="btn btn-g btn-s" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('Découvrez ma boutique '+s.nom+' : '+shopUrl(s))+'">'+ic('wa',16,'#fff')+'Partager</a></div></div>'+
  ((low||out)?'<div class="warn">'+(low?low+' produit(s) en stock bas. ':'')+(out?out+' en rupture.':'')+' <button type="button" class="btn btn-w btn-s" data-a="vtab" data-id="stock" style="margin-left:6px">Voir le stock</button></div>':'')+
  '<div class="card row between"><div><b>Formule '+(s.formule==='pro'?'Pro':'Gratuite')+'</b><div class="small muted">'+(s.formule==='pro'?'Produits illimités':'Jusqu\'à '+S.settings.limite_gratuit+' produits'+(S.settings.prix_pro?' · Pro : '+esc(S.settings.prix_pro)+' F / mois':''))+'</div></div>'+(s.formule==='pro'?'<span class="badge b-orange">Pro</span>':'<span class="badge b-violet">Gratuit</span>')+'</div>'+
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
  const cats=(S.settings.categories||[]).map(c=>'<option value="'+esc(c.id)+'"'+(c.id===p.categorie?' selected':'')+'>'+esc(c.nom)+'</option>').join('');
  const del=ui.edit!=='new'?(ui.confirm==='del-'+p.id?'<div class="warn row between wrapx">Supprimer ce produit ? <span class="row"><button type="button" class="btn btn-w btn-s" data-a="cancelConfirm">Non</button><button type="button" class="btn btn-o btn-s" data-a="delProd" data-id="'+p.id+'">Oui, supprimer</button></span></div>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="del-'+p.id+'">'+ic('trash',16)+'Supprimer ce produit</button>'):'';
  return '<form class="card stack" data-f="produit"><div class="row between"><h2 style="font-size:17px">'+(ui.edit==='new'?'Ajouter un produit':'Modifier le produit')+'</h2><button type="button" class="btn btn-w btn-s" data-a="cancelEdit">Annuler</button></div>'+
  '<div class="row" style="gap:10px"><label class="btn btn-w" style="height:92px;width:110px;flex-direction:column;border:2px dashed #A78BFA;background:#F5F0FF;color:#5B21B6;box-shadow:none;font-size:12px">'+ic('camera',26,'#5B21B6',2)+'Photo<input type="file" accept="image/*" data-file="photo" hidden></label><div style="flex:1;max-width:120px">'+tile({photo:photoPreview,categorie:p.categorie,couleur:p.couleur},92,40)+'</div>'+(photoPreview?'<button type="button" class="btn btn-w btn-s" data-a="rmPhoto">Retirer</button>':'')+'</div>'+
  '<label class="lbl">Nom du produit<input class="in" id="f-nom" name="nom" required maxlength="80" value="'+esc(p.nom)+'" placeholder="Ex. : Robe wax longue"></label>'+
  '<label class="lbl">Description<textarea class="in" id="f-desc" name="description" rows="4" maxlength="1000" placeholder="Matière, tailles, couleurs, livraison…">'+esc(p.description)+'</textarea></label>'+
  '<div class="grid2"><label class="lbl">Prix (FCFA)<input class="in" id="f-prix" name="prix" inputmode="numeric" required value="'+esc(p.prix)+'" placeholder="15000"></label><label class="lbl">Catégorie<select class="in" id="f-cat" name="categorie">'+cats+'</select></label></div>'+
  '<div class="grid2"><label class="lbl">Tailles (facultatif)<input class="in" id="f-tailles" name="tailles" value="'+esc(p.tailles)+'" placeholder="S, M, L"></label><label class="lbl">Quantité en stock<input class="in" id="f-stock" name="stock" type="number" min="0" value="'+esc(p.stock)+'"></label></div>'+
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
  (ords.length?ords.map(o=>'<div class="card stack" style="gap:8px"><div class="row between"><b>Commande du '+esc(String(o.created_at).slice(0,10))+'</b><span class="badge '+lab[o.statut][1]+'">'+lab[o.statut][0]+'</span></div>'+(o.items||[]).map(it=>'<div class="row between small"><span>'+it.qty+' × '+esc(it.nom)+(it.taille?' ('+esc(it.taille)+')':'')+'</span><span class="num">'+F(it.prix*it.qty)+'</span></div>').join('')+'<div class="row between"><span class="muted small">Via '+(o.canal==='telegram'?'Telegram':'WhatsApp')+'</span><b class="price num">'+fmtN(o.total)+' FCFA</b></div>'+
  (o.statut==='envoyee'?'<div class="grid2"><button type="button" class="btn btn-g btn-s" data-a="confOrder" data-id="'+o.id+'">Confirmer la vente</button><button type="button" class="btn btn-w btn-s" data-a="cancelOrder" data-id="'+o.id+'">Annuler</button></div>':'')+'</div>').join(''):'<div class="card muted">Pas encore de commande. Partagez votre lien sur vos statuts.</div>');
}
function shopFields(s,admin){
  const qo=(S.settings.quartiers||[]).map(x=>'<option'+(x===s.quartier?' selected':'')+'>'+esc(x)+'</option>').join('');
  const co=(S.settings.categories||[]).map(x=>'<option value="'+esc(x.id)+'"'+(x.id===s.categorie?' selected':'')+'>'+esc(x.nom)+'</option>').join('');
  const inp=(k,l,ph,t)=>'<label class="lbl">'+l+'<input class="in" id="s-'+k+'" name="'+k+'" '+(t?'type="'+t+'" ':'')+'value="'+esc(s[k])+'" placeholder="'+esc(ph||'')+'"></label>';
  return '<h3 style="font-size:15px">Boutique</h3>'+inp('nom','Nom de la boutique')+(admin?inp('slug','Lien (après #boutique-)'):'')+'<div class="grid2">'+inp('gerant','Nom du gérant')+'<label class="lbl">Catégorie<select class="in" id="s-categorie" name="categorie">'+co+'</select></label></div>'+
  '<label class="lbl">Description de la boutique<textarea class="in" id="s-description" name="description" rows="3">'+esc(s.description)+'</textarea></label>'+
  '<h3 style="font-size:15px">Contacts</h3><div class="grid2">'+inp('whatsapp','WhatsApp (commandes)','07 XX XX XX XX','tel')+inp('telegram','Telegram','@nom')+inp('telephone','Téléphone d\'appel','','tel')+inp('email','E-mail','facultatif','email')+inp('facebook','Facebook','lien de la page')+inp('tiktok','TikTok','@compte')+'</div>'+
  '<h3 style="font-size:15px">Localisation et livraison</h3><div class="grid2">'+inp('ville','Ville')+'<label class="lbl">Quartier<select class="in" id="s-quartier" name="quartier">'+qo+'</select></label></div>'+inp('adresse','Adresse ou point de repère')+'<div class="grid2">'+inp('livraison_zones','Zones de livraison')+inp('livraison_frais','Frais de livraison (F)')+'</div>';
}
function vvReglages(s){
  const pv=S.priv[s.id]||{};
  return '<form class="card stack" data-f="shop" data-id="'+s.id+'">'+shopFields(s,false)+'<h3 style="font-size:15px">Vérification</h3><label class="lbl">Numéro de la pièce d\'identité (CNI)<input class="in" id="s-cni" name="cni" value="'+esc(pv.cni)+'" placeholder="C00XXXXXXX"></label><p class="small muted" style="margin:0">Visible seulement par vous et l\'administrateur.</p><button class="btn btn-v btn-block" type="submit">Enregistrer</button></form><button type="button" class="btn btn-w btn-block" data-a="logout">Se déconnecter</button>';
}

/* ---------- ADMIN ---------- */
function vAdmin(){
  if(!S.user)return authForms('Espace administrateur','Connectez-vous avec votre compte administrateur.',false);
  if(!isAdmin())return '<div class="wrap">'+logoHTML()+'<div class="card stack"><h1 style="font-size:19px">Accès réservé</h1><p class="muted" style="margin:0">Ce compte n\'est pas administrateur.</p><button type="button" class="btn btn-w" data-a="logout">Se déconnecter</button></div></div>';
  const tabs=[['tableau','Tableau de bord'],['vendeurs','Vendeurs'],['produits','Produits'],['commandes','Commandes'],['catalogue','Catégories et quartiers'],['parametres','Paramètres']];
  const wait=S.shops.filter(s=>s.verification==='attente').length;
  const h='<div class="wrap wide"><div class="row between wrapx">'+logoHTML()+'<div class="row"><span class="badge b-violet">Administrateur</span><button type="button" class="btn btn-w btn-s" data-a="logout">Se déconnecter</button></div></div><div class="tabs">'+tabs.map(t=>'<button type="button" class="tab'+(ui.aTab===t[0]?' on':'')+'" data-a="atab" data-id="'+t[0]+'">'+t[1]+(t[0]==='vendeurs'&&wait?' <span class="badge b-orange">'+wait+'</span>':'')+'</button>').join('')+'</div>';
  if(ui.aTab==='vendeurs'&&ui.adminShop)return h+aFiche(shopById(ui.adminShop))+'</div>';
  return h+({tableau:aTableau,vendeurs:aVendeurs,produits:aProduits,commandes:aCommandes,catalogue:aCatalogue,parametres:aParams}[ui.aTab]||aTableau)()+'</div>';
}
function aTableau(){
  const L=S.shops,stat=(v,l,c)=>'<div class="stat'+(c?' '+c:'')+'"><b class="num">'+v+'</b><span>'+l+'</span></div>';
  const conf=S.orders.filter(o=>o.statut==='confirmee');
  const byQ=(S.settings.quartiers||[]).map(x=>[x,L.filter(s=>s.quartier===x).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...byQ.map(x=>x[1]));
  const byC=(S.settings.categories||[]).map(c=>[c.nom,S.products.filter(p=>p.categorie===c.id).length]).filter(x=>x[1]),mc=Math.max(1,...byC.map(x=>x[1]));
  const bars=(arr,m)=>arr.length?arr.map(x=>'<div class="row small"><span style="width:90px">'+esc(x[0])+'</span><span class="bar"><span style="width:'+(x[1]/m*100)+'%"></span></span><b class="num" style="width:24px;text-align:right">'+x[1]+'</b></div>').join(''):'<p class="muted" style="margin:0">Pas encore de données.</p>';
  return '<div class="gridf" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr))">'+stat(L.filter(s=>s.statut==='actif').length,'Vendeurs actifs','dark')+stat(L.filter(s=>s.verification==='attente').length,'Vérifications en attente')+stat(L.filter(s=>s.formule==='pro').length,'Abonnés Pro')+stat(S.products.length,'Produits')+stat(S.orders.length,'Commandes envoyées')+stat(fmtN(conf.reduce((a,o)=>a+o.total,0))+' F','Ventes confirmées')+'</div>'+
  '<div class="gridf"><section class="card stack"><h2 style="font-size:17px">Vendeurs par quartier</h2>'+bars(byQ,mx)+'</section><section class="card stack"><h2 style="font-size:17px">Produits par catégorie</h2>'+bars(byC,mc)+'</section><section class="card stack"><h2 style="font-size:17px">À vérifier</h2>'+(L.filter(s=>s.verification==='attente').map(s=>'<div class="row between"><span class="row">'+avatar(s,34)+esc(s.nom)+'</span><button type="button" class="btn btn-g btn-s" data-a="aOpen" data-id="'+s.id+'">Ouvrir</button></div>').join('')||'<p class="muted" style="margin:0">Rien en attente.</p>')+'</section></div>';
}
const badgeVerif=s=>s.verification==='verifie'?'<span class="badge b-blue">Vérifié</span>':s.verification==='refuse'?'<span class="badge b-grey">Refusé</span>':'<span class="badge b-amber">En attente</span>';
function aVendeurs(){
  const qq=ui.aQ.toLowerCase();
  const list=S.shops.filter(s=>(ui.aFilter==='tous'||(ui.aFilter==='attente'&&s.verification==='attente')||(ui.aFilter==='pro'&&s.formule==='pro')||(ui.aFilter==='suspendu'&&s.statut==='suspendu'))&&(!qq||(s.nom+' '+s.quartier+' '+s.whatsapp).toLowerCase().includes(qq)));
  return '<section class="card stack"><div class="row between wrapx"><h2 style="font-size:17px">Vendeurs ('+list.length+')</h2><div class="row wrapx">'+[['tous','Tous'],['attente','En attente'],['pro','Pro'],['suspendu','Suspendus']].map(x=>'<button type="button" class="chip'+(ui.aFilter===x[0]?' on':'')+'" data-a="aFilter" data-id="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>'+
  '<label class="search" style="margin:0;box-shadow:none;border:1.5px solid #E2D9F8">'+ic('search',18,'#6B5B8C')+'<span hidden>Rechercher un vendeur</span><input id="aq" type="search" placeholder="Nom, quartier, numéro…" value="'+esc(ui.aQ)+'" data-i="aQ"></label>'+
  '<div class="tbl-wrap"><table><thead><tr><th>Boutique</th><th>Quartier</th><th>WhatsApp</th><th>Produits</th><th>Formule</th><th>Vérification</th><th>Statut</th><th><span hidden>Actions</span></th></tr></thead><tbody>'+
  list.map(s=>'<tr><td><span class="row">'+avatar(s,34)+'<b>'+esc(s.nom)+'</b>'+(s.vedette?'<span class="badge b-orange">Vedette</span>':'')+'</span></td><td>'+esc(s.quartier)+'</td><td class="num">'+esc(s.whatsapp)+'</td><td class="num">'+shopProducts(s.id).length+'</td><td>'+(s.formule==='pro'?'<span class="badge b-orange">Pro</span>':'<span class="badge b-violet">Gratuit</span>')+'</td><td>'+badgeVerif(s)+'</td><td>'+(s.statut==='actif'?'<span class="badge b-green">Actif</span>':'<span class="badge b-grey">Suspendu</span>')+'</td><td style="text-align:right"><button type="button" class="btn btn-w btn-s" data-a="aOpen" data-id="'+s.id+'">Ouvrir la fiche</button></td></tr>').join('')+'</tbody></table></div></section>';
}
function aFiche(s){
  if(!s){ui.adminShop=null;return aVendeurs();}
  const pv=S.priv[s.id]||{};
  const sel=(k,l,opts)=>'<label class="lbl">'+l+'<select class="in" id="s-'+k+'" name="'+k+'">'+opts.map(o=>'<option value="'+o[0]+'"'+(String(s[k])===String(o[0])?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></label>';
  const prods=shopProducts(s.id),ords=S.orders.filter(o=>o.shop_id===s.id);
  const delBtn=ui.confirm==='delShop'?'<span class="row"><span class="small">Supprimer définitivement ?</span><button type="button" class="btn btn-w btn-s" data-a="cancelConfirm">Non</button><button type="button" class="btn btn-o btn-s" data-a="delShop" data-id="'+s.id+'">Oui</button></span>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="delShop">Supprimer</button>';
  return '<div class="hero row between wrapx" style="gap:12px"><div class="row" style="position:relative"><button type="button" class="icon-btn" style="background:rgba(255,255,255,.18)" data-a="aClose" aria-label="Retour à la liste">'+ic('back',20,'#fff')+'</button>'+avatar(s,56)+'<div><h1 style="font-size:22px;max-width:none">'+esc(s.nom)+'</h1><p style="margin:0">Inscrit le '+esc(String(s.created_at).slice(0,10))+' · '+prods.length+' produits · '+ords.length+' commandes</p></div></div><div class="row wrapx" style="position:relative"><button type="button" class="btn btn-g btn-s" data-a="aVerif" data-id="'+s.id+'">Vérifier</button><button type="button" class="btn btn-o btn-s" data-a="aSusp" data-id="'+s.id+'">'+(s.statut==='actif'?'Suspendre':'Réactiver')+'</button>'+delBtn+'</div></div>'+
  '<form class="stack" data-f="shop" data-id="'+s.id+'" data-admin="1"><div class="gridf"><section class="card stack">'+shopFields(s,true)+'</section><div class="stack">'+
  '<section class="card stack"><h3 style="font-size:15px">Vérification</h3>'+sel('verification','Statut',[['attente','En attente'],['verifie','Vérifié'],['refuse','Refusé']])+'<label class="lbl">N° pièce d\'identité<input class="in" id="s-cni" name="cni" value="'+esc(pv.cni)+'"></label><label class="lbl">Motif de refus<input class="in" id="s-motif_refus" name="motif_refus" value="'+esc(s.motif_refus)+'" placeholder="si refusé"></label></section>'+
  '<section class="card stack"><h3 style="font-size:15px">Abonnement et visibilité</h3>'+sel('formule','Formule',[['gratuit','Gratuit (jusqu\'à '+S.settings.limite_gratuit+' produits)'],['pro','Pro (illimité)']])+sel('vedette','Mise en vedette',[['false','Non'],['true','Oui, en vedette']])+sel('statut','Statut du compte',[['actif','Actif'],['suspendu','Suspendu']])+'</section>'+
  '<section class="card stack"><h3 style="font-size:15px">Notes internes (admin seulement)</h3><textarea class="in" id="s-notes" name="notes" rows="4" placeholder="Ex. : appelé le vendeur, pièce floue…">'+esc(pv.notes)+'</textarea></section></div></div><button class="btn btn-v btn-block" type="submit">Enregistrer la fiche</button></form>';
}
function aProduits(){
  return '<section class="card stack"><h2 style="font-size:17px">Tous les produits ('+S.products.length+')</h2><div class="tbl-wrap"><table><thead><tr><th>Produit</th><th>Boutique</th><th>Prix</th><th>Stock</th><th>Catégorie</th><th>Visible</th><th><span hidden>Actions</span></th></tr></thead><tbody>'+
  S.products.map(p=>{const s=shopById(p.shop_id);return '<tr><td><span class="row"><span style="width:40px;flex-shrink:0">'+tile(p,40,20)+'</span><span><b>'+esc(p.nom)+'</b><br><span class="small muted">'+esc((p.description||'').slice(0,50))+'</span></span></span></td><td>'+esc(s?s.nom:'?')+'</td><td class="num">'+F(p.prix)+'</td><td class="num">'+p.stock+'</td><td>'+esc(catName(p.categorie))+'</td><td><button type="button" class="switch'+(p.visible?' on':'')+'" data-a="vis" data-id="'+p.id+'" aria-label="Visibilité" aria-pressed="'+p.visible+'"></button></td><td>'+(ui.confirm==='del-'+p.id?'<button type="button" class="btn btn-o btn-s" data-a="delProd" data-id="'+p.id+'">Confirmer</button>':'<button type="button" class="btn btn-w btn-s" data-a="confirm" data-id="del-'+p.id+'">Supprimer</button>')+'</td></tr>';}).join('')+'</tbody></table></div></section>';
}
function aCommandes(){
  const lab={envoyee:'<span class="badge b-orange">Envoyée</span>',confirmee:'<span class="badge b-green">Confirmée</span>',annulee:'<span class="badge b-grey">Annulée</span>'};
  return '<section class="card stack"><h2 style="font-size:17px">Commandes ('+S.orders.length+')</h2>'+(S.orders.length?'<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Boutique</th><th>Articles</th><th>Total</th><th>Canal</th><th>Statut</th></tr></thead><tbody>'+S.orders.map(x=>{const s=shopById(x.shop_id);return '<tr><td>'+esc(String(x.created_at).slice(0,16).replace('T',' '))+'</td><td>'+esc(s?s.nom:'?')+'</td><td>'+(x.items||[]).map(i=>i.qty+' × '+esc(i.nom)).join('<br>')+'</td><td class="num"><b>'+fmtN(x.total)+' F</b></td><td>'+(x.canal==='telegram'?'Telegram':'WhatsApp')+'</td><td>'+lab[x.statut]+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="muted" style="margin:0">Aucune commande pour l\'instant.</p>')+'</section>';
}
function aCatalogue(){
  const st=S.settings;
  return '<div class="gridf"><section class="card stack"><h2 style="font-size:17px">Catégories</h2>'+(st.categories||[]).map(c=>'<div class="row between"><span>'+esc(c.nom)+' <span class="small muted">('+S.products.filter(p=>p.categorie===c.id).length+' produits)</span></span><button type="button" class="btn btn-w btn-s" data-a="delCat" data-id="'+esc(c.id)+'">Retirer</button></div>').join('')+
  '<form class="row" data-f="cat"><label class="lbl" style="flex:1"><span hidden>Nouvelle catégorie</span><input class="in" id="n-cat" name="nom" required placeholder="Nouvelle catégorie"></label><button class="btn btn-v btn-s" type="submit">Ajouter</button></form></section>'+
  '<section class="card stack"><h2 style="font-size:17px">Quartiers</h2><div class="row wrapx">'+(st.quartiers||[]).map(x=>'<span class="chip row" style="gap:6px;cursor:default">'+esc(x)+'<button type="button" data-a="delQ" data-id="'+esc(x)+'" aria-label="Retirer '+esc(x)+'" style="border:0;background:none;cursor:pointer;font-weight:800;color:var(--muted)">×</button></span>').join('')+'</div>'+
  '<form class="row" data-f="quartier"><label class="lbl" style="flex:1"><span hidden>Nouveau quartier</span><input class="in" id="n-q" name="nom" required placeholder="Nouveau quartier"></label><button class="btn btn-v btn-s" type="submit">Ajouter</button></form></section></div>';
}
function aParams(){
  const st=S.settings;
  return '<form class="card stack" data-f="params" style="max-width:640px"><h2 style="font-size:17px">Paramètres de la plateforme</h2><label class="lbl">Nom de la plateforme<input class="in" id="p-nom" name="nom" value="'+esc(st.nom)+'"></label><div class="grid2"><label class="lbl">Produits gratuits par vendeur<input class="in" id="p-lim" name="limite_gratuit" type="number" min="1" value="'+st.limite_gratuit+'"></label><label class="lbl">Prix Pro (FCFA / mois)<input class="in" id="p-pro" name="prix_pro" inputmode="numeric" value="'+esc(st.prix_pro)+'" placeholder="à définir"></label></div><label class="lbl">Prix mise en vedette (FCFA / semaine)<input class="in" id="p-ved" name="prix_vedette" inputmode="numeric" value="'+esc(st.prix_vedette)+'" placeholder="à définir"></label><button class="btn btn-v btn-block" type="submit">Enregistrer</button></form>';
}

/* ---------- NAV / RENDER ---------- */
function nav(h){
  const base=h.startsWith('boutique-')||h.startsWith('produit-')?'accueil':h;
  const it=(id,label,icon,extra)=>'<a href="#'+id+'" class="'+(base===id?'on':'')+'">'+ic(icon,22)+label+(extra||'')+'</a>';
  const c=cartCount();
  return '<nav class="nav" aria-label="Navigation">'+it('accueil','Accueil','home')+it('panier','Panier','bag',c?'<span class="cnt">'+c+'</span>':'')+it('vendeur','Vendeur','user')+(isAdmin()?it('admin','Admin','shield'):'')+'</nav>';
}
let lastHash=null;
function render(keep){
  if(!S.loaded){app.innerHTML='<div class="loading">Chargement…</div>';return;}
  const h=(location.hash||'#accueil').slice(1)||'accueil';
  let html;
  if(h.startsWith('boutique-'))html=vBoutique(decodeURIComponent(h.slice(9)));
  else if(h.startsWith('produit-'))html=vProduit(h.slice(8));
  else if(h==='panier')html=vPanier();
  else if(h==='vendeur')html=vVendeur();
  else if(h==='admin')html=vAdmin();
  else html=vAccueil();
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
function logOrder(shopId,canal,single){
  const lines=single?[{p:prodById(single),qty:1,taille:ui.taille}]:cart.map(l=>({p:prodById(l.pid),qty:l.qty,taille:l.taille})).filter(l=>l.p&&l.p.shop_id===shopId);
  if(!lines.length)return;
  const row={shop_id:shopId,canal,statut:'envoyee',items:lines.map(l=>({pid:l.p.id,nom:l.p.nom,prix:l.p.prix,qty:l.qty,taille:l.taille||null})),total:lines.reduce((a,l)=>a+l.p.prix*l.qty,0)};
  sb.from('orders').insert(row).then(()=>{},()=>{});
  if(!single){cart=cart.filter(l=>{const p=prodById(l.pid);return p&&p.shop_id!==shopId;});saveCart();setTimeout(()=>render(true),400);}
}

/* photos */
function resizePhoto(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const m=900,k=Math.min(1,m/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?res({blob:b,url:URL.createObjectURL(b)}):rej(new Error('photo')),'image/jpeg',.75);};img.onerror=rej;img.src=r.result;};r.onerror=rej;r.readAsDataURL(file);});}
async function uploadPhoto(blob){
  const path=S.user.id+'/'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2))+'.jpg';
  await q(sb.storage.from('photos').upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'}));
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

/* share image */
function rr(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();}
async function shareImage(p){
  const s=shopById(p.shop_id);try{await document.fonts.ready;}catch(e){}
  const c=document.createElement('canvas');c.width=1080;c.height=1920;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,700,1920);g.addColorStop(0,'#6D28D9');g.addColorStop(.6,'#3B0F87');g.addColorStop(1,'#1B1033');x.fillStyle=g;x.fillRect(0,0,1080,1920);
  const ball=(cx,cy,r,a,b,cc)=>{const rg=x.createRadialGradient(cx-r*.3,cy-r*.4,r*.1,cx,cy,r);rg.addColorStop(0,a);rg.addColorStop(.55,b);rg.addColorStop(1,cc);x.fillStyle=rg;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();};
  ball(1000,330,200,'#FFC48A','#FF7A1A','#C2410C');ball(60,1450,280,'#A7F3D0','#10B981','#047857');
  x.fillStyle='#fff';rr(x,80,90,120,120,36);x.fill();x.fillStyle='#6D28D9';x.font='800 48px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(initials(s.nom),140,152);
  x.textAlign='left';x.fillStyle='#fff';x.font='700 52px Inter, sans-serif';x.fillText(s.nom,230,130);x.fillStyle='#E9DDFF';x.font='500 36px Inter, sans-serif';x.fillText(s.quartier+(s.verification==='verifie'?' · Vendeur vérifié':''),230,190);
  x.save();x.translate(540,780);x.rotate(-.06);x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=80;x.shadowOffsetY=50;rr(x,-360,-400,720,800,80);
  let drawn=false;
  if(p.photo){x.fillStyle='#fff';x.fill();x.shadowColor='transparent';x.clip();try{const img=new Image();img.crossOrigin='anonymous';img.src=p.photo;await new Promise((r,j)=>{img.onload=r;img.onerror=j;});const k=Math.max(720/img.width,800/img.height);x.drawImage(img,-img.width*k/2,-img.height*k/2,img.width*k,img.height*k);drawn=true;}catch(e){}}
  if(!drawn){const pc=pal(p.couleur),rg=x.createRadialGradient(-150,-200,40,0,0,700);rg.addColorStop(0,pc[0]);rg.addColorStop(.55,pc[1]);rg.addColorStop(1,pc[2]);x.fillStyle=rg;x.fill();x.shadowColor='transparent';x.fillStyle='rgba(255,255,255,.9)';x.font='800 300px Sora, sans-serif';x.textAlign='center';x.fillText(initials(p.nom),0,20);}
  x.restore();
  x.fillStyle='#FF7A1A';rr(x,760,360,250,90,28);x.fill();x.fillStyle='#1B1033';x.font='800 40px Inter, sans-serif';x.textAlign='center';x.fillText('Nouveau',885,407);
  x.textAlign='left';x.fillStyle='#fff';x.font='700 72px Sora, sans-serif';
  let line='',y=1330;p.nom.split(' ').forEach(w=>{if(x.measureText(line+w).width>920&&line){x.fillText(line.trim(),80,y);y+=86;line='';}line+=w+' ';});x.fillText(line.trim(),80,y);
  x.fillStyle='#FFD4A8';x.font='800 104px Sora, sans-serif';x.fillText(fmtN(p.prix)+' FCFA',80,y+130);
  const link=(location.host+location.pathname).replace(/\/$/,'')+' #'+s.slug;
  x.fillStyle='#fff';rr(x,80,1700,920,140,44);x.fill();x.fillStyle='#1B1033';x.font='700 34px Inter, sans-serif';x.fillText(link.length>34?(S.settings.nom||'Gbairai Market'):link,130,1772);
  x.fillStyle='#0E7A5F';rr(x,700,1720,280,100,32);x.fill();x.fillStyle='#fff';x.font='800 38px Inter, sans-serif';x.textAlign='center';x.fillText('Commander',840,1772);
  return c.toDataURL('image/jpeg',.88);
}
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
  order:t=>logOrder(t.dataset.shop,'whatsapp',t.dataset.single),
  orderTg:t=>{copy(t.dataset.text,'Message copié : collez-le sur Telegram');logOrder(t.dataset.shop,'telegram');},
  copy:t=>copy(t.dataset.text),
  share:t=>showShare(t.dataset.id),
  closeModal:()=>{document.getElementById('layer').innerHTML='';},
  authMode:t=>{ui.authMode=t.dataset.id;render(true);},
  logout:()=>act(async()=>{await sb.auth.signOut();ui.vTab='accueil';ui.adminShop=null;},'Déconnecté'),
  vtab:t=>{ui.vTab=t.dataset.id;ui.edit=null;ui.photo=undefined;ui.confirm=null;render();},
  newProd:()=>{const s=myShop();if(s.formule!=='pro'&&shopProducts(s.id).length>=S.settings.limite_gratuit){ui.vTab='produits';render();toast('Limite gratuite atteinte ('+S.settings.limite_gratuit+' produits). Passez Pro.');return;}ui.vTab='produits';ui.edit='new';ui.newColor=Math.floor(Math.random()*6);ui.photo=undefined;render();},
  editProd:t=>{ui.edit=t.dataset.id;ui.photo=undefined;ui.confirm=null;render();},
  cancelEdit:()=>{ui.edit=null;ui.photo=undefined;ui.confirm=null;render();},
  rmPhoto:()=>{keepForm();ui.photo=null;render(true);restoreForm();},
  vis:t=>{const p=prodById(t.dataset.id);act(()=>q(sb.from('products').update({visible:!p.visible}).eq('id',p.id)));},
  confirm:t=>{ui.confirm=t.dataset.id;render(true);},
  cancelConfirm:()=>{ui.confirm=null;render(true);},
  delProd:t=>act(async()=>{await q(sb.from('products').delete().eq('id',t.dataset.id));cart=cart.filter(l=>l.pid!==t.dataset.id);saveCart();ui.edit=null;ui.confirm=null;},'Produit supprimé'),
  stock:t=>{const p=prodById(t.dataset.id);const v=Math.max(0,p.stock+(+t.dataset.d));p.stock=v;render(true);act(()=>q(sb.from('products').update({stock:v}).eq('id',p.id)));},
  periode:t=>{ui.caissePeriode=t.dataset.id;render(true);},
  delTx:t=>act(()=>q(sb.from('txs').delete().eq('id',t.dataset.id))),
  confOrder:t=>act(async()=>{const o=S.orders.find(x=>x.id===t.dataset.id);
    await q(sb.from('orders').update({statut:'confirmee'}).eq('id',o.id));
    for(const it of (o.items||[])){const p=prodById(it.pid);if(p)await q(sb.from('products').update({stock:Math.max(0,p.stock-it.qty)}).eq('id',p.id));}
    await q(sb.from('txs').insert({shop_id:o.shop_id,type:'recette',montant:o.total,libelle:'Vente · '+(o.items||[]).map(i=>i.qty+' '+i.nom).join(', ').slice(0,120),date:today()}));},'Vente confirmée : caisse et stock mis à jour'),
  cancelOrder:t=>act(()=>q(sb.from('orders').update({statut:'annulee'}).eq('id',t.dataset.id))),
  atab:t=>{ui.aTab=t.dataset.id;ui.adminShop=null;ui.confirm=null;render();},
  aFilter:t=>{ui.aFilter=t.dataset.id;render(true);},
  aOpen:t=>{ui.aTab='vendeurs';ui.adminShop=t.dataset.id;ui.confirm=null;render();},
  aClose:()=>{ui.adminShop=null;ui.confirm=null;render();},
  aVerif:t=>act(()=>q(sb.from('shops').update({verification:'verifie',motif_refus:''}).eq('id',t.dataset.id)),'Vendeur vérifié'),
  aSusp:t=>{const s=shopById(t.dataset.id);act(()=>q(sb.from('shops').update({statut:s.statut==='actif'?'suspendu':'actif'}).eq('id',s.id)),s.statut==='actif'?'Boutique suspendue':'Boutique réactivée');},
  delShop:t=>act(async()=>{await q(sb.from('shops').delete().eq('id',t.dataset.id));ui.adminShop=null;ui.confirm=null;},'Boutique supprimée'),
  delCat:t=>{if(S.products.some(p=>p.categorie===t.dataset.id)){toast('Des produits utilisent cette catégorie');return;}act(()=>q(sb.from('settings').update({categories:S.settings.categories.filter(c=>c.id!==t.dataset.id)}).eq('id',1)));},
  delQ:t=>{if(S.shops.some(s=>s.quartier===t.dataset.id)){toast('Des boutiques sont dans ce quartier');return;}act(()=>q(sb.from('settings').update({quartiers:S.settings.quartiers.filter(x=>x!==t.dataset.id)}).eq('id',1)));}
};
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');if(!t)return;
  if(t.classList.contains('modal')&&e.target!==t)return;
  const f=A[t.dataset.a];if(f)f(t,e);
});
document.addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.i;if(!k)return;ui[k]=e.target.value;
  if(k==='q')document.getElementById('results').innerHTML=results();
  else if(k==='aQ'){const pos=e.target.selectionStart;render(true);const el=document.getElementById('aq');if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(_){}}}
});
let formCache=null;
function keepForm(){const f=document.querySelector('form[data-f="produit"]');if(!f)return;formCache={};new FormData(f).forEach((v,k)=>formCache[k]=v);formCache.visible=f.querySelector('#f-vis').checked;}
function restoreForm(){const f=document.querySelector('form[data-f="produit"]');if(!f||!formCache)return;Object.keys(formCache).forEach(k=>{const el=f.elements[k];if(!el)return;if(el.type==='checkbox')el.checked=formCache[k];else el.value=formCache[k];});formCache=null;}
document.addEventListener('change',async e=>{
  if(e.target.dataset&&e.target.dataset.file==='photo'&&e.target.files[0]){
    try{const r=await resizePhoto(e.target.files[0]);keepForm();ui.photo=r;render(true);restoreForm();}catch(err){toast('Impossible de lire cette photo');}
  }
});
async function createShop(d){
  let base=slugify(d.nom),slug=base,i=2;
  while(S.shops.some(s=>s.slug===slug))slug=base+'-'+(i++);
  const row={owner:S.user.id,slug,nom:d.nom.trim(),whatsapp:d.phone.trim(),quartier:d.quartier,categorie:d.categorie,couleur:Math.floor(Math.random()*6)};
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
  login:d=>act(async()=>{const r=await sb.auth.signInWithPassword({email:phoneEmail(d.phone),password:d.password});if(r.error)throw r.error;},'Connecté'),
  newshop:d=>act(()=>createShop(d),'Boutique créée'),
  produit:(d,f)=>act(async()=>{
    const s=myShop(),prix=n0(d.prix);if(prix<=0)throw new Error('Indiquez un prix.');
    const data={nom:d.nom.trim(),description:d.description.trim(),prix:Math.round(prix),categorie:d.categorie,tailles:d.tailles.trim(),stock:Math.max(0,Math.round(n0(d.stock))),visible:f.querySelector('#f-vis').checked};
    if(ui.photo)data.photo=await uploadPhoto(ui.photo.blob);else if(ui.photo===null)data.photo=null;
    if(ui.edit==='new')await q(sb.from('products').insert(Object.assign({shop_id:s.id,couleur:ui.newColor||0},data)));
    else await q(sb.from('products').update(data).eq('id',ui.edit));
    ui.edit=null;ui.photo=undefined;
  },'Produit enregistré'),
  tx:d=>act(async()=>{const m=Math.round(n0(d.montant));if(m<=0)throw new Error('Indiquez un montant.');await q(sb.from('txs').insert({shop_id:myShop().id,type:d.type,montant:m,libelle:d.libelle.trim(),date:d.date||today()}));},'Mouvement enregistré'),
  shop:(d,f)=>act(async()=>{
    const id=f.dataset.id,admin=f.dataset.admin==='1';
    const keys=['nom','gerant','categorie','description','whatsapp','telegram','telephone','email','facebook','tiktok','ville','quartier','adresse','livraison_zones','livraison_frais'];
    if(admin)keys.push('verification','motif_refus','formule','statut');
    const row={};keys.forEach(k=>{if(k in d)row[k]=String(d[k]).trim();});
    if(admin&&'vedette' in d)row.vedette=d.vedette==='true';
    if(admin&&d.slug){const sl=slugify(d.slug);if(S.shops.some(x=>x.slug===sl&&x.id!==id))throw new Error('Ce lien est déjà pris.');row.slug=sl;}
    await q(sb.from('shops').update(row).eq('id',id));
    const pv={shop_id:id,cni:String(d.cni||'').trim()};if(admin)pv.notes=String(d.notes||'');
    await q(sb.from('shop_private').upsert(pv));
  },'Enregistré'),
  cat:d=>act(()=>{const id=slugify(d.nom);if(S.settings.categories.some(c=>c.id===id))return Promise.resolve();return q(sb.from('settings').update({categories:S.settings.categories.concat([{id,nom:d.nom.trim()}])}).eq('id',1));}),
  quartier:d=>act(()=>{const x=d.nom.trim();if(!x||S.settings.quartiers.includes(x))return Promise.resolve();return q(sb.from('settings').update({quartiers:S.settings.quartiers.concat([x])}).eq('id',1));}),
  params:d=>act(()=>q(sb.from('settings').update({nom:d.nom.trim()||'Gbairai Market',limite_gratuit:Math.max(1,Math.round(n0(d.limite_gratuit))),prix_pro:d.prix_pro,prix_vedette:d.prix_vedette}).eq('id',1)),'Paramètres enregistrés')
};
document.addEventListener('submit',e=>{
  const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();
  const d={};new FormData(f).forEach((v,k)=>d[k]=v);const fn=FORMS[f.dataset.f];if(fn)fn(d,f);
});
window.addEventListener('hashchange',()=>{ui.confirm=null;ui.taille=null;document.getElementById('layer').innerHTML='';render();});
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'||ev==='TOKEN_REFRESHED')return;});
render();
loadAll().then(()=>render());
})();
