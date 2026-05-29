export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID obrigatório' });

  try {
    const response = await fetch(`https://api.abacatepay.com/v2/transparents/check?id=${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }

    return res.status(200).json({
      status: data.data.status,
      paid: data.data.status === 'PAID'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
