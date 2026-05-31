// Cache em memória (persiste enquanto a função serverless estiver quente)
// A Wiapy webhook salva aqui, a entrega.html busca aqui
const cache = global._wiapyCache || (global._wiapyCache = {});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: salvar itens (chamado pelo webhook)
  if (req.method === 'POST') {
    const { email, nome, itens } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email obrigatorio' });
    cache[email.toLowerCase()] = { nome, itens, ts: Date.now() };
    return res.status(200).json({ ok: true });
  }

  // GET: buscar itens pelo email
  const email = (req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

  const dados = cache[email];
  if (!dados) {
    // Nao encontrou — retorna só o principal como fallback
    return res.status(200).json({ found: false, itens: ['principal'], nome: '' });
  }

  return res.status(200).json({ found: true, itens: dados.itens, nome: dados.nome });
}
