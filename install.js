// Bouton « Installer l'appli »
(function(){
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function(){});
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var evt = null;
  // Utilisé par l'appli pour proposer l'installation au bon moment (après une commande, un abonnement…)
  window.GBinstall = {
    installee: function(){ return !!standalone; },
    ios: ios,
    possible: function(){ return !standalone && (!!evt || ios); },
    lancer: function(){ if (evt) { evt.prompt(); return evt.userChoice.then(function(c){ evt = null; return c && c.outcome === 'accepted'; }); } return Promise.resolve(false); }
  };
  if (standalone) return;
  var ferme = false; try { ferme = !!localStorage.getItem('gbairai-install-ferme'); } catch(e) {}
  function show(){
    if (document.getElementById('install-bar')) return;
    var d = document.createElement('div'); d.id = 'install-bar'; d.className = 'install-bar';
    d.innerHTML = '<img src="icons/logo.svg" alt="" width="40" height="40"><div class="install-txt"><b>Installer l\'appli</b><span>' +
      (ios && !evt ? 'Touchez Partager, puis « Sur l\'écran d\'accueil »' : 'Gbairai Market sur votre écran d\'accueil') +
      '</span></div>' + (evt ? '<button type="button" class="btn btn-o install-go">Installer</button>' : '') +
      '<button type="button" class="install-x" aria-label="Fermer">×</button>';
    document.body.appendChild(d);
    var go = d.querySelector('.install-go');
    if (go) go.onclick = function(){ evt.prompt(); evt.userChoice.finally(function(){ d.remove(); evt = null; }); };
    d.querySelector('.install-x').onclick = function(){ d.remove(); try { localStorage.setItem('gbairai-install-ferme', '1'); } catch(e) {} };
  }
  // Petit bouton « Télécharger » toujours visible (en bas à gauche), un clic = installation
  function aide(){
    var l = document.getElementById('layer') || document.body;
    var etapes = ios
      ? '<li>Touchez le bouton <b>Partager</b> (carré avec une flèche) en bas de Safari.</li><li>Choisissez <b>« Sur l\'écran d\'accueil »</b>.</li><li>Touchez <b>Ajouter</b>.</li>'
      : '<li>Touchez le menu <b>⋮</b> en haut à droite du navigateur.</li><li>Choisissez <b>« Installer l\'application »</b> ou <b>« Ajouter à l\'écran d\'accueil »</b>.</li><li>Confirmez avec <b>Installer</b>.</li>';
    l.innerHTML = '<div class="modal" id="dl-aide"><div class="card stack"><h2 style="font-size:17px">Télécharger Gbairai Market</h2><ol class="small" style="margin:0;padding-left:18px;line-height:1.8">' + etapes + '</ol><button type="button" class="btn btn-v">J\'ai compris</button></div></div>';
    var m = document.getElementById('dl-aide');
    m.onclick = function(e){ if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); };
  }
  function bouton(){
    if (document.getElementById('dl-btn') || !document.body) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'dl-btn'; b.className = 'dl-btn'; b.setAttribute('aria-label', 'Télécharger l\'application');
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg><span>Télécharger</span>';
    b.onclick = function(){
      if (evt) { evt.prompt(); evt.userChoice.then(function(c){ evt = null; if (c && c.outcome === 'accepted') b.remove(); }); }
      else aide();
    };
    document.body.appendChild(b); sync();
  }
  function sync(){ var b = document.getElementById('dl-btn'); if (b) b.hidden = !!document.getElementById('install-bar'); }
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: false });
  if (document.body) new MutationObserver(sync).observe(document.body, { childList: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ new MutationObserver(sync).observe(document.body, { childList: true }); bouton(); }); else bouton();

  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); evt = e; var o = document.getElementById('install-bar'); if (o) o.remove(); if (!ferme) show(); });
  window.addEventListener('appinstalled', function(){ var o = document.getElementById('install-bar'); if (o) o.remove(); var b = document.getElementById('dl-btn'); if (b) b.remove(); });
  if (ios && !ferme) setTimeout(show, 1500);
})();
