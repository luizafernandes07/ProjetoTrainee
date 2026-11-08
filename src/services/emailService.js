const nodemailer = require('nodemailer');

function criarTransportador() {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
  const user = process.env.MAIL_USER || process.env.SMTP_USER;
  const pass = String(process.env.MAIL_PASS || process.env.SMTP_PASS || '').replace(/\s/g, '');
  const secure = String(process.env.MAIL_SECURE ?? process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';
  if (!host || !user || !pass) throw new Error('SMTP não configurado. Defina MAIL_HOST, MAIL_USER e MAIL_PASS.');
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

exports.enviarEmailRecuperacao = async ({ destinatario, nome, token }) => {
  const transporter = criarTransportador();
  const from = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.MAIL_USER || process.env.SMTP_USER;
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5180').replace(/\/$/, '');
  const link = `${frontend}/redefinir-senha?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from, to: destinatario, subject: 'Redefinição de senha | AgnusGestão',
    text: `Olá, ${nome}!\n\nPara criar uma nova senha, acesse: ${link}\n\nO link expira em 30 minutos. Se você não solicitou esta alteração, ignore esta mensagem.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#342326"><div style="background:#4a0e17;padding:24px;border-radius:14px;color:#fff8ed"><h1 style="margin:0;color:#dfbd78">AgnusGestão</h1><p>Recuperação de acesso</p></div><h2>Olá, ${String(nome).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}!</h2><p>Recebemos uma solicitação para redefinir a senha da sua conta.</p><p style="margin:28px 0"><a href="${link}" style="background:#4a0e17;color:white;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Criar nova senha</a></p><p>Este link é válido por <strong>30 minutos</strong> e só pode ser utilizado uma vez.</p><p>Se você não solicitou a recuperação, ignore este e-mail.</p></div>`
  });
};

