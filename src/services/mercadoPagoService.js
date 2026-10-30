const axios = require('axios');

const API_URL = 'https://api.mercadopago.com';

const obterToken = () => {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    const error = new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
    error.status = 503;
    throw error;
  }
  return token;
};

exports.criarPagamentoPix = async ({ venda, email }) => {
  const notificationUrl = process.env.MERCADOPAGO_NOTIFICATION_URL;
  const payload = {
    transaction_amount: Number(venda.valor_total),
    description: `Pedido Agnus Gestão #${venda.id}`,
    payment_method_id: 'pix',
    payer: { email },
    external_reference: String(venda.id),
  };

  if (notificationUrl) payload.notification_url = notificationUrl;

  const response = await axios.post(`${API_URL}/v1/payments`, payload, {
    headers: {
      Authorization: `Bearer ${obterToken()}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': String(venda.id),
    },
    timeout: 20000,
  });

  const dados = response.data;
  const transacao = dados.point_of_interaction?.transaction_data || {};

  return {
    id: String(dados.id),
    status: dados.status,
    qr_code: transacao.qr_code || null,
    qr_code_base64: transacao.qr_code_base64 || null,
    ticket_url: transacao.ticket_url || null,
  };
};

exports.buscarPagamento = async (paymentId) => {
  const response = await axios.get(`${API_URL}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${obterToken()}` },
    timeout: 15000,
  });
  return response.data;
};
