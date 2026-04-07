const crypto = require('crypto');

function makeToken(secret) {
  return crypto.createHmac('sha256', secret).update('mino-auth-v1').digest('base64');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `mino_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const correct = process.env.MINO_PASSWORD;
  const secret  = process.env.MINO_SECRET;

  if (!correct || !secret) {
    return res.status(500).json({ error: 'Serveur non configuré' });
  }
  if (!password || password !== correct) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  const token = makeToken(secret);
  const maxAge = 60 * 60 * 24; // 1 jour

  res.setHeader('Set-Cookie',
    `mino_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
  );
  res.status(200).json({ ok: true });
};
