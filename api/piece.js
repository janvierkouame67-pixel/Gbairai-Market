// Gbairai Market : photos des pièces d'identité des vendeurs, gardées dans un coffre privé.
// Le coffre "pieces" n'est pas public : seul ce serveur (clé SUPABASE_SERVICE_ROLE_KEY dans Vercel) y accède.
//  - action "envoyer" : le vendeur envoie le recto ou le selfie de SA boutique
//  - action "voir"    : l'administrateur reçoit des liens valables 10 minutes
//  - action "effacer" : l'administrateur supprime les photos d'une boutique
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'pieces';
const KINDS = ['recto', 'selfie'];
const UUID = /^[0-9a-f-]{36}$/i;
const MAX = 3 * 1024 * 1024;

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const H = (extra) => Object.assign({ apikey: SR, Authorization: 'Bearer ' + SR }, extra || {});
const rest = async path => { const r = await fetch(URL_SB + '/rest/v1/' + path, { headers: H() }); if (!r.ok) throw new Error('db'); return r.json(); };

let coffrePret = false;
async function coffre() {
  if (coffrePret) return;
  const r = await fetch(URL_SB + '/storage/v1/bucket/' + BUCKET, { headers: H() });
  if (r.ok) {
    const b = await r.json();
    if (b.public) await fetch(URL_SB + '/storage/v1/bucket/' + BUCKET, { method: 'PUT', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ public: false, file_size_limit: MAX, allowed_mime_types: ['image/jpeg'] }) });
  } else {
    const c = await fetch(URL_SB + '/storage/v1/bucket', { method: 'POST', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: MAX, allowed_mime_types: ['image/jpeg'] }) });
    if (!c.ok && c.status !== 409) { const t = await c.text(); if (!/exist/i.test(t)) throw new Error('coffre'); }
  }
  coffrePret = true;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée' });
  if (!SR) return send(res, 500, { error: 'Clé manquante : ajoutez SUPABASE_SERVICE_ROLE_KEY dans Vercel.' });
  try {
    const auth = req.headers.authorization || '';
    if (!/^Bearer .+/.test(auth)) return send(res, 401, { error: 'Connectez-vous.' });
    const u = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: auth } });
    if (!u.ok) return send(res, 401, { error: 'Session expirée. Reconnectez-vous.' });
    const me = await u.json();
    if (!UUID.test(me.id || '')) return send(res, 401, { error: 'Session invalide.' });
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
    await coffre();

    if (body.action === 'envoyer') {
      if (!KINDS.includes(body.kind)) return send(res, 400, { error: 'Photo inconnue.' });
      const sh = (await rest('shops?select=id&owner=eq.' + me.id + '&limit=1'))[0];
      if (!sh) return send(res, 403, { error: 'Aucune boutique à votre nom.' });
      const buf = Buffer.from(String(body.data || ''), 'base64');
      if (buf.length < 1000 || buf.length > MAX) return send(res, 400, { error: 'Photo trop petite ou trop lourde.' });
      if (buf[0] !== 0xFF || buf[1] !== 0xD8 || buf[2] !== 0xFF) return send(res, 400, { error: 'Format de photo non accepté.' });
      const up = await fetch(URL_SB + '/storage/v1/object/' + BUCKET + '/' + sh.id + '/' + body.kind + '.jpg', { method: 'POST', headers: H({ 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'Cache-Control': 'no-store' }), body: buf });
      if (!up.ok) return send(res, 500, { error: 'Envoi refusé par le stockage.' });
      return send(res, 200, { ok: true });
    }

    const pr = (await rest('profiles?select=role&id=eq.' + me.id))[0];
    if (!pr || pr.role !== 'admin') return send(res, 403, { error: 'Réservé à l\'administrateur.' });
    if (!UUID.test(body.shop_id || '')) return send(res, 400, { error: 'Boutique invalide.' });

    if (body.action === 'voir') {
      const out = {};
      for (const k of KINDS) {
        const r = await fetch(URL_SB + '/storage/v1/object/sign/' + BUCKET + '/' + body.shop_id + '/' + k + '.jpg', { method: 'POST', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ expiresIn: 600 }) });
        if (r.ok) { const j = await r.json(); const p = j.signedURL || j.signedUrl; if (p) out[k] = /^https?:/.test(p) ? p : URL_SB + '/storage/v1' + p; }
      }
      return send(res, 200, out);
    }
    if (body.action === 'effacer') {
      await fetch(URL_SB + '/storage/v1/object/' + BUCKET, { method: 'DELETE', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: KINDS.map(k => body.shop_id + '/' + k + '.jpg') }) });
      return send(res, 200, { ok: true });
    }
    return send(res, 400, { error: 'Demande inconnue.' });
  } catch (e) {
    return send(res, 500, { error: 'Erreur du serveur.' });
  }
};
