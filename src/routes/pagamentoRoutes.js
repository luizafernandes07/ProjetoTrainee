const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

// O endpoint valida a assinatura e consulta o pagamento diretamente no Mercado Pago.
router.post('/mercadopago/webhook', pagamentoController.webhookMercadoPago);

module.exports = router;
