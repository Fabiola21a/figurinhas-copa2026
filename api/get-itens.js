const cache = global._wiapyCache || (global._wiapyCache = {});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { email, nome, itens, sellId } = req.body || {};
    if (!email && !sellId) return res.status(400).json({ error: 'Email ou sellId obrigatorio' });
    const dados = { nome, itens, ts: Date.now() };
    if (email) cache[email.toLowerCase()] = dados;
    if (sellId) cache['sell_' + sellId] = dados;
    return res.status(200).json({ ok: true });
  }

  // GET: buscar por sellId primeiro, depois por email
  const sellId = req.query.sellId || req.query.wiapy_sell || '';
  const email  = (req.query.email || '').toLowerCase();

  let dados = null;
  if (sellId && sellId !== 'undefined') dados = cache['sell_' + sellId];
  if (!dados && email) dados = cache[email];

  if (!dados) {
    return res.status(200).json({ found: false, itens: ['principal'], nome: '' });
  }

  return res.status(200).json({ found: true, itens: dados.itens, nome: dados.nome });
}
