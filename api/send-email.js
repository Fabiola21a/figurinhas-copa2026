export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { nome, email, itens } = req.body;
  if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

  const LINKS = {
    principal: 'https://drive.google.com/drive/folders/1IvOwUSFoD3OkpHVTcr7iuTPgx8XrCb6j?usp=drive_link',
    neymar: 'https://drive.google.com/drive/folders/1t6egX7m-6bP3I08-5mlHOqVkBhp31HG4?usp=drive_link',
    gold: 'https://drive.google.com/drive/folders/1At2FF0b8fMaJerjN9iKFGO-rhJotSHbl?usp=drive_link',
    cartela: 'https://drive.google.com/drive/folders/1MAd00A-mElCaN_Wj35C41HL5a0YyS6T7?usp=drive_link'
  };

  const itensHtml = itens.map(item => {
    const link = LINKS[item.key];
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #1e2a3a">
          <strong style="color:#fff;font-size:15px">${item.nome}</strong><br>
          <a href="${link}" style="color:#F5C518;font-size:13px;text-decoration:none">📂 Clique aqui para acessar →</a>
        </td>
      </tr>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#05080D;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 20px">
    <tr><td style="text-align:center;padding-bottom:32px">
      <div style="font-size:42px">⚽</div>
      <h1 style="color:#F5C518;font-size:28px;margin:8px 0 4px">Seu kit está pronto!</h1>
      <p style="color:#8A9BB0;font-size:15px;margin:0">Kit Figurinhas Copa 2026</p>
    </td></tr>
    <tr><td style="background:#0C1219;border-radius:16px;padding:28px">
      <p style="color:#fff;font-size:16px;margin:0 0 8px">Olá, <strong>${nome || 'colecionador'}</strong>! 👋</p>
      <p style="color:#8A9BB0;font-size:14px;margin:0 0 24px;line-height:1.6">
        Pagamento confirmado! Acesse seus materiais abaixo. Caso tenha dúvidas, entre em contato pelo WhatsApp: <strong style="color:#fff">(11) 96784-3773</strong>
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itensHtml}
      </table>
    </td></tr>
    <tr><td style="padding:24px 0;text-align:center">
      <p style="color:#8A9BB0;font-size:13px;margin:0 0 8px">Precisa de ajuda?</p>
      <a href="https://wa.me/5511967843773" style="display:inline-block;background:#25D366;color:#fff;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:50px;text-decoration:none">
        💬 WhatsApp Suporte
      </a>
    </td></tr>
    <tr><td style="text-align:center;padding-top:16px">
      <p style="color:#333;font-size:12px">© 2026 Kit Figurinhas Copa 2026</p>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Kit Figurinhas Copa 2026 <onboarding@resend.dev>',
        to: [email],
        subject: '⚽ Seu Kit de Figurinhas da Copa 2026 chegou!',
        html
      })
    });
    const data = await r.json();
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
