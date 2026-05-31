export default async function handler(req, res) {
  // A Wiapy faz POST aqui quando o pagamento é confirmado
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  // Verificar token de autorização cadastrado na Wiapy
  const WEBHOOK_TOKEN = process.env.WIAPY_WEBHOOK_TOKEN;
  if (WEBHOOK_TOKEN) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== WEBHOOK_TOKEN) {
      console.warn('Webhook: token invalido —', authHeader);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const body = req.body || {};
  console.log('Wiapy webhook recebido:', JSON.stringify(body));

  const payment  = body.payment  || {};
  const customer = body.customer || {};
  const checkout = body.checkout || {};
  const products = body.products || [];

  // Só processar pagamentos aprovados
  if (payment.status !== 'paid') {
    console.log('Ignorando status:', payment.status);
    return res.status(200).json({ ok: true, skipped: true, status: payment.status });
  }

  const nome  = customer.name  || '';
  const email = customer.email || '';

  if (!email) {
    console.warn('Webhook: email do cliente ausente');
    return res.status(200).json({ ok: true, warning: 'Email ausente, nao foi possivel enviar' });
  }

  // Mapear produtos comprados para as chaves internas (principal, neymar, gold, cartela)
  // Você define o tipo do produto no Wiapy como "Externo" com o nome contendo a chave
  // OU usamos o título para detectar qual produto é
  const MAPA_PRODUTOS = {
    'principal': ['kit', 'principal', 'completo', 'copa 2026'],
    'neymar':    ['neymar'],
    'gold':      ['gold', 'raras', 'dourada'],
    'cartela':   ['cartela', 'corte', 'alinhada'],
  };

  function detectarChave(titulo) {
    if (!titulo) return null;
    const t = titulo.toLowerCase();
    for (const [chave, palavras] of Object.entries(MAPA_PRODUTOS)) {
      if (palavras.some(p => t.includes(p))) return chave;
    }
    return null;
  }

  // Montar lista de itens comprados
  let itens = [];

  // Produto principal sempre incluso
  itens.push({ key: 'principal', nome: 'Kit Completo Premium Copa 2026' });

  // Orderbumps do checkout
  const orderbumps = checkout.orderbump || [];
  for (const ob of orderbumps) {
    const chave = detectarChave(ob.title);
    if (chave && chave !== 'principal' && !itens.find(i => i.key === chave)) {
      itens.push({ key: chave, nome: ob.title });
    }
  }

  // Produtos adicionais detectados
  for (const prod of products) {
    const chave = detectarChave(prod.title);
    if (chave && !itens.find(i => i.key === chave)) {
      itens.push({ key: chave, nome: prod.title });
    }
  }

  console.log('Disparando email para:', email, '| Itens:', itens.map(i => i.key).join(','));

  // Chamar send-email internamente
  try {
    const BASE_URL = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://kitfigurinhas-copa2026.vercel.app';

    const emailRes = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, itens }),
    });

    const emailData = await emailRes.json();
    console.log('Email resultado:', JSON.stringify(emailData));

    return res.status(200).json({
      ok: true,
      email_enviado: email,
      itens: itens.map(i => i.key),
      email_result: emailData,
    });

  } catch (err) {
    console.error('Erro ao enviar email via webhook:', err);
    // Retornar 200 para a Wiapy não retentar infinitamente
    return res.status(200).json({ ok: false, error: err.message });
  }
}
