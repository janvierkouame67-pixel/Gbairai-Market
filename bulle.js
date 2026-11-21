/* Gbairai Market : bulle de discussion (aide + contact vendeur) */
(function(){
  var open=false,teaserShown=false;
  var wa='<svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.1.1.6-.1 1.2z"/></svg>';
  var chat='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="3"/></svg>';
  var x='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function num(s){var d=String(s||'').replace(/\D/g,'');if(d.length===10)d='225'+d;return d;}
  function ctx(){
    var G=window.GB||{},S=G.S||{shops:[]},h=(location.hash||'').slice(1),st=S.settings||{},shop=null,prod=null;
    try{
      if(h.indexOf('produit-')===0){prod=G.prodById(h.slice(8));shop=prod&&G.shopById(prod.shop_id);}
      else if(h.indexOf('boutique-')===0){var sl=decodeURIComponent(h.slice(9));shop=S.shops.find(function(s){return s.slug===sl;});}
    }catch(e){}
    return {h:h,support:num(st.support_whatsapp),nom:st.nom||'Gbairai Market',shop:shop,prod:prod};
  }
  var css=document.createElement('style');
  css.textContent=
  '#bulle{position:fixed;right:max(16px,calc(50% - 224px));bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:30;font-family:var(--body)}'+
  '@media (min-width:900px){#bulle{right:32px;bottom:28px}}'+
  '#bulle .bl-btn{width:60px;height:60px;border-radius:22px;border:0;cursor:pointer;display:grid;place-items:center;background:linear-gradient(160deg,#16A37F,#0E7A5F);box-shadow:0 6px 0 #064E3B,0 18px 28px -8px rgba(14,122,95,.7);position:relative;transition:transform .15s}'+
  '#bulle .bl-btn:active{transform:translateY(3px);box-shadow:0 3px 0 #064E3B}'+
  '#bulle .bl-btn.on{background:linear-gradient(160deg,#3B2A63,#1B1033);box-shadow:0 6px 0 #0B0618,0 18px 28px -8px rgba(0,0,0,.6)}'+
  '#bulle .bl-dot{position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;border-radius:99px;background:#FF7A1A;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;border:2.5px solid #fff}'+
  '#bulle .bl-teaser{position:absolute;right:0;bottom:72px;background:#fff;color:#1B1033;border-radius:18px 18px 4px 18px;padding:11px 14px;font-size:14px;font-weight:600;width:max-content;max-width:230px;box-shadow:0 14px 30px -10px rgba(27,16,51,.45);animation:blIn .35s ease-out}'+
  '#bulle .bl-teaser small{display:block;font-weight:500;color:#6B6280;font-size:12.5px;margin-top:2px}'+
  '#bulle .bl-panel{position:absolute;right:0;bottom:74px;width:min(340px,calc(100vw - 32px));background:#F7F4FD;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(27,16,51,.6);animation:blIn .25s ease-out;display:flex;flex-direction:column;max-height:min(560px,calc(100vh - 190px))}'+
  '@keyframes blIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}'+
  '#bulle .bl-head{background:linear-gradient(150deg,#6D28D9,#3B0F87);color:#fff;padding:16px;display:flex;gap:10px;align-items:center;position:relative;overflow:hidden}'+
  '#bulle .bl-head .ball{position:absolute;border-radius:50%;right:-20px;top:-26px;width:80px;height:80px;background:radial-gradient(circle at 35% 30%,#FFC48A,#FF7A1A 55%,#C2410C)}'+
  '#bulle .bl-av{width:42px;height:42px;border-radius:14px;background:#fff;display:grid;place-items:center;flex-shrink:0;position:relative;overflow:hidden;font-family:var(--display);font-weight:800;color:#fff}'+
  '#bulle .bl-av img{width:100%;height:100%;object-fit:cover}'+
  '#bulle .bl-head b{font-family:var(--display);font-size:15.5px;display:block;position:relative}#bulle .bl-head small{color:#D8CCF5;font-size:12.5px;position:relative;display:flex;align-items:center;gap:5px}'+
  '#bulle .bl-head small i{width:8px;height:8px;border-radius:50%;background:#34D399;display:inline-block}'+
  '#bulle .bl-body{padding:14px;display:flex;flex-direction:column;gap:10px;overflow:auto}'+
  '#bulle .bl-msg{background:#fff;border-radius:4px 18px 18px 18px;padding:10px 13px;font-size:14px;line-height:1.45;color:#1B1033;max-width:88%;box-shadow:0 2px 6px -2px rgba(27,16,51,.15)}'+
  '#bulle .bl-msg.me{align-self:flex-end;background:#DCF8C6;border-radius:18px 4px 18px 18px}'+
  '#bulle .bl-qs{display:flex;flex-wrap:wrap;gap:7px}'+
  '#bulle .bl-q{border:1.5px solid #DDD3F7;background:#fff;color:#5B21B6;border-radius:999px;padding:7px 12px;font:600 13px var(--body);cursor:pointer}'+
  '#bulle .bl-q:hover{background:#EDE7FB}'+
  '#bulle .bl-foot{padding:12px 14px 14px;border-top:1px solid #EAE4F7;background:#fff;display:flex;flex-direction:column;gap:8px}'+
  '#bulle .bl-wa{display:flex;align-items:center;justify-content:center;gap:8px;background:#0E7A5F;color:#fff;text-decoration:none;font-weight:700;font-size:14.5px;border-radius:14px;padding:12px;box-shadow:0 4px 0 #064E3B}'+
  '#bulle .bl-wa svg{width:20px;height:20px}#bulle .bl-alt{text-align:center;font-size:12.5px;color:#6B6280}#bulle .bl-alt a{color:#5B21B6;font-weight:600}'+
  '@media (prefers-reduced-motion:reduce){#bulle *{animation:none!important}}';
  document.head.appendChild(css);
  var el=document.createElement('div');el.id='bulle';document.body.appendChild(el);

  var A={
    commander:['Comment commander ?','C\'est simple : ajoutez les articles au panier, écrivez votre nom et votre quartier, puis appuyez sur « Commander sur WhatsApp ». Le message part tout seul chez le vendeur, qui vous répond pour la livraison.'],
    suivi:['Suivre ma commande','Touchez le camion 🚚 en haut de l\'accueil, ou <a href="#commandes">ouvrez Mes commandes</a>. Vous voyez chaque étape, le livreur et votre <b>code secret</b> : donnez-le au livreur seulement quand vous avez l\'article en main.'],
    arnaque:['Éviter les arnaques','Regardez l\'<b>indice de confiance</b> sur la page de la boutique, préférez le paiement à la livraison, et <a href="#verifier">vérifiez le numéro</a> avant d\'envoyer de l\'argent.'],
    vendeur:['Devenir vendeur','Appuyez sur « Je suis vendeur », entrez votre numéro et un mot de passe : votre boutique est créée en 2 minutes, gratuitement. Ensuite, ajoutez vos produits avec photos.'],
    paiement:['Payer un abonnement','Dans votre espace vendeur → Abonnement, choisissez Pro, Vedette ou Bannière, payez par Orange, MTN, Moov ou Wave, puis envoyez la référence. L\'équipe valide rapidement.'],
    probleme:['Signaler un problème','Sur la page de la boutique, appuyez sur « Signaler » en bas. Ou écrivez-nous directement sur WhatsApp ci-dessous.']
  };
  var asked=[];
  function render(){
    var c=ctx(),h='';
    var btn='<button type="button" class="bl-btn'+(open?' on':'')+'" aria-label="'+(open?'Fermer':'Discuter avec nous')+'" aria-expanded="'+open+'">'+(open?x:chat)+(!open&&!teaserShown?'<span class="bl-dot">1</span>':'')+'</button>';
    if(open){
      var seller=c.shop&&c.shop.whatsapp;
      var head=seller
        ?'<div class="bl-av" style="background:'+(c.shop.logo?'#fff':'#C2410C')+'">'+(c.shop.logo?'<img src="'+esc(c.shop.logo)+'" alt="">':esc((c.shop.nom||'?').slice(0,2).toUpperCase()))+'</div><div><b>'+esc(c.shop.nom)+'</b><small><i></i>Répond en général en moins d\'1 h</small></div>'
        :'<div class="bl-av"><img src="icons/logo.svg" alt=""></div><div><b>Aide '+esc(c.nom)+'</b><small><i></i>Nous répondons vite sur WhatsApp</small></div>';
      var body='';
      if(seller){
        body+='<div class="bl-msg">Bonjour 👋 Vous avez une question '+(c.prod?'sur <b>'+esc(c.prod.nom)+'</b>':'sur nos articles')+' ? Taille, couleur, livraison… Écrivez-nous directement !</div>';
        var txt='Bonjour '+c.shop.nom+', '+(c.prod?'j\'ai une question sur « '+c.prod.nom+' » : ':'j\'ai une question : ')+'\n(Vu sur '+c.nom+')';
        var foot='<a class="bl-wa" target="_blank" rel="noopener" href="https://wa.me/'+num(c.shop.whatsapp)+'?text='+encodeURIComponent(txt)+'">'+wa+'Écrire au vendeur sur WhatsApp</a>'+
          (c.support?'<div class="bl-alt">Un souci avec ce vendeur ? <a target="_blank" rel="noopener" href="https://wa.me/'+c.support+'">Contacter '+esc(c.nom)+'</a></div>':'');
      }else{
        body+='<div class="bl-msg">Bonjour 👋 Bienvenue sur <b>'+esc(c.nom)+'</b> ! Comment pouvons-nous vous aider ?</div>';
        asked.forEach(function(k){body+='<div class="bl-msg me">'+A[k][0]+'</div><div class="bl-msg">'+A[k][1]+'</div>';});
        body+='<div class="bl-qs">'+Object.keys(A).filter(function(k){return asked.indexOf(k)<0;}).map(function(k){return '<button type="button" class="bl-q" data-q="'+k+'">'+A[k][0]+'</button>';}).join('')+'</div>';
        var foot=c.support?'<a class="bl-wa" target="_blank" rel="noopener" href="https://wa.me/'+c.support+'?text='+encodeURIComponent('Bonjour '+c.nom+', j\'ai besoin d\'aide : ')+'">'+wa+'Parler à quelqu\'un sur WhatsApp</a>':'<div class="bl-alt">Le support WhatsApp sera bientôt disponible.</div>';
      }
      h='<div class="bl-panel" role="dialog" aria-label="Discussion"><div class="bl-head"><span class="ball"></span>'+head+'</div><div class="bl-body">'+body+'</div><div class="bl-foot">'+foot+'</div></div>';
    }else if(!teaserShown&&ctx().h.indexOf('admin')<0){
      h='<div class="bl-teaser">Besoin d\'aide ? 👋<small>Posez votre question, on vous répond.</small></div>';
    }
    el.innerHTML=h+btn;
    el.hidden=/^(admin|vendeur|compte)/.test(c.h)||!!document.getElementById('intro');
    var b=el.querySelector('.bl-body');if(b)b.scrollTop=b.scrollHeight;
  }
  el.addEventListener('click',function(e){
    var t=e.target.closest('button');if(!t)return;
    if(t.classList.contains('bl-btn')){open=!open;teaserShown=true;render();}
    else if(t.dataset.q){asked.push(t.dataset.q);render();}
  });
  window.addEventListener('hashchange',function(){open=false;render();});
  setTimeout(function(){if(!teaserShown){teaserShown=true;if(!open)render();}},9000);
  var obs=new MutationObserver(function(){if(el.hidden!==(/^(admin|vendeur|compte)/.test(ctx().h)||!!document.getElementById('intro')))render();});
  obs.observe(document.body,{childList:true});
  setTimeout(render,300);
})();
