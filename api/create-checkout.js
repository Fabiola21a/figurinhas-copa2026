export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const { amount, description, nome, email, telefone, itens } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ error: 'Valor invalido' });

  const BASE_URL = 'https://figurinhas-copa2026-seven.vercel.app';
  const itensParam = (itens || ['principal']).join(',');
  const nomeParam = encodeURIComponent(nome || '');
  const emailParam = encodeURIComponent(email || '');

  const headers = {
    'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // Passo 1: Criar ou recuperar cliente
    let customerId = null;
    try {
      const custRes = await fetch('https://api.abacatepay.com/v2/customers/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: nome || 'Cliente',
          email: email,
          cellphone: telefone ? telefone.replace(/\D/g, '') : undefined,
          taxId: undefined
        })
      });
      const custJson = await custRes.json();
      console.log('Cliente:', JSON.stringify(custJson));
      if (custJson.data?.id) customerId = custJson.data.id;
    } catch(e) {
      console.log('Erro ao criar cliente (ignorando):', e.message);
    }

    // Passo 2: Criar produto
    const prodRes = await fetch('https://api.abacatepay.com/v2/products/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        externalId: `kit-${Date.now()}`,
        name: description || 'Kit Figurinhas Copa 2026',
        price: Number(amount),
        currency: 'BRL'
      })
    });
    const prodJson = await prodRes.json();
    console.log('Produto:', JSON.stringify(prodJson));
    if (!prodRes.ok || !prodJson.data?.id) {
      return res.status(500).json({ error: 'Produto: ' + JSON.stringify(prodJson) });
    }

    // Passo 3: Criar checkout com customerId para pré-preencher dados
    const checkoutBody = {
      items: [{ id: prodJson.data.id, quantity: 1 }],
      methods: ['PIX'],
      completionUrl: `${BASE_URL}/entrega.html?nome=${nomeParam}&email=${emailParam}&itens=${itensParam}`,
      returnUrl: `${BASE_URL}/`
    };
    if (customerId) checkoutBody.customerId = customerId;

    const checkoutRes = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
      method: 'POST',
      headers,
      body: JSON.stringify(checkoutBody)
    });
    const checkoutJson = await checkoutRes.json();
    console.log('Checkout:', JSON.stringify(checkoutJson));

    if (!checkoutRes.ok || !checkoutJson.data?.url) {
      return res.status(500).json({ error: 'Checkout: ' + JSON.stringify(checkoutJson) });
    }

    return res.status(200).json({ url: checkoutJson.data.url });

  } catch (err) {
    console.error('Erro geral:', err);
    return res.status(500).json({ error: err.message });
  }
}
