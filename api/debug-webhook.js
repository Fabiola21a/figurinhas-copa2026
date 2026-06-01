// Endpoint de debug — captura e armazena o payload da Wiapy
const logs = global._debugLogs || (global._debugLogs = []);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') {
    return res.status(200).json({ logs: logs.slice(-5) });
  }
  if (req.method === 'POST') {
    logs.push({ ts: new Date().toISOString(), headers: req.headers, body: req.body });
    if (logs.length > 10) logs.shift();
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
