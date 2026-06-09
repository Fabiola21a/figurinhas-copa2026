const SUPA_URL = "https://ezdssuwtfpaptszkboeo.supabase.co";

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const WEBHOOK_TOKEN = process.env.WIAPY_WEBHOOK_TOKEN;
  if (WEBHOOK_TOKEN) {
    const auth = req.headers['authorization'] || '';
    if (auth !== WEBHOOK_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  }

  const body     = req.body || {};
  const payment  = body.payment  || {};
  const customer = body.customer || {};
  const checkout = body.checkout || {};
  const products = body.products || [];

  console.log('Wiapy webhook:', JSON.stringify(body));

  if (payment.status !== 'paid') {
    return res.status(200).json({ ok: true, skipped: true, status: payment.status });
  }

  const nome   = customer.name  || '';
  const email  = customer.email || '';
  const sellId = payment.id || '';

  if (!email) return res.status(200).json({ ok: true, warning: 'Email ausente' });

  const MAPA = {
    principal: ['kit', 'principal', 'completo', 'copa 2026', 'figurinhas copa'],
    neymar:    ['neymar'],
    gold:      ['gold', 'raras', 'dourada'],
    cartela:   ['cartela', 'corte', 'alinhada'],
  };

  function detectar(titulo) {
    if (!titulo) return null;
    const t = titulo.toLowerCase();
    for (const [chave, palavras] of Object.entries(MAPA)) {
      if (palavras.some(p => t.includes(p))) return chave;
    }
    return null;
  }

  const NOMES = {
    principal: 'Kit Completo Premium Copa 2026',
    neymar:    'Figurinha Premium Neymar',
    gold:      'Sticker Gold Raras 2026',
    cartela:   'Cartelas de Corte',
  };

  const LINKS = {
    principal: 'https://drive.google.com/drive/folders/1IvOwUSFoD3OkpHVTcr7iuTPgx8XrCb6j?usp=drive_link',
    neymar:    'https://drive.google.com/drive/folders/1t6egX7m-6bP3I08-5mlHOqVkBhp31HG4?usp=drive_link',
    gold:      'https://drive.google.com/drive/folders/1At2FF0b8fMaJerjN9iKFGO-rhJotSHbl?usp=drive_link',
    cartela:   'https://drive.google.com/drive/folders/1MAd00A-mElCaN_Wj35C41HL5a0YyS6T7?usp=drive_link',
  };

  // products[] = produtos efetivamente COMPRADOS (a doc do Wiapy confirma que inclui orderbumps adquiridos).
  // checkout.orderbump[] = order bumps OFERECIDOS na tela, comprados ou nao -> NAO usar pra liberar acesso.
  const comprados = Array.isArray(products) ? products : [];
  console.log('COMPRADOS:', comprados.map(p => `${p.title} [${p.id}]`).join(' | ') || '(products vazio)');

  // Mapa por ID do Wiapy (a prova de falha). Preencher com os ids reais de products[].id:
  const MAPA_ID = {
    // 'id-do-produto-principal': 'principal',
    // 'id-do-orderbump-neymar': 'neymar',
    // 'id-do-orderbump-gold':   'gold',
    // 'id-da-cartela':          'cartela',
  };

  const itensSet = new Set(['principal']);
  for (const p of comprados) {
    const porId = MAPA_ID[p.id];
    const k = porId || detectar(p.title); // ID primeiro; titulo so como fallback
    if (k) itensSet.add(k);
  }
  const itens = [...itensSet];

  // Salvar no Supabase
  const SUPA_KEY = process.env.SUPABASE_ANON_KEY;
  try {
    const sr = await fetch(`${SUPA_URL}/rest/v1/kit_orders`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.toLowerCase(), nome, itens, payment_id: sellId })
    });
    console.log('Supabase insert status:', sr.status, 'email:', email, 'itens:', itens);
  } catch(e) {
    console.error('Erro Supabase:', e.message);
  }

  // Montar email HTML
  const linksHtml = itens.map(key => {
    const link     = LINKS[key] || '#';
    const nomeItem = NOMES[key] || key;
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #1e2a3a;">
          <strong style="color:#ffffff;font-size:15px;display:block;margin-bottom:8px;">${nomeItem}</strong>
          <a href="${link}" style="display:inline-block;background:#F5C518;color:#000;font-weight:700;
             font-size:13px;padding:9px 20px;border-radius:6px;text-decoration:none;">
            📂 Acessar no Google Drive →
          </a>
        </td>
      </tr>`;
  }).join('');

  const htmlBody = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#05080D;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="text-align:center;padding-bottom:28px;">
          <div style="font-size:52px;">⚽</div>
          <h1 style="color:#F5C518;font-size:26px;margin:8px 0 4px;font-weight:800;">Seu Kit chegou!</h1>
          <p style="color:#8A9BB0;font-size:14px;margin:0;">Kit Figurinhas Copa 2026</p>
        </td></tr>
        <tr><td style="background:#0C1219;border-radius:16px;padding:28px;border:1px solid #1e2a3a;">
          <p style="color:#fff;font-size:16px;margin:0 0 8px;">Olá, <strong>${nome || 'colecionador'}</strong>! 👋</p>
          <p style="color:#8A9BB0;font-size:14px;margin:0 0 24px;line-height:1.7;">
            Pagamento confirmado! Acesse seus materiais abaixo.<br>
            Dúvidas? WhatsApp: <strong style="color:#fff;">(11) 93622-7155</strong>
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">${linksHtml}</table>
        </td></tr>
        <tr><td style="padding:24px 0;text-align:center;">
          <a href="https://wa.me/5511936227155"
             style="display:inline-block;background:#25D366;color:#fff;font-size:14px;
                    font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none;">
            💬 Falar no WhatsApp
          </a>
        </td></tr>
        <tr><td style="text-align:center;">
          <p style="color:#333;font-size:12px;margin:0;">© 2026 Kit Figurinhas Copa 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'Kit Figurinhas Copa 2026', email: 'tikflow.assets@gmail.com' },
        to:          [{ email }],
        subject:     '⚽ Seu Kit de Figurinhas da Copa 2026 chegou!',
        htmlContent: htmlBody,
      }),
    });
    const data = await r.json();
    console.log('Email enviado:', email, JSON.stringify(data));
    return res.status(200).json({ ok: true, email, itens, messageId: data.messageId });
  } catch (err) {
    console.error('Erro email:', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
