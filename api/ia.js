// Gbairai Market : l'intelligence artificielle (Claude, d'Anthropic) pour 5 services :
//  - produit   : une photo → nom, rayon, description, prix conseillé (vendeur connecté)
//  - vocal     : une phrase dite au micro (français, nouchi…) → fiche produit (vendeur connecté)
//  - coach     : les chiffres de la boutique → conseils de la semaine (vendeur connecté)
//  - recherche : une photo prise par un client → mots à chercher dans les boutiques
//  - traduire  : textes d'une fiche ou d'une discussion → autre langue
// Nécessite dans Vercel : ANTHROPIC_API_KEY (à mettre vous-même, ne l'envoyez à personne).
// Sans cette clé, le site marche normalement et les boutons IA disent « IA pas encore activée ».
const SDK = require('@anthropic-ai/sdk');
const Anthropic = SDK.Anthropic || SDK.default || SDK;

const URL_SB = process.env.SUPABASE_URL || 'https://wrowhozasjjszslrttts.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Zd44JPlJpkZFi7q_LLD-Mg_MjAI3YE1';
const MODEL = 'claude-opus-5-5';
const MAX_IMG = 1500 * 1024;
const VENDEUR = new Set(['produit', 'vocal', 'coach']);

// Petit frein contre les abus (par serveur, par adresse) : 40 demandes par heure
const HITS = new Map();
function tropDeDemandes(ip) {
  const now = Date.now(), h = (HITS.get(ip) || []).filter(t => now - t < 3600e3);
  h.push(now); HITS.set(ip, h);
  if (HITS.size > 5000) HITS.clear();
  return h.length > 40;
}

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const obj = (props) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });

function imageBlock(data) {
  const b64 = str(data, 3e6).replace(/^data:image\/jpeg;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 1000 || buf.length > MAX_IMG || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: buf.toString('base64') } };
}

const CONTEXTE = 'Tu travailles pour Gbairai Market, une plateforme de petites boutiques en ligne en Côte d\'Ivoire. ' +
  'Les prix sont en francs CFA (FCFA). Les vendeuses et vendeurs vendent surtout via leurs statuts WhatsApp. ' +
  'Écris en français simple, clair et chaleureux, comme on parle à Abidjan, sans fautes. ';

// Chaque service : ce qu'on demande à Claude et la forme exacte de la réponse attendue
function tache(kind, b) {
  const rayons = (Array.isArray(b.rayons) ? b.rayons : []).slice(0, 40).map(r => str(r, 30)).filter(Boolean);
  const listeRayons = rayons.length ? rayons : ['autre'];
  if (kind === 'produit') {
    const img = imageBlock(b.image); if (!img) return null;
    return {
      content: [img, { type: 'text', text: CONTEXTE + 'Voici la photo d\'un article qu\'un vendeur veut mettre en vente. ' +
        'Donne : un nom court et vendeur (max 60 caractères), le rayon parmi la liste, un type précis (ex. « Sac cabas », « Escarpins »), ' +
        'une description de 2 à 3 phrases (matière, usage, style ; n\'invente pas de marque ni de taille), les couleurs visibles, ' +
        'et un prix conseillé réaliste en FCFA pour le marché ivoirien (nombre entier, 0 si impossible à estimer).' }],
      schema: obj({ nom: { type: 'string' }, categorie: { type: 'string', enum: listeRayons }, type: { type: 'string' }, description: { type: 'string' }, couleurs: { type: 'string' }, prix_conseille: { type: 'integer' } }),
    };
  }
  if (kind === 'recherche') {
    const img = imageBlock(b.image); if (!img) return null;
    return {
      content: [img, { type: 'text', text: CONTEXTE + 'Un client a photographié un article qu\'il aimerait acheter. ' +
        'Décris-le en une phrase courte, choisis le rayon le plus proche dans la liste, et donne 3 à 8 mots simples ' +
        '(en minuscules, au singulier, sans accents superflus) qu\'un vendeur aurait écrits dans le nom ou la description de cet article ' +
        '(type d\'article, matière, couleur, style).' }],
      schema: obj({ resume: { type: 'string' }, categorie: { type: 'string', enum: listeRayons }, mots: { type: 'array', items: { type: 'string' } } }),
    };
  }
  if (kind === 'vocal') {
    const t = str(b.texte, 500).trim(); if (!t) return null;
    return {
      content: [{ type: 'text', text: CONTEXTE + 'Un vendeur a dicté son produit au micro, en français ou en nouchi ' +
        '(« togo » = 100 F, « barre » = 1 000 F ou 10 000 F selon le contexte, « gbê » = vrai/beau, etc.). ' +
        'Transforme la phrase en fiche produit. Prix et stock en nombres entiers (0 si non dit). Tailles séparées par des virgules ou vide. ' +
        'Rayon parmi la liste. Description courte et propre en français (1 à 2 phrases), vide si rien à dire.\n\nPhrase dictée : « ' + t + ' »' }],
      schema: obj({ nom: { type: 'string' }, prix: { type: 'integer' }, stock: { type: 'integer' }, tailles: { type: 'string' }, categorie: { type: 'string', enum: listeRayons }, description: { type: 'string' } }),
    };
  }
  if (kind === 'coach') {
    const chiffres = JSON.stringify(b.chiffres || {}).slice(0, 6000);
    return {
      content: [{ type: 'text', text: CONTEXTE + 'Tu es le coach d\'une petite boutique. Voici ses chiffres (JSON) : ' + chiffres + '\n\n' +
        'Donne 3 ou 4 conseils concrets pour vendre plus cette semaine, chacun appuyé sur un chiffre précis ci-dessus ' +
        '(cite le produit ou le nombre). Pas de conseil vague. Chaque conseil : un emoji, un titre de 6 mots maximum, ' +
        'un texte de 1 à 2 phrases, et l\'action la plus utile parmi la liste.' }],
      schema: obj({ conseils: { type: 'array', items: obj({ icone: { type: 'string' }, titre: { type: 'string' }, texte: { type: 'string' }, action: { type: 'string', enum: ['relancer', 'stock', 'prix', 'photo', 'statut', 'aucune'] } }) } }),
    };
  }
  if (kind === 'traduire') {
    const textes = (Array.isArray(b.textes) ? b.textes : []).slice(0, 30).map(x => str(x, 1200));
    const vers = b.vers === 'fr' ? 'français' : 'anglais';
    if (!textes.length) return null;
    return {
      content: [{ type: 'text', text: 'Traduis chacun de ces textes en ' + vers + ', naturellement, en gardant les prix, emojis et noms de marque. ' +
        'Si un texte est déjà en ' + vers + ', renvoie-le tel quel. Renvoie exactement ' + textes.length + ' traductions, dans le même ordre.\n\n' +
        JSON.stringify(textes) }],
      schema: obj({ textes: { type: 'array', items: { type: 'string' } } }),
    };
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée' });
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 200, { ok: false, cle: false });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const kind = str(b.kind, 20);
  const ip = str(req.headers['x-forwarded-for'], 100).split(',')[0].trim() || 'x';
  if (tropDeDemandes(ip)) return send(res, 429, { error: 'Trop de demandes. Réessayez dans un moment.' });

  if (VENDEUR.has(kind)) {
    const auth = req.headers.authorization || '';
    if (!/^Bearer .+/.test(auth)) return send(res, 401, { error: 'Connectez-vous.' });
    const u = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: auth } }).catch(() => null);
    if (!u || !u.ok) return send(res, 401, { error: 'Session expirée.' });
  }
  const t = tache(kind, b);
  if (!t) return send(res, 400, { error: 'Demande invalide.' });

  try {
    const client = new Anthropic();
    const r = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: t.schema } },
      messages: [{ role: 'user', content: t.content }],
    });
    if (r.stop_reason === 'refusal') return send(res, 200, { ok: false, error: 'L\'IA n\'a pas pu traiter cette demande.' });
    const txt = (r.content || []).filter(x => x.type === 'text').map(x => x.text).join('');
    let data; try { data = JSON.parse(txt); } catch (e) { return send(res, 200, { ok: false, error: 'Réponse incomplète, réessayez.' }); }
    return send(res, 200, { ok: true, data });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'L\'IA est très demandée. Réessayez dans une minute.' });
    if (e instanceof Anthropic.AuthenticationError) return send(res, 200, { ok: false, cle: false });
    if (e instanceof Anthropic.APIError) return send(res, 502, { error: 'L\'IA ne répond pas pour le moment.' });
    return send(res, 500, { error: 'Erreur du serveur.' });
  }
};
