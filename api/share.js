// Gbairai Market : aperçu joli des liens partagés (WhatsApp, Facebook, Telegram…).
// /b/<boutique> et /p/<produit> renvoient une page avec titre, description et photo,
// puis le visiteur est envoyé tout de suite vers le site.
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const place = s => { const q = (s.quartier || '').trim(), v = (s.ville || '').trim(); return q && v && q.toLowerCase() !== v.toLowerCase() ? q + ', ' + v : (q || v || "Côte d'Ivoire"); };
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Image d'aperçu dessinée pour la boutique ou le produit (photos/og/<id>.jpg), si elle existe
async function ogImage(id) {
  try {
    const u = URL_SB + '/storage/v1/object/public/photos/og/' + id + '.jpg';
    const r = await fetch(u, { method: 'HEAD' });
    if (!r.ok) return null;
    const v = (r.headers.get('etag') || r.headers.get('last-modified') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
    return u + (v ? '?v=' + v : '');
  } catch (e) { return null; }
}

async function get(path) {
  const r = await fetch(URL_SB + '/rest/v1/' + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  if (!r.ok) return [];
  return r.json();
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'gbairai-market.vercel.app';
  const base = 'https://' + host;
  let title = 'Gbairai Market', desc = "Toutes les boutiques de Côte d'Ivoire au même endroit. Commandez directement sur WhatsApp.";
  let image = base + '/og2.jpg', drawn = true, target = '/', url = base;
  try {
    if (q.v) {
      // Invitation des vendeurs : /vendre
      target = '/#vendeur'; url = base + '/vendre';
      title = 'Crée ta boutique en ligne GRATUITE · Gbairai Market';
      desc = 'Prête en 2 minutes sur ton téléphone. Tes articles avec photos et prix, et tes clients commandent directement sur ton WhatsApp.';
      image = base + '/og-vendre.jpg';
    } else if (q.b && /^[a-z0-9-]{1,80}$/.test(q.b)) {
      target = '/#boutique-' + q.b; url = base + '/b/' + q.b;
      if (q.c && /^[A-Za-z0-9]{2,20}$/.test(q.c)) target = '/?c=' + q.c.toUpperCase() + '#boutique-' + q.b;
      const [s] = await get('shops?select=id,nom,description,quartier,ville,logo,verification&statut=eq.actif&slug=eq.' + q.b + '&limit=1');
      if (s) {
        const prods = await get('products?select=photo&visible=eq.true&photo=not.is.null&shop_id=eq.' + s.id + '&order=created_at.desc&limit=1');
        title = s.nom + (s.verification === 'verifie' ? ' ✅' : '') + ' · Gbairai Market';
        desc = (s.description ? s.description + ' · ' : '') + '📍 ' + place(s) + ' · Commande directe sur WhatsApp';
        const og = await ogImage(s.id);
        if (og) image = og; else { image = (prods[0] && prods[0].photo) || s.logo || image; drawn = image === base + '/og2.jpg'; }
      }
    } else if (q.p && /^[0-9a-f-]{36}$/i.test(q.p)) {
      target = '/#produit-' + q.p; url = base + '/p/' + q.p;
      const [p] = await get('products?select=nom,prix,description,photo,stock,shop_id&visible=eq.true&id=eq.' + q.p + '&limit=1');
      if (p) {
        const [s] = await get('shops?select=nom,quartier,ville&id=eq.' + p.shop_id + '&limit=1');
        title = p.nom + ' · ' + fmt(p.prix) + ' FCFA';
        desc = (s ? '🏪 ' + s.nom + ' · ' + place(s) + ' — ' : '') + (p.description || 'Commandez directement sur WhatsApp.');
        const og = await ogImage(q.p);
        if (og) image = og; else if (p.photo) { image = p.photo; drawn = false; }
      }
    }
  } catch (e) { /* on garde l'aperçu général */ }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.end(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Gbairai Market">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">${drawn ? '\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">' : ''}
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#5B21B6">
<link rel="icon" href="/icons/logo.svg">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</head><body style="font-family:sans-serif;background:#F5F3FF;color:#1B1033;text-align:center;padding:40px">
<p>Ouverture de <a href="${esc(target)}">${esc(title)}</a>…</p></body></html>`);
};
