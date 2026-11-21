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
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); evt = e; var o = document.getElementById('install-bar'); if (o) o.remove(); if (!ferme) show(); });
  window.addEventListener('appinstalled', function(){ var o = document.getElementById('install-bar'); if (o) o.remove(); });
  if (ios && !ferme) setTimeout(show, 1500);
})();
