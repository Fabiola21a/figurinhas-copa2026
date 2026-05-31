export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const { nome, email, itens } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

  const LINKS = {
    principal: 'https://drive.google.com/drive/folders/1IvOwUSFoD3OkpHVTcr7iuTPgx8XrCb6j?usp=drive_link',
    neymar:    'https://drive.google.com/drive/folders/1t6egX7m-6bP3I08-5mlHOqVkBhp31HG4?usp=drive_link',
    gold:      'https://drive.google.com/drive/folders/1At2FF0b8fMaJerjN9iKFGO-rhJotSHbl?usp=drive_link',
    cartela:   'https://drive.google.com/drive/folders/1MAd00A-mElCaN_Wj35C41HL5a0YyS6T7?usp=drive_link',
  };

  const itensArray = Array.isArray(itens) ? itens : [];

  const linksHtml = itensArray.map(item => {
    const key       = typeof item === 'string' ? item : item.key;
    const nomeItem  = typeof item === 'string' ? key  : (item.nome || key);
    const link      = LINKS[key] || '#';
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

  // Tenta Brevo primeiro (BREVO_API_KEY no Vercel), depois Resend como fallback
  const BREVO_KEY  = process.env.BREVO_API_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;

  if (BREVO_KEY) {
    // Brevo Transactional Email API — aceita qualquer destinatario sem dominio proprio
    try {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender:  { name: 'Kit Figurinhas Copa 2026', email: 'tikflow.assets@gmail.com' },
          to:      [{ email }],
          subject: '⚽ Seu Kit de Figurinhas da Copa 2026 chegou!',
          htmlContent: htmlBody,
        }),
      });
      const data = await r.json();
      console.log('Brevo response:', JSON.stringify(data));
      if (!r.ok) throw new Error(data?.message || JSON.stringify(data));
      return res.status(200).json({ ok: true, provider: 'brevo', messageId: data.messageId });
    } catch (err) {
      console.error('Brevo error, tentando Resend:', err.message);
      // fallthrough para Resend
    }
  }

  if (RESEND_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    'Kit Figurinhas Copa 2026 <onboarding@resend.dev>',
          to:      [email],
          subject: '⚽ Seu Kit de Figurinhas da Copa 2026 chegou!',
          html:    htmlBody,
        }),
      });
      const data = await r.json();
      console.log('Resend response:', JSON.stringify(data));
      if (!r.ok) throw new Error(data?.message || JSON.stringify(data));
      return res.status(200).json({ ok: true, provider: 'resend', id: data.id });
    } catch (err) {
      console.error('Resend error:', err.message);
      return res.status(500).json({ error: err.message, provider: 'resend' });
    }
  }

  return res.status(500).json({ error: 'Nenhuma chave de email configurada (BREVO_API_KEY ou RESEND_API_KEY)' });
}
