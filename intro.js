/* Gbairai Market : 3 écrans d'accueil, affichés à la première ouverture */
(function(){
  var KEY='gbairai-intro';
  function seen(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
  function mark(){try{localStorage.setItem(KEY,'1');}catch(e){}}
  var h=(location.hash||'').slice(1);
  var force=/[?&]intro=1/.test(location.search);
  if(!force&&(seen()||/^(boutique-|produit-|suivi-|b\/|p\/)/.test(h)))return;

  var wa='<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.1.1.6-.1 1.2z"/></svg>';
  var slides=[
    {t:'Toutes les boutiques de Côte d\'Ivoire',d:'Mode, beauté, téléphones, chaussures… Des centaines de vendeurs, d\'Abidjan à Korhogo, au même endroit.',
     art:'<div class="in-art a1"><span class="ball o" style="width:120px;height:120px;right:-10px;top:10px"></span><span class="ball g" style="width:44px;height:44px;left:30px;bottom:40px"></span>'+
      '<img class="in-logo" src="icons/logo.svg" alt="">'+
      ['Abidjan','Bouaké','Korhogo','San-Pédro','Yamoussoukro','Daloa','Man'].map(function(v,i){return '<span class="in-pill p'+i+'">📍 '+v+'</span>';}).join('')+'</div>'},
    {t:'Commandez en 1 clic sur WhatsApp',d:'Choisissez vos articles, puis le message de commande part tout seul chez le vendeur. Suivez ensuite votre livraison.',
     art:'<div class="in-art a2"><span class="ball o" style="width:70px;height:70px;left:10px;top:20px"></span>'+
      '<div class="in-phone"><div class="in-chat-h"><span class="in-av">AM</span><b>Awa Mode</b></div>'+
      '<div class="in-bub me">Bonjour, je veux commander :<br>• 1 × Robe wax – <b>15 000 F</b><br>📦 Commande n° 52A2</div>'+
      '<div class="in-bub them">Merci ! Livraison demain à Cocody 🛵</div>'+
      '<div class="in-wa">'+wa+'Commander sur WhatsApp</div></div></div>'},
    {t:'Vous vendez ? Votre boutique est gratuite',d:'Créez votre boutique en 2 minutes avec votre numéro. Partagez votre lien en statut et recevez les commandes.',
     art:'<div class="in-art a3"><span class="ball g" style="width:90px;height:90px;right:0;bottom:30px"></span>'+
      '<div class="in-shop"><div class="in-cover"><span class="in-ved">Vedette</span></div><span class="in-slogo">TI</span>'+
      '<b>Ma Boutique ✔</b><small>Yopougon, Abidjan · 24 produits</small><div class="in-stars">★★★★★ <span>4.9</span></div></div>'+
      '<div class="in-stat s1"><small>Ventes du mois</small><b>385 000 F</b></div>'+
      '<div class="in-stat s2"><small>Nouvelles commandes</small><b>+12</b></div></div>'}
  ];

  var css=document.createElement('style');
  css.textContent=
  '#intro{position:fixed;inset:0;z-index:100;background:linear-gradient(165deg,#2E1065,#1B1033 70%);color:#fff;display:flex;flex-direction:column;font-family:var(--body)}'+
  '#intro .in-top{display:flex;justify-content:space-between;align-items:center;padding:calc(16px + env(safe-area-inset-top,0px)) 20px 0;max-width:560px;width:100%;margin:0 auto;box-sizing:border-box}'+
  '#intro .in-brand{display:flex;align-items:center;gap:8px;font-family:var(--display);font-weight:800;font-size:17px}#intro .in-brand img{width:30px;height:30px}#intro .in-brand i{color:#FF7A1A;font-style:normal}'+
  '#intro .in-skip{background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;padding:8px 14px;font:600 14px var(--body);cursor:pointer}'+
  '#intro .in-track{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}#intro .in-track::-webkit-scrollbar{display:none}'+
  '#intro .in-slide{flex:0 0 100%;scroll-snap-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 24px;box-sizing:border-box;gap:22px}'+
  '#intro .in-txt{max-width:440px;text-align:center}#intro h2{font-family:var(--display);font-size:27px;line-height:1.2;margin:0 0 10px;color:#fff}#intro p{margin:0;color:#D8CCF5;font-size:15.5px;line-height:1.5}'+
  '#intro .in-art{position:relative;width:min(320px,82vw);height:min(320px,42vh);min-height:240px}'+
  '.a1 .in-logo{position:absolute;left:50%;top:50%;width:120px;height:120px;transform:translate(-50%,-50%);filter:drop-shadow(0 20px 30px rgba(0,0,0,.5))}'+
  '.in-pill{position:absolute;background:#fff;color:#1B1033;font-weight:700;font-size:12.5px;padding:7px 12px;border-radius:999px;box-shadow:0 6px 0 #C4B5FD,0 14px 24px -8px rgba(0,0,0,.5);white-space:nowrap;animation:inF 4s ease-in-out infinite}'+
  '.p0{left:4%;top:8%}.p1{right:2%;top:30%;animation-delay:.5s}.p2{left:0;top:44%;animation-delay:1s}.p3{left:16%;bottom:12%;animation-delay:1.5s}.p4{right:4%;bottom:26%;animation-delay:2s}.p5{left:40%;top:0;animation-delay:2.5s}.p6{right:16%;bottom:2%;animation-delay:3s}'+
  '@keyframes inF{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}'+
  '.in-phone{position:absolute;inset:8% 8% 0;background:#ECE5DD;border-radius:28px 28px 0 0;border:6px solid #0B0618;border-bottom:0;padding:0 12px 12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 30px 50px -20px rgba(0,0,0,.7);overflow:hidden}'+
  '.in-chat-h{margin:0 -12px;background:#075E54;color:#fff;display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:14px}.in-av{width:28px;height:28px;border-radius:50%;background:#8B5CF6;display:grid;place-items:center;font-size:11px;font-weight:800}'+
  '.in-bub{max-width:85%;font-size:12.5px;line-height:1.4;color:#111;padding:8px 10px;border-radius:12px;box-shadow:0 1px 1px rgba(0,0,0,.15)}.in-bub.me{align-self:flex-end;background:#DCF8C6}.in-bub.them{background:#fff}'+
  '.in-wa{margin-top:auto;background:#0E7A5F;color:#fff;font-weight:700;font-size:14px;border-radius:14px;padding:11px;display:flex;justify-content:center;align-items:center;gap:8px;box-shadow:0 5px 0 #064E3B}'+
  '.in-shop{position:absolute;left:4%;top:4%;width:72%;background:#fff;color:#1B1033;border-radius:22px;overflow:hidden;padding:0 14px 14px;box-shadow:0 30px 50px -20px rgba(0,0,0,.7);display:flex;flex-direction:column;gap:2px}'+
  '.in-cover{margin:0 -14px;height:70px;background:linear-gradient(135deg,#FF7A1A,#C2410C);position:relative}.in-ved{position:absolute;right:10px;top:10px;background:#FFF7ED;color:#9A3412;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}'+
  '.in-slogo{position:relative;z-index:1;width:44px;height:44px;border-radius:14px;background:#C2410C;color:#fff;border:3px solid #fff;display:grid;place-items:center;font-weight:800;margin-top:-22px;font-family:var(--display)}'+
  '.in-shop b{font-family:var(--display);font-size:16px;margin-top:4px}.in-shop small{color:#6B6280;font-size:12px}.in-stars{color:#F59E0B;font-size:13px}.in-stars span{color:#1B1033;font-weight:700}'+
  '.in-stat{position:absolute;background:#fff;color:#1B1033;border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;box-shadow:0 6px 0 #C4B5FD,0 20px 30px -12px rgba(0,0,0,.6)}.in-stat small{font-size:11px;color:#6B6280}.in-stat b{font-family:var(--display);font-size:18px;color:#5B21B6}'+
  '.in-stat.s1{right:0;top:46%}.in-stat.s2{left:10%;bottom:2%}.in-stat.s2 b{color:#0E7A5F}'+
  '#intro .in-bot{padding:0 20px calc(22px + env(safe-area-inset-bottom,0px));max-width:480px;width:100%;margin:0 auto;box-sizing:border-box;display:flex;flex-direction:column;gap:16px;align-items:center}'+
  '#intro .in-dots{display:flex;gap:8px}#intro .in-dots b{width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.3);transition:.3s}#intro .in-dots b.on{width:26px;background:#FF7A1A}'+
  '#intro .in-btns{display:flex;flex-direction:column;gap:10px;width:100%}'+
  '#intro .in-go{border:0;border-radius:18px;padding:16px;font:700 16px var(--display);cursor:pointer;color:#fff;background:linear-gradient(180deg,#FF9A4D,#FF7A1A);box-shadow:0 6px 0 #C2410C,0 18px 30px -10px rgba(255,122,26,.6)}'+
  '#intro .in-sell{border:0;border-radius:18px;padding:14px;font:700 15px var(--display);cursor:pointer;color:#fff;background:rgba(255,255,255,.1)}'+
  '@media (prefers-reduced-motion:reduce){.in-pill{animation:none}}'+
  '@media (min-width:900px){#intro .in-top{max-width:1180px;padding-left:40px;padding-right:40px}#intro .in-brand{font-size:22px}#intro .in-brand img{width:40px;height:40px}#intro .in-skip{font-size:16px;padding:10px 20px}'+
  '#intro .in-slide{flex-direction:row;gap:clamp(40px,8vw,140px);padding:0 60px}#intro .in-txt{text-align:left;max-width:520px}#intro h2{font-size:clamp(36px,3.6vw,54px);margin-bottom:16px}#intro p{font-size:19px}'+
  '#intro .in-art{width:340px;height:340px;min-height:0;transform:scale(1.45);margin:0 90px}'+
  '#intro .in-bot{max-width:560px;padding-bottom:40px}#intro .in-btns{flex-direction:row}#intro .in-btns button{flex:1}}'+
  '@media (min-width:900px) and (max-height:700px){#intro .in-art{transform:scale(1.15);margin:0 40px}}';
  document.head.appendChild(css);

  var el=document.createElement('div');el.id='intro';el.setAttribute('role','dialog');el.setAttribute('aria-label','Bienvenue sur Gbairai Market');
  el.innerHTML='<div class="in-top"><span class="in-brand"><img src="icons/logo.svg" alt="">Gbairai Market<i>.</i></span><button type="button" class="in-skip">Passer</button></div>'+
    '<div class="in-track">'+slides.map(function(s){return '<section class="in-slide">'+s.art+'<div class="in-txt"><h2>'+s.t+'</h2><p>'+s.d+'</p></div></section>';}).join('')+'</div>'+
    '<div class="in-bot"><div class="in-dots">'+slides.map(function(_,i){return '<b class="'+(i?'':'on')+'"></b>';}).join('')+'</div><div class="in-btns"><button type="button" class="in-go">Suivant</button></div></div>';
  document.body.appendChild(el);document.documentElement.style.overflow='hidden';

  var track=el.querySelector('.in-track'),dots=el.querySelectorAll('.in-dots b'),btns=el.querySelector('.in-btns'),cur=0;
  function close(hash){mark();el.remove();document.documentElement.style.overflow='';if(hash)location.hash=hash;}
  function upd(){
    var i=Math.round(track.scrollLeft/track.clientWidth);if(i===cur&&btns.dataset.i)return;cur=i;btns.dataset.i=i;
    dots.forEach(function(d,k){d.className=k===i?'on':'';});
    btns.innerHTML=i<slides.length-1?'<button type="button" class="in-go">Suivant</button>':'<button type="button" class="in-go" data-h="accueil">Découvrir les boutiques</button><button type="button" class="in-sell" data-h="vendeur">Je suis vendeur : créer ma boutique</button>';
  }
  track.addEventListener('scroll',function(){clearTimeout(track._t);track._t=setTimeout(upd,60);});
  el.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.classList.contains('in-skip'))return close();
    if(b.dataset.h)return close(b.dataset.h);
    if(b.classList.contains('in-go'))track.scrollTo({left:(cur+1)*track.clientWidth,behavior:'smooth'});
  });
  upd();
})();
