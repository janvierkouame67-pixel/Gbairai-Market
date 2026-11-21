/* Gbairai Market : images pour les statuts WhatsApp (1080 × 1920). */
(function(){
'use strict';
const W=1080,H=1920;
const PAL=[['#FBCFE8','#EC4899','#9D174D'],['#DDD6FE','#8B5CF6','#4C1D95'],['#FFE1B8','#FB923C','#C2410C'],['#A7F3D0','#10B981','#065F46'],['#BFDBFE','#3B82F6','#1E3A8A'],['#FDE68A','#EAB308','#854D0E']];
const pal=i=>PAL[Math.abs(i||0)%PAL.length];
const fmt=n=>Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const ini=s=>String(s||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();

function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
async function fonts(){try{await Promise.all(['800 70px Sora','700 70px Sora','800 40px Inter','700 30px Inter','600 34px Inter'].map(f=>document.fonts.load(f)));await document.fonts.ready;}catch(e){}}
function load(src){return new Promise(res=>{if(!src)return res(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});}
function cover(x,img,X,Y,w,h){const k=Math.max(w/img.width,h/img.height);x.drawImage(img,X+(w-img.width*k)/2,Y+(h-img.height*k)/2,img.width*k,img.height*k);}
function ball(x,cx,cy,r,a,b,c){const g=x.createRadialGradient(cx-r*.3,cy-r*.4,r*.1,cx,cy,r);g.addColorStop(0,a);g.addColorStop(.55,b);g.addColorStop(1,c);x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();}
function wrap(x,text,maxW,maxLines){const words=String(text).split(/\s+/);const lines=[];let l='';
  words.forEach(w=>{const t=l?l+' '+w:w;if(x.measureText(t).width>maxW&&l){lines.push(l);l=w;}else l=t;});if(l)lines.push(l);
  if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(x.measureText(last+'…').width>maxW&&last.length)last=last.slice(0,-1);lines[maxLines-1]=last+'…';}return lines;}
function pill(x,X,Y,h,text,bg,fg,font,padX){x.font=font;const w=x.measureText(text).width+padX*2;x.fillStyle=bg;rr(x,X,Y,w,h,h/2);x.fill();x.fillStyle=fg;x.textBaseline='middle';x.textAlign='left';x.fillText(text,X+padX,Y+h/2+2);return w;}
// petite coche « vérifié »
function check(x,cx,cy,r){x.fillStyle='#3B82F6';x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();x.strokeStyle='#fff';x.lineWidth=r*.28;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(cx-r*.45,cy+r*.02);x.lineTo(cx-r*.1,cy+r*.36);x.lineTo(cx+r*.5,cy-r*.34);x.stroke();}
// icône WhatsApp simplifiée
function waIcon(x,cx,cy,r){x.fillStyle='#fff';x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(cx-r*.75,cy+r*.55);x.lineTo(cx-r*1.0,cy+r*1.0);x.lineTo(cx-r*.45,cy+r*.85);x.fill();
  x.fillStyle='#0E7A5F';[-1,0,1].forEach(k=>{x.beginPath();x.arc(cx+k*r*.42,cy,r*.15,0,Math.PI*2);x.fill();});}
function perks(s){const z=String(s.livraison_zones||'').trim();return [z?'Livraison : '+(z.length>22?z.slice(0,21)+'…':z):'Livraison possible',s.verification==='verifie'?'Vendeur vérifié':'Réponse rapide'];}

function background(x){
  const g=x.createLinearGradient(0,0,W*.6,H);g.addColorStop(0,'#7C3AED');g.addColorStop(.5,'#4C1D95');g.addColorStop(1,'#1B1033');x.fillStyle=g;x.fillRect(0,0,W,H);
  ball(x,1010,250,230,'#FFC48A','#FF7A1A','#C2410C');ball(x,40,1330,190,'#A7F3D0','#10B981','#047857');ball(x,960,1560,90,'#DDD6FE','#8B5CF6','#4C1D95');
  // reflets
  x.globalAlpha=.08;x.fillStyle='#fff';for(let i=0;i<6;i++){x.beginPath();x.arc(140+i*170,90+(i%2)*60,8,0,Math.PI*2);x.fill();}x.globalAlpha=1;
}
async function header(x,s,logoImg){
  const X=70,Y=70,S=120;
  x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=30;x.shadowOffsetY=12;x.fillStyle='#fff';rr(x,X,Y,S,S,36);x.fill();x.restore();
  x.save();rr(x,X+6,Y+6,S-12,S-12,30);x.clip();
  if(logoImg)cover(x,logoImg,X+6,Y+6,S-12,S-12);else{const p=pal(s.couleur),g=x.createLinearGradient(X,Y,X+S,Y+S);g.addColorStop(0,p[1]);g.addColorStop(1,p[2]);x.fillStyle=g;x.fillRect(X,Y,S,S);x.fillStyle='#fff';x.font='800 46px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ini(s.nom),X+S/2,Y+S/2+3);}
  x.restore();
  x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle='#fff';x.font='800 54px Sora, sans-serif';
  let name=s.nom;while(x.measureText(name).width>700&&name.length>3)name=name.slice(0,-2);if(name!==s.nom)name+='…';
  x.fillText(name,X+S+30,Y+56);
  if(s.verification==='verifie')check(x,X+S+30+x.measureText(name).width+34,Y+38,22);
  x.fillStyle='#E9DDFF';x.font='600 34px Inter, sans-serif';x.fillText(place(s),X+S+30,Y+106);
}
function place(s){const q=(s.quartier||'').trim(),v=(s.ville||'').trim();return q&&v&&q.toLowerCase()!==v.toLowerCase()?q+', '+v:(q||v||"Côte d'Ivoire");}
function footer(x,link,brandImg,brand){
  // bouton commander
  x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=30;x.shadowOffsetY=14;x.fillStyle='#0B6B52';rr(x,70,1572,940,140,48);x.fill();x.restore();
  const g=x.createLinearGradient(0,1560,0,1700);g.addColorStop(0,'#16A37C');g.addColorStop(1,'#0E7A5F');x.fillStyle=g;rr(x,70,1560,940,140,48);x.fill();
  waIcon(x,170,1630,38);
  x.fillStyle='#fff';x.font='800 50px Sora, sans-serif';x.textAlign='left';x.textBaseline='middle';x.fillText('Commandez sur WhatsApp',232,1632);
  // lien
  x.fillStyle='rgba(255,255,255,.14)';rr(x,70,1736,940,96,30);x.fill();
  x.fillStyle='#fff';x.font='700 36px Inter, sans-serif';x.textAlign='center';let l=link;while(x.measureText(l).width>880&&l.length>10)l=l.slice(0,-2);if(l!==link)l+='…';x.fillText(l,540,1786);
  // marque
  if(brandImg)x.drawImage(brandImg,400,1850,48,48);
  x.fillStyle='rgba(255,255,255,.85)';x.font='800 32px Sora, sans-serif';x.textAlign='left';x.fillText(brand||'Gbairai Market',460,1876);
}

async function product(o){
  // o = {p, s, link, brand, logoUrl}
  const p=o.p,s=o.s;await fonts();
  const [photo,logo,brand]=await Promise.all([load(p.photo),load(s.logo),load(o.logoUrl||'icons/logo.svg')]);
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  background(x);await header(x,s,logo);
  // carte photo
  const CX=110,CY=250,CW=860,CH=860;
  x.save();x.translate(540,CY+CH/2);x.rotate(-.035);x.translate(-540,-(CY+CH/2));
  x.save();x.shadowColor='rgba(10,0,30,.55)';x.shadowBlur=70;x.shadowOffsetY=40;x.fillStyle='#fff';rr(x,CX,CY,CW,CH,70);x.fill();x.restore();
  x.save();rr(x,CX+14,CY+14,CW-28,CH-28,58);x.clip();
  if(photo){x.fillStyle='#fff';x.fillRect(CX,CY,CW,CH);cover(x,photo,CX+14,CY+14,CW-28,CH-28);}
  else{const pc=pal(p.couleur),g=x.createRadialGradient(CX+250,CY+250,40,CX+CW/2,CY+CH/2,700);g.addColorStop(0,pc[0]);g.addColorStop(.55,pc[1]);g.addColorStop(1,pc[2]);x.fillStyle=g;x.fillRect(CX,CY,CW,CH);x.fillStyle='rgba(255,255,255,.9)';x.font='800 300px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ini(p.nom),540,CY+CH/2);}
  x.restore();x.restore();
  // pastille « Nouveau » ou « Stock limité »
  const low=p.stock>0&&p.stock<=3;
  x.save();x.translate(900,300);x.rotate(.18);x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=24;x.shadowOffsetY=10;
  ball(x,0,0,118,'#FFE08A','#FF9A1A','#E05A00');x.shadowColor='transparent';
  x.fillStyle='#1B1033';x.textAlign='center';x.textBaseline='middle';x.font='800 '+(low?34:40)+'px Sora, sans-serif';
  if(low){x.fillText('Plus que',0,-22);x.font='800 52px Sora, sans-serif';x.fillText(p.stock+' !',0,28);}else{x.fillText('NOUVEAU',0,4);}
  x.restore();
  // nom + prix
  x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle='#fff';x.font='800 70px Sora, sans-serif';
  const lines=wrap(x,p.nom,940,2);let y=1218;lines.forEach(l=>{x.fillText(l,70,y);y+=82;});
  x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=24;x.shadowOffsetY=10;
  pill(x,70,y-40,124,fmt(p.prix)+' FCFA','#FF7A1A','#1B1033','800 76px Sora, sans-serif',44);x.restore();
  // avantages
  const by=y+118;x.font='700 32px Inter, sans-serif';
  let bx=70,yy=by;perks(s).forEach(t=>{x.font='700 30px Inter, sans-serif';const w=x.measureText('✓ '+t).width+52;if(bx>70&&bx+w>1010){bx=70;yy+=80;}if(yy<1470)bx+=pill(x,bx,yy,66,'✓ '+t,'rgba(255,255,255,.16)','#fff','700 30px Inter, sans-serif',26)+16;});
  footer(x,o.link,brand,o.brand);
  return c.toDataURL('image/jpeg',.9);
}

async function shop(o){
  // o = {s, prods:[…], link, brand, logoUrl, total}
  const s=o.s,ps=(o.prods||[]).slice(0,4);await fonts();
  const [logo,brand,...imgs]=await Promise.all([load(s.logo),load(o.logoUrl||'icons/logo.svg')].concat(ps.map(p=>load(p.photo))));
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  background(x);await header(x,s,logo);
  x.fillStyle='#FFD4A8';x.font='800 40px Inter, sans-serif';x.textAlign='left';x.textBaseline='alphabetic';x.fillText('NOUVELLE COLLECTION',70,290);
  x.fillStyle='#fff';x.font='800 80px Sora, sans-serif';x.fillText('Disponible',70,380);x.fillText('maintenant !',70,468);
  const G=[[70,530],[555,530],[70,1000],[555,1000]],TW=455,TH=440;
  G.forEach((g,i)=>{const p=ps[i];x.save();x.shadowColor='rgba(10,0,30,.5)';x.shadowBlur=40;x.shadowOffsetY=20;x.fillStyle='#fff';rr(x,g[0],g[1],TW,TH,44);x.fill();x.restore();
    x.save();rr(x,g[0]+10,g[1]+10,TW-20,TH-20,36);x.clip();
    if(p&&imgs[i])cover(x,imgs[i],g[0]+10,g[1]+10,TW-20,TH-20);
    else{const pc=pal(p?p.couleur:i),gr=x.createLinearGradient(g[0],g[1],g[0]+TW,g[1]+TH);gr.addColorStop(0,pc[1]);gr.addColorStop(1,pc[2]);x.fillStyle=gr;x.fillRect(g[0],g[1],TW,TH);if(p){x.fillStyle='rgba(255,255,255,.9)';x.font='800 140px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ini(p.nom),g[0]+TW/2,g[1]+TH/2);}}
    x.restore();
    if(p){x.save();x.shadowColor='rgba(0,0,0,.3)';x.shadowBlur=14;x.shadowOffsetY=6;pill(x,g[0]+22,g[1]+TH-86,64,fmt(p.prix)+' F','#FF7A1A','#1B1033','800 36px Sora, sans-serif',22);x.restore();}
  });
  const n=o.total||ps.length;
  x.fillStyle='#fff';let fs=38;x.textAlign='center';x.textBaseline='alphabetic';const tl=(n>4?'+ '+(n-4)+' autres articles · ':'')+perks(s)[0];do{x.font='700 '+fs+'px Inter, sans-serif';fs-=2;}while(x.measureText(tl).width>940&&fs>24);
  x.fillText((n>4?'+ '+(n-4)+' autres articles · ':'')+perks(s)[0],540,1515);
  footer(x,o.link,brand,o.brand);
  return c.toDataURL('image/jpeg',.9);
}
window.GbStatut={product,shop,place};
})();
