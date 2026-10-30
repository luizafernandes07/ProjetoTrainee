const nodemailer = require('nodemailer');

const criarTransportador = () => {
  // Suporta tanto o padrão SMTP_* quanto MAIL_*
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = process.env.SMTP_PORT || process.env.MAIL_PORT || 587;
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;
  const secure = process.env.SMTP_SECURE || process.env.MAIL_SECURE;

  if (!host || !user || !pass) {
    throw new Error('Configuração SMTP incompleta. Configure SMTP_HOST, SMTP_USER e SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: String(secure).toLowerCase() === 'true', // false para porta 587 (TLS explícito)
    auth: { user, pass },
  });
};

exports.enviarEmailRecuperacao = async ({ destinatario, nome, token }) => {
  const transportador = criarTransportador();
  const origem = process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || process.env.MAIL_USER;
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // URL da rota do React no frontend com o token em parâmetro
  const link = `${frontend}/redefinir-senha?token=${encodeURIComponent(token)}`;

  await transportador.sendMail({
    from: origem,
    to: destinatario,
    subject: 'Recuperação de senha - Agnus Gestão',
    text: `Olá, ${nome}.\n\nPara redefinir sua senha, acesse o link: ${link}\n\nEste link expira em 30 minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Recuperação de Senha - Agnus Gestão</h2>
        <p>Olá, <strong>${nome}</strong>.</p>
        <p>Recebemos uma solicitação para redefinir a sua senha.</p>
        <p style="margin: 20px 0;">
          <a href="${link}" target="_blank" style="background-color: #5C1D24; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Redefinir Senha
          </a>
        </p>
        <p><small>Ou copie e cole este link no seu navegador: <br><a href="${link}">${link}</a></small></p>
        <p><em>Este link é válido por 30 minutos. Se você não solicitou, ignore este e-mail.</em></p>
      </div>
    `,
  });
};