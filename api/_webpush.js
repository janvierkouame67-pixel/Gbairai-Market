// Envoi de notifications Web Push sans bibliothèque externe (RFC 8291 + VAPID RFC 8292).
const crypto = require('crypto');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();

function encrypt(payload, p256dh, authSecret) {
  const ua = unb64u(p256dh), auth = unb64u(authSecret);
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const asPub = ecdh.getPublicKey();
  const secret = ecdh.computeSecret(ua);
  const ikm = hmac(hmac(auth, secret), Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub, Buffer.from([1])]));
  const salt = crypto.randomBytes(16);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}

function vapidHeader(endpoint, pub, priv, subject) {
  const p = unb64u(pub);
  const key = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: b64u(unb64u(priv)), x: b64u(p.subarray(1, 33)), y: b64u(p.subarray(33, 65)) }, format: 'jwk' });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + pub;
}

// Renvoie le code HTTP du service de push (201 = envoyé, 404/410 = abonnement à supprimer)
async function sendPush(sub, data, keys) {
  const body = encrypt(JSON.stringify(data), sub.p256dh, sub.auth);
  const r = await fetch(sub.endpoint, { method: 'POST', body, headers: {
    'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'normal',
    Authorization: vapidHeader(sub.endpoint, keys.pub, keys.priv, keys.subject || 'https://gbairai-market.vercel.app') } });
  return r.status;
}
module.exports = { sendPush, encrypt, vapidHeader, b64u, unb64u };
