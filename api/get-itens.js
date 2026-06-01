const SUPABASE_URL = process.env.SUPABASE_URL || "https://rzvcxrftygrddxfjmmqy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { email, nome, itens, sellId } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/figurinhas_orders`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ email: email.toLowerCase(), nome, itens, payment_id: sellId })
    });
    const data = await r.text();
    console.log('Supabase insert:', r.status, data);
    return res.status(200).json({ ok: true });
  }

  // GET
  const email = (req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/figurinhas_orders?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = await r.json();
  if (!rows || rows.length === 0) {
    return res.status(200).json({ found: false, itens: ['principal'], nome: '' });
  }
  return res.status(200).json({ found: true, itens: rows[0].itens, nome: rows[0].nome });
}
