const { kv } = require('@vercel/kv');

const KEYS = { snake: 'mino_scores', shooter: 'mino_shooter_scores' };
const getKey = (req) => KEYS[req.query?.game] || KEYS.snake;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const KEY = getKey(req);
    const scores = await kv.hgetall(KEY) || {};
    return res.json(scores);
  }

  if (req.method === 'POST') {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'name and score required' });
    }
    const KEY = getKey(req);
    const current = (await kv.hget(KEY, name)) || 0;
    if (score > current) {
      await kv.hset(KEY, { [name]: score });
    }
    const scores = await kv.hgetall(KEY) || {};
    return res.json(scores);
  }

  res.status(405).end();
};
