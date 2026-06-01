const SUPA_URL = "https://ezdssuwtfpaptszkboeo.supabase.co";
const SUPA_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { email, nome, itens, sellId } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email obrigatorio' });
    const r = await fetch(`${SUPA_URL}/rest/v1/kit_orders`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.toLowerCase(), nome, itens, payment_id: sellId })
    });
    console.log('Supabase insert:', r.status);
    return res.status(200).json({ ok: true });
  }

  const email = (req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

  const r = await fetch(
    `${SUPA_URL}/rest/v1/kit_orders?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`,
    { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` } }
  );
  const rows = await r.json();
  if (!rows || rows.length === 0) {
    return res.status(200).json({ found: false, itens: ['principal'], nome: '' });
  }
  return res.status(200).json({ found: true, itens: rows[0].itens, nome: rows[0].nome });
}
