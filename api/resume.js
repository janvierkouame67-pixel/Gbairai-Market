// Gbairai Market : résumé de la semaine envoyé chaque lundi à 8 h (heure d'Abidjan) sur le téléphone de l'administrateur.
// Lancé par Vercel (vercel.json > crons). Un seul envoi par semaine, même si on l'appelle plusieurs fois.
const { sendPush } = require('./_webpush');
const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEYS = { pub: process.env.VAPID_PUBLIC_KEY, priv: process.env.VAPID_PRIVATE_KEY };
const H = () => ({ apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' });
const N = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const pl = (n, mot) => N(n) + ' ' + mot + (n > 1 ? 's' : '');

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }

module.exports = async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return send(res, 401, { error: 'Interdit' });
  if (!(SR && KEYS.pub && KEYS.priv)) return send(res, 200, { envoye: 0, pret: false });
  try {
    const r = await fetch(URL_SB + '/rest/v1/rpc/stats_resume', { method: 'POST', headers: H(), body: '{}' });
    if (!r.ok) return send(res, 200, { envoye: 0 });
    const s = await r.json();
    if (s.deja) return send(res, 200, { envoye: 0, deja: true });
    await fetch(URL_SB + '/rest/v1/stats', { method: 'POST', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify({ kind: 'resume' }) });
    const subs = await (await fetch(URL_SB + '/rest/v1/push_subs?select=endpoint,p256dh,auth&admin=eq.true', { headers: H() })).json();
    let corps = pl(s.visiteurs, 'visiteur') + ' · ' + pl(s.commandes, 'commande') + ' (' + N(s.confirmees) + ' confirmée' + (s.confirmees > 1 ? 's' : '') + ')'
      + ' · ' + pl(s.boutiques, 'nouvelle boutique').replace('nouvelle boutiques', 'nouvelles boutiques');
    if (s.endormis) corps += ' · ' + pl(s.endormis, 'vendeur') + ' à relancer';
    if (s.recherche_vide) corps += ' · Recherché sans résultat : « ' + s.recherche_vide + ' »';
    let ok = 0;
    await Promise.all((Array.isArray(subs) ? subs : []).map(async x => {
      try { const st = await sendPush(x, { title: '📊 Votre semaine sur Gbairai Market', body: corps, url: '/#admin', tag: 'resume' }, KEYS); if (st < 300) ok++; } catch (e) {}
    }));
    return send(res, 200, { envoye: ok });
  } catch (e) {
    return send(res, 200, { envoye: 0 });
  }
};
