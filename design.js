/* Gbairai Market : nouveau design (27 nov. 2026).
   Regroupe les outils de l'accueil en 10 icônes rondes (comme Wave / Orange Money)
   et retire de l'accueil les blocs qui le rendaient trop long. Se branche sur window.GBX. */
(function(){
'use strict';
var EXTRA=[['#services','🔧','Artisans'],['#categories','🗂️','Rayons'],['#verifier','🛡️','Vérifier'],['#aide','💡','Aide']];
function arranger(h){
  try{
    var t=document.createElement('template');t.innerHTML=h;
    var rows=t.content.querySelectorAll('.mg-row');
    if(rows.length){
      var first=rows[0];
      for(var i=1;i<rows.length;i++){while(rows[i].firstChild)first.appendChild(rows[i].firstChild);rows[i].remove();}
      var have={};first.querySelectorAll('a').forEach(function(a){have[a.getAttribute('href')]=1;});
      EXTRA.forEach(function(e){if(have[e[0]])return;var a=document.createElement('a');a.className='mg-tile';a.href=e[0];a.innerHTML='<span class="mg-ico">'+e[1]+'</span><b>'+e[2]+'</b>';first.appendChild(a);});
      first.classList.add('mg-apps');
      // libellés courts sous les icônes
      var court={'Chasse aux codes':'Codes','Achats groupés':'Groupés','En direct':'Direct','Mes Coins':'Coins','Heure magique':'Heure magique','Près de moi':'Près de moi'};
      first.querySelectorAll('.mg-tile b').forEach(function(b){var k=b.textContent.trim();if(court[k])b.textContent=court[k];});
    }
    t.content.querySelectorAll('.ar-home').forEach(function(n){n.remove();});
    var d=document.createElement('div');d.appendChild(t.content.cloneNode(true));h=d.innerHTML;
  }catch(e){}
  return h;
}
/* Les autres fichiers (plus2.js, artisans.js) se branchent sur GBX.home un peu après le chargement :
   on se remet toujours par-dessus, pendant les 15 premières secondes. */
function poser(){
  var X=window.GBX;if(!X||!X.home||X.home.__design)return false;
  var orig=X.home,f=function(){return arranger(orig.apply(this,arguments)||'');};f.__design=true;X.home=f;
  var g=window.GB;if(g&&g.S&&g.S.loaded&&/^(#accueil)?$/.test(location.hash))g.render(true);
  return true;
}
var n=0,t=setInterval(function(){poser();if(++n>100)clearInterval(t);},150);
})();
