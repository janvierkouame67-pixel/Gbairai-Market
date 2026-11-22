// Gbairai Market : comprendre une phrase dite par la vendeuse pour remplir la fiche produit.
// Ex. : « Robe rouge en wax, huit mille francs, taille M et L, il en reste trois »
(function (root) {
  'use strict';
  const U = { zero: 0, zéro: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
    vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, septante: 70, octante: 80, huitante: 80, nonante: 90 };
  const NUMW = new Set(Object.keys(U).concat(['cent', 'cents', 'mille', 'milles', 'million', 'millions', 'et']));

  // « quatre-vingt-dix-neuf mille cinq cents » → 99500
  function wordsToNum(ws) {
    let total = 0, cur = 0, any = false;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i];
      if (w === 'et') continue;
      if (w in U) {
        const v = U[w];
        if (v === 20 && cur % 100 === 4) cur = cur - 4 + 80; // quatre-vingt
        else cur += v;
        any = true;
      } else if (w === 'cent' || w === 'cents') { cur = (cur || 1) * 100; any = true; }
      else if (w === 'mille' || w === 'milles') { total += (cur || 1) * 1000; cur = 0; any = true; }
      else if (w === 'million' || w === 'millions') { total += (cur || 1) * 1e6; cur = 0; any = true; }
    }
    return any ? total + cur : null;
  }

  // Remplace les nombres écrits en lettres et « 8 000 », « 5 mille », « 2,5 millions » par des chiffres.
  function normalise(t) {
    let s = ' ' + String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/ | /g, ' ') + ' ';
    s = s.replace(/(\d)[ .](?=\d{3}\b)/g, '$1');
    s = s.replace(/(\d+(?:[.,]\d+)?)\s*(millions?|mille|milles|k)\b/g, (m, n, u) => String(Math.round(parseFloat(n.replace(',', '.')) * (/^m/.test(u) && u !== 'mille' && u !== 'milles' ? 1e6 : 1000))));
    const tokens = s.split(/(\s+|-|,|\.|;|!|\?)/);
    const out = []; let buf = [], bufRaw = [];
    const flush = () => {
      if (!buf.length) return;
      const only = buf.filter(w => w !== 'et');
      if (only.length) { const n = wordsToNum(buf); out.push(n == null ? bufRaw.join('') : String(n)); }
      else out.push(bufRaw.join(''));
      buf = []; bufRaw = [];
    };
    for (const tk of tokens) {
      const w = tk.trim();
      if (w && NUMW.has(w) && !(w === 'et' && !buf.length) && !((w === 'un' || w === 'une') && !buf.length)) { buf.push(w); bufRaw.push(tk); continue; }
      if (buf.length && (tk === '-' || /^\s+$/.test(tk))) { bufRaw.push(tk); continue; }
      if (buf.length && buf[buf.length - 1] === 'et') { const e = buf.pop(); flush(); out.push(' ' + e + ' '); }
      else flush();
      out.push(tk);
    }
    flush();
    return out.join('').replace(/\s+/g, ' ').trim();
  }

  const WB = '(?:(?<![\\p{L}\\d])(?=[\\p{L}\\d])|(?<=[\\p{L}\\d])(?![\\p{L}\\d]))';
  const R = re => new RegExp(re.source.replace(/\\b/g, WB), 'u');
  const KW = [
    [/\brobes?\b/, 'mode', 'Robes'], [/\b(pagnes?|wax|bazin|kita|kente)\b/, 'mode', 'Pagnes & wax'], [/\b(jupes?)\b/, 'mode', 'Jupes'], [/\b(blouses?|tops?|bodys?|hauts?|crop)\b/, 'mode', 'Hauts'],
    [/\b(ensembles?)\b/, 'mode', 'Ensembles'], [/\b(lingeries?|soutiens?-gorge|culottes?|strings?)\b/, 'mode', 'Lingerie'], [/\b(boubous?|tenues? traditionnelles?|complet)\b/, 'mode', 'Tenues traditionnelles'],
    [/\b(chemises?)\b/, 'mode_homme', 'Chemises'], [/\b(t-?shirts?|polos?|tee-?shirts?)\b/, 'mode_homme', 'T-shirts & polos'], [/\b(jeans?|pantalons?)\b/, 'mode_homme', 'Pantalons & jeans'],
    [/\b(costumes?|vestes?|blazers?)\b/, 'mode_homme', 'Costumes'],
    [/\b(baskets?|sneakers?|tennis|nike|adidas|jordan)\b/, 'chaussures', 'Baskets'], [/\b(talons?|escarpins?)\b/, 'chaussures', 'Talons'], [/\b(sandales?|claquettes?|tapettes?|babouches?|mules?)\b/, 'chaussures', 'Sandales & claquettes'],
    [/\b(chaussures?|mocassins?|derbies)\b/, 'chaussures', 'Chaussures de ville'],
    [/\b(sacs? à dos)\b/, 'sacs', 'Sacs à dos'], [/\b(sacs?|sacoches?)\b/, 'sacs', 'Sacs à main'], [/\b(pochettes?)\b/, 'sacs', 'Pochettes'], [/\b(valises?)\b/, 'sacs', 'Valises'], [/\b(portefeuilles?)\b/, 'sacs', 'Portefeuilles'],
    [/\b(colliers?|chaînes?)\b/, 'bijoux', 'Colliers'], [/\b(bracelets?)\b/, 'bijoux', 'Bracelets'], [/\b(boucles? d'oreilles?)\b/, 'bijoux', "Boucles d'oreilles"], [/\b(bagues?|alliances?)\b/, 'bijoux', 'Bagues'],
    [/\b(montres?)\b/, 'montres', 'Montres'], [/\b(lunettes?)\b/, 'montres', 'Lunettes'], [/\b(ceintures?)\b/, 'montres', 'Ceintures'], [/\b(casquettes?|chapeaux?|bonnets?)\b/, 'montres', 'Chapeaux & casquettes'],
    [/\b(parfums?|eau de toilette)\b/, 'beaute', 'Parfums'], [/\b(crèmes?|laits? de corps|savons?|beurre de karité)\b/, 'beaute', 'Soins du corps'], [/\b(maquillages?|rouges? à lèvres|fonds? de teint|mascara)\b/, 'beaute', 'Maquillage'],
    [/\b(perruques?|mèches?|tissages?|greffes?)\b/, 'beaute', 'Cheveux & perruques'],
    [/\b(télé|tv|téléviseurs?|écrans?)\b/, 'electronique', 'TV & écrans'], [/\b(iphone|samsung|tecno|itel|infinix|xiaomi|redmi|smartphones?|android)\b/, 'tel', 'Smartphones'], [/\b(coques?)\b/, 'tel', 'Coques & protections'], [/\b(chargeurs?|câbles?)\b/, 'tel', 'Chargeurs & câbles'],
    [/\b(écouteurs?|airpods|casques?)\b/, 'tel', 'Écouteurs'], [/\b(téléphones?)\b/, 'tel', 'Smartphones'],
    [/\b(ordinateurs?|laptops?|pc|macbook)\b/, 'electronique', 'Ordinateurs'], [/\b(enceintes?|baffles?|radios?)\b/, 'electronique', 'Audio & enceintes'],
    [/\b(frigos?|réfrigérateurs?|congélateurs?|ventilateurs?|climatiseurs?|mixeurs?|fers? à repasser|micro-ondes)\b/, 'electronique', 'Électroménager'],
    [/\b(canapés?|chaises?|tables?|lits?|matelas|armoires?)\b/, 'maison', 'Meubles'], [/\b(marmites?|assiettes?|casseroles?|verres?|gobelets?)\b/, 'maison', 'Cuisine & vaisselle'],
    [/\b(draps?|rideaux?|serviettes?|couvertures?)\b/, 'maison', 'Linge de maison'], [/\b(tableaux?|déco|vases?|bougies?)\b/, 'maison', 'Décoration'],
    [/\b(jouets?|poupées?|peluches?)\b/, 'enfants', 'Jouets'], [/\b(couches?|biberons?|poussettes?)\b/, 'enfants', 'Puériculture'], [/\b(bébé|enfants?)\b/, 'enfants', 'Vêtements enfant'],
    [/\b(maillots?|survêtements?|jogging|ballons?)\b/, 'sport', 'Tenues de sport']
  ].map(k => [R(k[0]), k[1], k[2]]);
  const COULEURS = ['rouge', 'bleu', 'bleue', 'vert', 'verte', 'jaune', 'noir', 'noire', 'blanc', 'blanche', 'rose', 'violet', 'violette', 'orange', 'marron', 'beige', 'gris', 'grise', 'doré', 'dorée', 'argenté', 'bordeaux', 'kaki', 'multicolore'];
  const FILLER = /^(bonjour|bonsoir|alors|donc|euh+|bon|voilà|voici|j'ai|je vends|je mets|c'est|il y a|nouveau|nouvelle|nouveaux|des|un|une|le|la|les)\b[ ,]*/i;
  const TAILLE_TOK = /^(xxs|xs|s|m|l|xl|xxl|xxxl|[2-5]xl|\d{2}(?:[.,]5)?|unique)$/i;

  function parse(text) {
    const raw = String(text || '').trim();
    const t = normalise(raw);
    const r = { texte: raw };
    // Prix
    const money = /(\d{2,9})\s*(?:francs?|f\b|fcfa|cfa|balles|frs?)/.exec(t) || /(?:prix|coûte|à|a|pour)\s+(\d{3,9})\b/.exec(t);
    if (money) r.prix = +money[1];
    else { const all = (t.match(/\b\d{3,9}\b/g) || []).map(Number).filter(n => n >= 100 && !(n >= 1990 && n <= 2035)); if (all.length) r.prix = Math.max.apply(null, all); }
    // Ancien prix / promo : « au lieu de 10000 »
    const barre = /(?:au lieu de|avant|ancien prix)\s+(\d{3,9})/.exec(t); if (barre && +barre[1] > (r.prix || 0)) r.prix_barre = +barre[1];
    // Stock
    const st = /(?:il (?:en )?reste|reste|stock(?: de)?|j'en ai|en stock|disponibles?|quantité)\s*:?\s*(\d{1,4})\b/.exec(t) || /\b(\d{1,4})\s*(?:pièces?|exemplaires?|articles?|paires?|unités?|en stock|disponibles?)\b/.exec(t);
    if (st) r.stock = +st[1];
    // Tailles
    const tm = /(?:tailles?|pointures?)\s*:?\s*(?:du\s+(\d{2})\s+au\s+(\d{2})|((?:[a-z0-9.,]+(?:\s*(?:,|et|-|\/)\s*|\s+))*[a-z0-9.,]+))/.exec(t);
    if (tm) {
      if (tm[1] && tm[2]) { const a = +tm[1], b = +tm[2]; if (b >= a && b - a <= 15) r.tailles = Array.from({ length: b - a + 1 }, (_, i) => a + i).join(', '); }
      else {
        const toks = []; for (const w of tm[3].split(/\s*(?:,|\bet\b|-|\/|\s)\s*/)) { if (!w) continue; if (TAILLE_TOK.test(w)) toks.push(/^\d/.test(w) ? w : w.toUpperCase()); else break; }
        if (toks.length) r.tailles = toks.join(', ');
      }
    }
    // Rayon et type
    for (const k of KW) { if (k[0].test(t)) { r.categorie = k[1]; r.type = k[2]; break; } }
    // Couleur
    const coul = COULEURS.find(c => new RegExp('(?<![\\p{L}])' + c + 's?(?![\\p{L}])', 'u').test(t)); if (coul) r.couleur = coul;
    // Nom : le début de la phrase, avant le prix, la taille ou le stock
    const NW = '(?:' + Object.keys(U).concat(['cents?', 'milles?', 'millions?', 'et']).join('|') + ')';
    const cuts = [
      new RegExp('(?:\\s(?:à|a|pour|prix)\\s+)?(?:\\d[\\d \\u202f\\u00a0.,]*|(?:' + NW + '[\\s-]*)+)\\s*(?:francs?|f(?![\\p{L}])|fcfa|cfa|balles|frs?|mille|k(?![\\p{L}]))', 'iu'),
      R(/\s(?:tailles?|pointures?|il en reste|reste|stock|au lieu)\b/i), /\s(?:à|a|pour|prix)\s+\d/i, /[,;.!?]/];
    let cut = raw.length; for (const c of cuts) { const m = c.exec(raw); if (m && m.index < cut) cut = m.index; }
    let nom = raw.slice(0, cut);
    for (let i = 0; i < 4; i++) nom = nom.replace(FILLER, '');
    nom = nom.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (nom.length < 2) nom = r.type ? r.type.replace(/s( |$)/, '$1') : '';
    if (nom) r.nom = /^[a-z][A-Z]/.test(nom) ? nom : nom.charAt(0).toUpperCase() + nom.slice(1);
    const desc = raw.replace(/\s+/g, ' ').trim();
    if (desc.length > (r.nom || '').length + 3) r.description = desc.charAt(0).toUpperCase() + desc.slice(1) + (/[.!?]$/.test(desc) ? '' : '.');
    return r;
  }

  const api = { parse, normalise, wordsToNum };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GbVoix = api;
})(typeof window !== 'undefined' ? window : this);
