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
  const promo=p.prix_barre&&p.prix_barre>p.prix,low=!promo&&p.stock>0&&p.stock<=3;
  x.save();x.translate(900,300);x.rotate(.18);x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=24;x.shadowOffsetY=10;
  ball(x,0,0,118,'#FFE08A','#FF9A1A','#E05A00');x.shadowColor='transparent';
  x.fillStyle='#1B1033';x.textAlign='center';x.textBaseline='middle';x.font='800 '+(low?34:40)+'px Sora, sans-serif';
  if(promo){x.font='800 64px Sora, sans-serif';x.fillText('-'+Math.round((1-p.prix/p.prix_barre)*100)+'%',0,6);}
  else if(low){x.fillText('Plus que',0,-22);x.font='800 52px Sora, sans-serif';x.fillText(p.stock+' !',0,28);}else{x.fillText('NOUVEAU',0,4);}
  x.restore();
  // nom + prix
  x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle='#fff';x.font='800 70px Sora, sans-serif';
  const lines=wrap(x,p.nom,940,2);let y=1218;lines.forEach(l=>{x.fillText(l,70,y);y+=82;});
  x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=24;x.shadowOffsetY=10;
  const pw=pill(x,70,y-40,124,fmt(p.prix)+' FCFA','#FF7A1A','#1B1033','800 76px Sora, sans-serif',44);x.restore();
  if(promo){x.font='700 46px Sora, sans-serif';x.fillStyle='rgba(255,255,255,.7)';x.textAlign='left';x.textBaseline='middle';const ot=fmt(p.prix_barre);const ox=70+pw+28;if(ox+x.measureText(ot).width<1040){x.fillText(ot,ox,y+24);x.fillRect(ox-4,y+22,x.measureText(ot).width+8,5);}}
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
/* ---------- Aperçus de liens (1200 × 630) pour WhatsApp, Facebook, Telegram ---------- */
const OW=1200,OH=630;
function fit(x,img,X,Y,w,h){const k=Math.min(w/img.width,h/img.height);x.drawImage(img,X+(w-img.width*k)/2,Y+(h-img.height*k)/2,img.width*k,img.height*k);}
function ogBg(x,split){
  if(split){const g=x.createLinearGradient(0,0,OW,OH);g.addColorStop(0,'#FF8A2A');g.addColorStop(1,'#E8590C');x.fillStyle=g;x.fillRect(0,0,OW,OH);
    const v=x.createLinearGradient(0,0,OW,OH);v.addColorStop(0,'#6D28D9');v.addColorStop(1,'#2E0B6E');x.fillStyle=v;x.beginPath();x.moveTo(640,0);x.lineTo(OW,0);x.lineTo(OW,OH);x.lineTo(330,OH);x.closePath();x.fill();}
  else{const g=x.createLinearGradient(0,0,OW,OH);g.addColorStop(0,'#6D28D9');g.addColorStop(.6,'#3B0F86');g.addColorStop(1,'#1E0A45');x.fillStyle=g;x.fillRect(0,0,OW,OH);
    const r=x.createRadialGradient(1020,95,10,1020,95,520);r.addColorStop(0,'rgba(155,92,255,.55)');r.addColorStop(1,'rgba(155,92,255,0)');x.fillStyle=r;x.fillRect(0,0,OW,OH);}
  // motif wax
  x.save();x.globalAlpha=.12;x.strokeStyle='#fff';x.fillStyle='#fff';x.lineWidth=3;
  for(let yy=30;yy<OH;yy+=60)for(let xx=30;xx<OW;xx+=60){x.beginPath();x.arc(xx,yy,16,0,Math.PI*2);x.stroke();x.beginPath();x.arc(xx,yy,4.5,0,Math.PI*2);x.fill();}
  x.restore();
}
function ogFlag(x){x.fillStyle='#FF7A1A';x.fillRect(0,OH-12,OW/3,12);x.fillStyle='#fff';x.fillRect(OW/3,OH-12,OW/3,12);x.fillStyle='#22C55E';x.fillRect(OW*2/3,OH-12,OW/3+1,12);}
function ogSticker(x,cx,cy,r,txt,rot){x.save();x.translate(cx,cy);x.rotate(rot||-.24);x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=20;x.shadowOffsetY=10;
  x.fillStyle='#FFD43B';x.beginPath();x.arc(0,0,r,0,Math.PI*2);x.fill();x.shadowColor='transparent';
  x.setLineDash([9,7]);x.strokeStyle='#1B1033';x.lineWidth=4;x.beginPath();x.arc(0,0,r-7,0,Math.PI*2);x.stroke();x.setLineDash([]);
  x.fillStyle='#1B1033';x.textAlign='center';x.textBaseline='middle';let f=Math.round(r*.62);do{x.font='800 '+f+'px Sora, sans-serif';f-=2;}while(x.measureText(txt).width>r*1.6&&f>12);x.fillText(txt,0,3);x.restore();}
function ogCta(x,X,Y,txt,size){x.font='800 '+(size||24)+'px Sora, sans-serif';const h=Math.round((size||24)*2.5),w=x.measureText(txt).width+h+42;
  x.save();x.shadowColor='rgba(0,0,0,.3)';x.shadowBlur=24;x.shadowOffsetY=14;x.fillStyle='#15803D';rr(x,X,Y+8,w,h,h/2);x.fill();x.restore();
  x.fillStyle='#22C55E';rr(x,X,Y,w,h,h/2);x.fill();waIcon(x,X+h/2+4,Y+h/2,h*.27);
  x.fillStyle='#06331A';x.textAlign='left';x.textBaseline='middle';x.fillText(txt,X+h*.9+8,Y+h/2+2);return w;}
function ogBrand(x,X,Y,brandImg,brand){if(brandImg){x.save();x.fillStyle='#fff';rr(x,X,Y,44,44,13);x.fill();x.drawImage(brandImg,X+5,Y+5,34,34);x.restore();}
  x.fillStyle='#fff';x.font='800 22px Sora, sans-serif';x.textAlign='left';x.textBaseline='middle';x.fillText(brand||'Gbairai Market',X+56,Y+23);
  const w=x.measureText(brand||'Gbairai Market').width;x.fillStyle='#FF7A1A';x.fillText('.',X+57+w,Y+23);}
function ogAvatar(x,s,logo,X,Y,S){x.save();x.shadowColor='rgba(0,0,0,.3)';x.shadowBlur=26;x.shadowOffsetY=12;x.fillStyle='#fff';x.beginPath();x.arc(X+S/2,Y+S/2,S/2,0,Math.PI*2);x.fill();x.restore();
  x.save();x.beginPath();x.arc(X+S/2,Y+S/2,S/2-6,0,Math.PI*2);x.clip();
  if(logo){x.fillStyle='#fff';x.fillRect(X,Y,S,S);cover(x,logo,X+6,Y+6,S-12,S-12);}else{x.fillStyle='#fff';x.fillRect(X,Y,S,S);x.fillStyle='#6D28D9';x.font='800 '+Math.round(S*.4)+'px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ini(s.nom),X+S/2,Y+S/2+3);}
  x.restore();}
function ogFit(x,txt,font,size,maxW,min){let f=size;do{x.font=font.replace('#',f);f-=2;}while(x.measureText(txt).width>maxW&&f>min);let t=txt;while(x.measureText(t).width>maxW&&t.length>3)t=t.slice(0,-2);return t===txt?t:t+'…';}

async function ogProduct(o){
  const p=o.p,s=o.s;await fonts();
  const [photo,logo,brand]=await Promise.all([load(p.photo),load(s.logo),load(o.logoUrl||'icons/logo.svg')]);
  const c=document.createElement('canvas');c.width=OW;c.height=OH;const x=c.getContext('2d');
  ogBg(x);
  // panneau photo
  x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=50;x.shadowOffsetX=18;x.fillStyle='#fff';x.beginPath();x.moveTo(0,0);x.lineTo(500,0);x.arcTo(560,0,560,60,60);x.lineTo(560,OH-60);x.arcTo(560,OH,500,OH,60);x.lineTo(0,OH);x.closePath();x.fill();x.restore();
  x.save();x.beginPath();x.rect(0,0,560,OH);x.clip();
  if(photo){x.save();x.translate(280,320);x.rotate(-.05);fit(x,photo,-235,-235,470,470);x.restore();}
  else{const pc=pal(p.couleur),g=x.createRadialGradient(200,220,40,280,315,420);g.addColorStop(0,pc[0]);g.addColorStop(.6,pc[1]);g.addColorStop(1,pc[2]);x.fillStyle=g;x.fillRect(0,0,560,OH);x.fillStyle='rgba(255,255,255,.9)';x.font='800 200px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ini(p.nom),280,320);}
  x.restore();
  const promo=p.prix_barre&&p.prix_barre>p.prix,low=p.stock>0&&p.stock<=3;
  if(promo)ogSticker(x,500,96,62,'-'+Math.round((1-p.prix/p.prix_barre)*100)+'%');
  else if(low)ogSticker(x,500,96,62,'Plus que '+p.stock);
  // boutique
  const X=620;ogAvatar(x,s,logo,X,52,50);
  x.fillStyle='#fff';x.textAlign='left';x.textBaseline='middle';const sn=ogFit(x,s.nom,'700 #px Inter, sans-serif',22,380,16);x.fillText(sn,X+64,70);
  let ex=X+64+x.measureText(sn).width+18;if(s.verification==='verifie'){check(x,ex,70,13);ex+=26;}
  x.fillStyle='rgba(255,255,255,.75)';x.font='600 18px Inter, sans-serif';x.fillText(place(s),X+64,95);
  // nom
  x.fillStyle='#fff';x.font='800 52px Sora, sans-serif';x.textBaseline='alphabetic';const L=wrap(x,p.nom,530,2);let y=180;L.forEach(l=>{x.fillText(l,X,y);y+=58;});
  // prix
  y+=40;x.fillStyle='#FFB067';let fp=74;const pt=fmt(p.prix)+' F';do{x.font='800 '+fp+'px Sora, sans-serif';fp-=2;}while(x.measureText(pt).width>(promo?380:530)&&fp>40);x.fillText(pt,X,y);
  if(promo){const px=X+x.measureText(pt).width+22,ot=fmt(p.prix_barre)+' F';x.font='700 28px Inter, sans-serif';x.fillStyle='rgba(255,255,255,.6)';if(px+x.measureText(ot).width<OW-30){x.fillText(ot,px,y-8);x.fillRect(px-2,y-17,x.measureText(ot).width+4,3);}}
  // étiquettes
  const chips=[];if(p.tailles&&String(p.tailles).trim())chips.push('Tailles : '+String(p.tailles).trim().slice(0,22));chips.push(perks(s)[0]);if(low&&!promo)chips.push('Stock limité');else if(low)chips.push('Plus que '+p.stock);
  let cx=X,cy=y+26;chips.slice(0,3).forEach(t=>{x.font='700 18px Inter, sans-serif';const w=x.measureText(t).width+36;if(cx>X&&cx+w>OW-30){cx=X;cy+=50;}if(cy<OH-140){x.fillStyle='rgba(255,255,255,.14)';rr(x,cx,cy,w,40,20);x.fill();x.strokeStyle='rgba(255,255,255,.3)';x.lineWidth=1.5;x.stroke();x.fillStyle='#fff';x.textBaseline='middle';x.fillText(t,cx+18,cy+21);cx+=w+10;}});
  ogCta(x,X,OH-118,'Commander sur WhatsApp',23);
  ogFlag(x);
  return c.toDataURL('image/jpeg',.86);
}

async function ogShop(o){
  const s=o.s,ps=(o.prods||[]).slice(0,3);await fonts();
  const [logo,brand,...imgs]=await Promise.all([load(s.logo),load(o.logoUrl||'icons/logo.svg')].concat(ps.map(p=>load(p.photo))));
  const c=document.createElement('canvas');c.width=OW;c.height=OH;const x=c.getContext('2d');
  ogBg(x,true);
  ogAvatar(x,s,logo,56,48,150);
  x.fillStyle='#fff';x.textAlign='left';x.textBaseline='alphabetic';
  const nm=ogFit(x,s.nom,'800 #px Sora, sans-serif',58,400,34);x.fillText(nm,56,262);
  let y=284;
  if(s.verification==='verifie'){x.font='800 19px Inter, sans-serif';const w=x.measureText('Boutique vérifiée').width+62;x.fillStyle='#fff';rr(x,56,y,w,40,20);x.fill();check(x,80,y+20,12);x.fillStyle='#1D4ED8';x.textBaseline='middle';x.fillText('Boutique vérifiée',98,y+21);y+=58;}else y+=12;
  x.fillStyle='#fff';x.textBaseline='alphabetic';let info=place(s);if(o.nbAvis)info+='  ·  ★ '+String(o.note.toFixed(1)).replace('.',',')+' ('+o.nbAvis+' avis)';x.font='700 21px Inter, sans-serif';
  info=ogFit(x,info,'700 #px Inter, sans-serif',21,400,15);x.fillText(info,56,y+20);
  if(s.description){x.font='600 18px Inter, sans-serif';x.fillStyle='rgba(255,255,255,.9)';wrap(x,s.description,390,2).forEach((l,i)=>x.fillText(l,56,y+56+i*25));}
  // articles
  const T=[[500,70,-.08],[730,52,0],[960,70,.08]],TW=205,TH=290;
  ps.forEach((p,i)=>{const t=T[i];x.save();x.translate(t[0]+TW/2,t[1]+TH/2);x.rotate(t[2]);x.translate(-TW/2,-TH/2);
    x.save();x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=36;x.shadowOffsetY=18;x.fillStyle='#fff';rr(x,0,0,TW,TH,24);x.fill();x.restore();
    x.save();rr(x,14,14,TW-28,185,16);x.clip();x.fillStyle='#F6F3FC';x.fillRect(14,14,TW-28,185);if(imgs[i])fit(x,imgs[i],18,18,TW-36,177);else{const pc=pal(p.couleur);x.fillStyle=pc[1];x.fillRect(14,14,TW-28,185);x.fillStyle='#fff';x.font='800 60px Sora, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ini(p.nom),TW/2,106);}x.restore();
    x.fillStyle='#1B1033';x.textAlign='left';x.textBaseline='alphabetic';x.fillText(ogFit(x,p.nom,'700 #px Inter, sans-serif',17,TW-30,13),15,224);
    pill(x,15,236,38,fmt(p.prix)+' F','#FF7A1A','#fff','800 21px Sora, sans-serif',12);
    x.restore();
    if(p.prix_barre&&p.prix_barre>p.prix)ogSticker(x,t[0]+TW-12,t[1]+12,40,'-'+Math.round((1-p.prix/p.prix_barre)*100)+'%');});
  if(!ps.length){x.fillStyle='#fff';x.font='800 40px Sora, sans-serif';x.textAlign='left';x.fillText('Nouvelle boutique',560,220);x.font='600 24px Inter, sans-serif';x.fillText('Découvrez les articles en ligne',560,265);}
  const n=o.total||0;if(n>3){x.fillStyle='rgba(255,255,255,.9)';x.font='700 19px Inter, sans-serif';x.textAlign='right';x.textBaseline='alphabetic';x.fillText('+ '+(n-3)+' autres articles',OW-44,400);}
  ogCta(x,500,OH-128,'Voir la boutique',24);
  ogBrand(x,OW-300,OH-112,brand,o.brand);
  ogFlag(x);
  return c.toDataURL('image/jpeg',.86);
}
window.GbStatut={product,shop,place,ogProduct,ogShop};
})();
