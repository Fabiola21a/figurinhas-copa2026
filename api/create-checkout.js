export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const { amount, description, nome, email, itens } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ error: 'Valor invalido' });

  const BASE_URL = 'https://figurinhas-copa2026-seven.vercel.app';
  const itensParam = (itens || ['principal']).join(',');
  const nomeParam = encodeURIComponent(nome || '');
  const emailParam = encodeURIComponent(email || '');

  try {
    // Passo 1: Criar produto com o valor exato
    const prodRes = await fetch('https://api.abacatepay.com/v2/products/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        externalId: `kit-${Date.now()}`,
        name: description || 'Kit Figurinhas Copa 2026',
        price: Number(amount),
        currency: 'BRL'
      })
    });

    const prodJson = await prodRes.json();
    if (!prodRes.ok || !prodJson.data?.id) {
      return res.status(500).json({ error: 'Produto: ' + JSON.stringify(prodJson) });
    }

    // Passo 2: Criar checkout
    const checkoutRes = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ id: prodJson.data.id, quantity: 1 }],
        methods: ['PIX'],
        completionUrl: `${BASE_URL}/entrega.html?nome=${nomeParam}&email=${emailParam}&itens=${itensParam}`,
        returnUrl: `${BASE_URL}/`
      })
    });

    const checkoutJson = await checkoutRes.json();
    if (!checkoutRes.ok || !checkoutJson.data?.url) {
      return res.status(500).json({ error: 'Checkout: ' + JSON.stringify(checkoutJson) });
    }

    return res.status(200).json({ url: checkoutJson.data.url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
