const logs = global._debugLogs || (global._debugLogs = []);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    return res.status(200).json({ count: logs.length, logs: logs.slice(-3) });
  }

  if (req.method === 'POST') {
    const entry = { ts: new Date().toISOString(), body: req.body };
    logs.push(entry);
    if (logs.length > 5) logs.shift();
    // Logar TUDO no console do Vercel
    console.log('WIAPY_PAYLOAD:', JSON.stringify(req.body, null, 2));
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
