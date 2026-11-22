// Gbairai Market : enregistre les visites, recherches, clics WhatsApp/Telegram, paniers et connexions.
// Le journal "stats" n'est lisible que par l'administrateur (fonction stats_admin). Gardé 90 jours.
// Nécessite dans Vercel : SUPABASE_SERVICE_ROLE_KEY (déjà en place).
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KINDS = ['page', 'recherche', 'wa', 'tg', 'panier', 'commande', 'connexion', 'echec'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|telegrambot|headless|lighthouse/i;

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const H = extra => Object.assign({ apikey: SR, Authorization: 'Bearer ' + SR }, extra || {});

function appareil(ua) {
  ua = String(ua || '');
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Autre';
  const nav = /FBAN|FBAV|FB_IAB/.test(ua) ? 'Facebook' : /Instagram/.test(ua) ? 'Instagram' : /SamsungBrowser/.test(ua) ? 'Samsung' : /OPR\/|Opera|OPiOS/.test(ua) ? 'Opera'
    : /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Navigateur';
  return os + ' · ' + nav;
}
function ville(h) { try { return decodeURIComponent(String(h || '')).slice(0, 60); } catch (e) { return ''; } }
const txt = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée' });
  if (!SR) return send(res, 200, { ok: false });
  const ua = req.headers['user-agent'] || '';
  if (BOT.test(ua)) return send(res, 200, { ok: true });
  try {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
    const vis = txt(body.v, 40).replace(/[^A-Za-z0-9_-]/g, '');
    const evs = (Array.isArray(body.ev) ? body.ev : []).slice(0, 30).filter(e => e && KINDS.includes(e.k));
    if (!evs.length) return send(res, 200, { ok: true });
    const base = { visiteur: vis, appareil: appareil(ua), ville: ville(req.headers['x-vercel-ip-city']) };

    // Connexion : on vérifie la session pour savoir qui c'est (jamais sur la parole du navigateur)
    let me = null, role = '';
    if (evs.some(e => e.k === 'connexion')) {
      const auth = req.headers.authorization || '';
      if (/^Bearer .+/.test(auth)) {
        const u = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: auth } });
        if (u.ok) {
          me = await u.json();
          if (UUID.test(me.id || '')) {
            const [p, s] = await Promise.all([
              fetch(URL_SB + '/rest/v1/profiles?select=role&id=eq.' + me.id, { headers: H() }).then(r => r.ok ? r.json() : []),
              fetch(URL_SB + '/rest/v1/shops?select=id&owner=eq.' + me.id + '&limit=1', { headers: H() }).then(r => r.ok ? r.json() : [])
            ]);
            role = p[0] && p[0].role === 'admin' ? 'admin' : s[0] ? 'vendeur' : 'client';
          } else me = null;
        }
      }
    }

    let nCx = 0, nEchec = 0;
    const rows = [];
    for (const e of evs) {
      const r = Object.assign({ kind: e.k, shop_id: null, product_id: null, user_id: null, role: '', q: '', n: null }, base);
      if (UUID.test(e.s || '')) r.shop_id = e.s;
      if (UUID.test(e.p || '')) r.product_id = e.p;
      if (e.k === 'recherche') { r.q = txt(e.q, 80).toLowerCase(); if (r.q.length < 2) continue; r.n = Math.max(0, Math.min(100000, parseInt(e.n, 10) || 0)); }
      if (e.k === 'connexion') { if (!me || ++nCx > 1) continue; r.user_id = me.id; r.role = role; }
      if (e.k === 'echec') { if (++nEchec > 3) continue; r.q = String(e.q || '').replace(/\D/g, '').slice(0, 15); if (r.q.length < 8) continue; }
      rows.push(r);
    }
    if (!rows.length) return send(res, 200, { ok: true });
    const up = await fetch(URL_SB + '/rest/v1/stats', { method: 'POST', headers: H({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify(rows) });
    return send(res, 200, { ok: up.ok });
  } catch (e) {
    return send(res, 200, { ok: false });
  }
};
