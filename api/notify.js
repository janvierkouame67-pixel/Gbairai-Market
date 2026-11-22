// Gbairai Market : envoie les notifications aux clients.
//  - kind "boutique" : nouvel article ou promo d'une boutique → ses abonnés (5 par jour max)
//  - kind "commande" : nouvelle étape d'une commande → le client qui suit cette commande
// Nécessite dans Vercel : SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.
const { sendPush } = require('./_webpush');
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEYS = { pub: process.env.VAPID_PUBLIC_KEY, priv: process.env.VAPID_PRIVATE_KEY };
const UUID = /^[0-9a-f-]{36}$/i;
const F = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const ETAPES = { confirmee: 'Votre commande est confirmée ✅', preparation: 'Votre commande est en préparation 📦', en_route: 'Votre commande est en route 🛵',
  livree: 'Votre commande est livrée. Merci ! ⭐', echec: 'La livraison n\'a pas pu se faire. Contactez le vendeur.', annulee: 'Votre commande a été annulée.' };

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const H = () => ({ apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' });
const get = async path => { const r = await fetch(URL_SB + '/rest/v1/' + path, { headers: H() }); if (!r.ok) throw new Error('db'); return r.json(); };

async function pushAll(subs, data) {
  let ok = 0;
  await Promise.all(subs.map(async s => {
    try {
      const st = await sendPush(s, data, KEYS);
      if (st === 404 || st === 410) await fetch(URL_SB + '/rest/v1/push_subs?endpoint=eq.' + encodeURIComponent(s.endpoint), { method: 'DELETE', headers: H() });
      else if (st < 300) ok++;
    } catch (e) {}
  }));
  return ok;
}

module.exports = async (req, res) => {
  const pret = !!(SR && KEYS.pub && KEYS.priv);
  if (req.method === 'GET') return send(res, 200, { pret, cle: KEYS.pub || '' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée' });
  if (!pret) return send(res, 200, { envoye: 0, pret: false });
  try {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
    // Message d'un client (sans compte) → prévenir le vendeur, seulement pour le 1er message non lu
    if (body.kind === 'message' && body.k) {
      if (!UUID.test(body.conv_id || '') || !UUID.test(body.k)) return send(res, 400, { error: 'Discussion invalide.' });
      const c = (await get('conversations?select=id,shop_id,client_nom,last_msg,non_lus_vendeur,last_at&id=eq.' + body.conv_id + '&client_key=eq.' + body.k))[0];
      if (!c || c.non_lus_vendeur !== 1 || Date.now() - new Date(c.last_at) > 120000) return send(res, 200, { envoye: 0 });
      const subs = await get('push_subs?select=endpoint,p256dh,auth&vendeur_shop=eq.' + c.shop_id);
      const n = await pushAll(subs, { title: '💬 ' + (c.client_nom || 'Un client') + ' vous écrit', body: c.last_msg, url: '/#discussion-' + c.id, tag: 'conv-' + c.id });
      return send(res, 200, { envoye: n });
    }
    const auth = req.headers.authorization || '';
    if (!/^Bearer .+/.test(auth)) return send(res, 401, { error: 'Connectez-vous.' });
    const u = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: auth } });
    if (!u.ok) return send(res, 401, { error: 'Session expirée.' });
    const me = await u.json();
    const admin = (await get('profiles?select=role&id=eq.' + me.id))[0];
    const isAdmin = admin && admin.role === 'admin';

    if (body.kind === 'commande') {
      if (!UUID.test(body.order_id || '')) return send(res, 400, { error: 'Commande invalide.' });
      const o = (await get('orders?select=id,shop_id,statut,livraison&id=eq.' + body.order_id))[0];
      if (!o) return send(res, 404, { error: 'Commande introuvable.' });
      const s = (await get('shops?select=nom,owner&id=eq.' + o.shop_id))[0];
      if (!s || (s.owner !== me.id && !isAdmin)) return send(res, 403, { error: 'Interdit.' });
      const etape = o.statut === 'annulee' ? 'annulee' : (o.livraison && o.livraison !== 'attente') ? o.livraison : o.statut;
      if (!ETAPES[etape]) return send(res, 200, { envoye: 0 });
      const subs = await get('push_subs?select=endpoint,p256dh,auth&orders=cs.%7B' + o.id + '%7D');
      const n = await pushAll(subs, { title: s.nom + ' · n° ' + o.id.slice(0, 8).toUpperCase(), body: ETAPES[etape], url: '/#suivi-' + o.id, tag: 'cmd-' + o.id });
      return send(res, 200, { envoye: n });
    }

    if (body.kind === 'message') {
      if (!UUID.test(body.conv_id || '')) return send(res, 400, { error: 'Discussion invalide.' });
      const c = (await get('conversations?select=id,shop_id,last_msg,non_lus_client&id=eq.' + body.conv_id))[0];
      if (!c) return send(res, 404, { error: 'Discussion introuvable.' });
      const s = (await get('shops?select=nom,owner&id=eq.' + c.shop_id))[0];
      if (!s || s.owner !== me.id) return send(res, 403, { error: 'Interdit.' });
      if (c.non_lus_client !== 1) return send(res, 200, { envoye: 0 });
      const subs = await get('push_subs?select=endpoint,p256dh,auth&convs=cs.%7B' + c.id + '%7D');
      const n = await pushAll(subs, { title: '💬 ' + s.nom + ' vous a répondu', body: c.last_msg, url: '/#chat-' + c.shop_id, tag: 'conv-' + c.id });
      return send(res, 200, { envoye: n });
    }

    if (body.kind === 'boutique') {
      if (!UUID.test(body.shop_id || '')) return send(res, 400, { error: 'Boutique invalide.' });
      const s = (await get('shops?select=id,nom,slug,owner,statut&id=eq.' + body.shop_id))[0];
      if (!s || (s.owner !== me.id && !isAdmin)) return send(res, 403, { error: 'Interdit.' });
      if (s.statut !== 'actif') return send(res, 200, { envoye: 0 });
      const depuis = new Date(Date.now() - 864e5).toISOString();
      const log = await get('push_log?select=id&shop_id=eq.' + s.id + '&created_at=gt.' + depuis);
      if (log.length >= 5) return send(res, 200, { envoye: 0, limite: true });
      const p = (await get('products?select=id,nom,prix,prix_barre,photo&shop_id=eq.' + s.id + '&visible=is.true&stock=gt.0' + (UUID.test(body.product_id || '') ? '&id=eq.' + body.product_id : '') + '&order=created_at.desc&limit=1'))[0];
      if (!p) return send(res, 200, { envoye: 0 });
      const promo = body.promo && p.prix_barre > p.prix;
      const subs = await get('push_subs?select=endpoint,p256dh,auth&shops=cs.%7B' + s.id + '%7D');
      if (!subs.length) return send(res, 200, { envoye: 0 });
      await fetch(URL_SB + '/rest/v1/push_log', { method: 'POST', headers: H(), body: JSON.stringify({ shop_id: s.id }) });
      const n = await pushAll(subs, { title: s.nom, body: (promo ? '⚡ Promo : ' : '🆕 Nouveau : ') + p.nom + ' à ' + F(p.prix), url: '/#produit-' + p.id, image: p.photo || undefined, tag: 'shop-' + s.id });
      return send(res, 200, { envoye: n });
    }
    return send(res, 400, { error: 'Demande inconnue.' });
  } catch (e) {
    return send(res, 500, { error: 'Erreur du serveur.' });
  }
};
