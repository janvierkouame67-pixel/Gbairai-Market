// Gbairai Market : l'heure magique. Chaque soir vers 19 h (heure d'Abidjan), prévient les personnes
// qui ont touché « Me prévenir à 20 h », s'il y a des articles à prix magique.
// Lancé par Vercel (vercel.json > crons). Nécessite SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.
const { sendPush } = require('./_webpush');
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEYS = { pub: process.env.VAPID_PUBLIC_KEY, priv: process.env.VAPID_PRIVATE_KEY };
const H = () => ({ apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' });
function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }

module.exports = async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return send(res, 401, { error: 'Interdit' });
  if (!(SR && KEYS.pub && KEYS.priv)) return send(res, 200, { envoye: 0, pret: false });
  try {
    const prods = await (await fetch(URL_SB + '/rest/v1/products?select=id&visible=eq.true&stock=gt.0&prix_magique=not.is.null&limit=500', { headers: H() })).json();
    const n = Array.isArray(prods) ? prods.length : 0;
    if (!n) return send(res, 200, { envoye: 0, articles: 0 });
    const subs = await (await fetch(URL_SB + '/rest/v1/push_subs?select=endpoint,p256dh,auth&magique=eq.true&limit=20000', { headers: H() })).json();
    let ok = 0;
    await Promise.all((Array.isArray(subs) ? subs : []).map(async s => {
      try {
        const st = await sendPush(s, { title: '🌙 L\'heure magique commence à 20 h', body: n + ' article' + (n > 1 ? 's' : '') + ' à prix fous pendant 1 heure seulement. Soyez prêt(e) !', url: '/#magique', tag: 'magique' }, KEYS);
        if (st === 404 || st === 410) await fetch(URL_SB + '/rest/v1/push_subs?endpoint=eq.' + encodeURIComponent(s.endpoint), { method: 'DELETE', headers: H() });
        else if (st < 300) ok++;
      } catch (e) {}
    }));
    return send(res, 200, { envoye: ok, articles: n });
  } catch (e) {
    return send(res, 200, { envoye: 0 });
  }
};
