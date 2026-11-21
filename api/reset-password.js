// Gbairai Market : l'administrateur crée un nouveau mot de passe pour un vendeur qui l'a oublié.
// Nécessite la variable SUPABASE_SERVICE_ROLE_KEY dans Vercel (Settings > Environment Variables).
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const crypto = require('crypto');

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const srHeaders = () => ({ apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée' });
  if (!SR) return send(res, 500, { error: "Clé manquante : ajoutez SUPABASE_SERVICE_ROLE_KEY dans Vercel, puis redéployez." });
  try {
    const auth = req.headers.authorization || '';
    if (!/^Bearer .+/.test(auth)) return send(res, 401, { error: 'Connectez-vous en administrateur.' });
    const u = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: auth } });
    if (!u.ok) return send(res, 401, { error: 'Session expirée. Reconnectez-vous.' });
    const me = await u.json();
    const pr = await (await fetch(URL_SB + '/rest/v1/profiles?select=role&id=eq.' + encodeURIComponent(me.id), { headers: srHeaders() })).json();
    if (!pr[0] || pr[0].role !== 'admin') return send(res, 403, { error: 'Réservé à l\'administrateur.' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const shopId = body && body.shop_id;
    if (!/^[0-9a-f-]{36}$/i.test(shopId || '')) return send(res, 400, { error: 'Boutique invalide.' });
    const sh = await (await fetch(URL_SB + '/rest/v1/shops?select=owner&id=eq.' + shopId, { headers: srHeaders() })).json();
    if (!sh[0]) return send(res, 404, { error: 'Boutique introuvable.' });
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(8);
    let pw = ''; for (let i = 0; i < 8; i++) pw += alphabet[bytes[i] % alphabet.length];
    const up = await fetch(URL_SB + '/auth/v1/admin/users/' + sh[0].owner, { method: 'PUT', headers: srHeaders(), body: JSON.stringify({ password: pw }) });
    if (!up.ok) return send(res, 500, { error: 'Supabase a refusé le changement.' });
    return send(res, 200, { password: pw });
  } catch (e) {
    return send(res, 500, { error: 'Erreur du serveur.' });
  }
};
