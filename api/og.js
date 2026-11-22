// Gbairai Market : enregistre l'image d'aperçu (1200 × 630) d'une boutique ou d'un produit.
// L'image est dessinée sur le téléphone du vendeur, puis rangée ici dans photos/og/<id>.jpg.
// Seul le propriétaire de la boutique (ou l'administrateur) peut la remplacer.
// Nécessite dans Vercel : SUPABASE_SERVICE_ROLE_KEY (déjà en place).
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 900 * 1024;

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const H = extra => Object.assign({ apikey: SR, Authorization: 'Bearer ' + SR }, extra || {});
const rest = async path => { const r = await fetch(URL_SB + '/rest/v1/' + path, { headers: H() }); if (!r.ok) throw new Error('db'); return r.json(); };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée' });
  if (!SR) return send(res, 200, { ok: false });
  try {
    const auth = req.headers.authorization || '';
    if (!/^Bearer .+/.test(auth)) return send(res, 401, { error: 'Connectez-vous.' });
    const u = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: auth } });
    if (!u.ok) return send(res, 401, { error: 'Session expirée.' });
    const me = await u.json();
    if (!UUID.test(me.id || '')) return send(res, 401, { error: 'Session invalide.' });
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
    if (!['shop', 'product'].includes(body.kind) || !UUID.test(body.id || '')) return send(res, 400, { error: 'Demande invalide.' });

    let shopId = body.id;
    if (body.kind === 'product') { const p = (await rest('products?select=shop_id&id=eq.' + body.id))[0]; if (!p) return send(res, 404, { error: 'Produit introuvable.' }); shopId = p.shop_id; }
    const s = (await rest('shops?select=owner&id=eq.' + shopId))[0];
    if (!s) return send(res, 404, { error: 'Boutique introuvable.' });
    if (s.owner !== me.id) {
      const pr = (await rest('profiles?select=role&id=eq.' + me.id))[0];
      if (!pr || pr.role !== 'admin') return send(res, 403, { error: 'Interdit.' });
    }

    const buf = Buffer.from(String(body.data || '').replace(/^data:image\/jpeg;base64,/, ''), 'base64');
    if (buf.length < 2000 || buf.length > MAX) return send(res, 400, { error: 'Image trop petite ou trop lourde.' });
    if (buf[0] !== 0xFF || buf[1] !== 0xD8 || buf[2] !== 0xFF) return send(res, 400, { error: 'Format non accepté.' });
    const up = await fetch(URL_SB + '/storage/v1/object/photos/og/' + body.id + '.jpg', { method: 'POST', headers: H({ 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'Cache-Control': 'max-age=300' }), body: buf });
    return send(res, up.ok ? 200 : 500, { ok: up.ok });
  } catch (e) {
    return send(res, 500, { error: 'Erreur du serveur.' });
  }
};
