export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const { amount, description } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ error: 'Valor inválido' });
  try {
    const response = await fetch('https://api.abacatepay.com/v2/transparents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: { amount, description: description || 'Kit Figurinhas Copa 2026', expiresIn: 3600 } })
    });
    const data = await response.json();
    if (!response.ok || !data.success) return res.status(500).json({ error: data.error || 'Erro ao criar cobrança' });
    return res.status(200).json({ id: data.data.id, brCode: data.data.brCode, qrCodeImg: data.data.brCodeBase64 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
