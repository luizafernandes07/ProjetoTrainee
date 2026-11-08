const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

router.use(autenticar);

// Clientes só podem consultar as próprias compras e criar pedidos online.
router.post('/online', autorizar('CLIENTE'), vendaController.criarVendaOnline);
router.get('/minhas-compras', autorizar('CLIENTE'), vendaController.minhasCompras);

// PDV: ADMIN e VOLUNTARIO podem registrar vendas presenciais.
router.post('/presencial', autorizar('VOLUNTARIO', 'ADMIN'), vendaController.criarVendaPresencial);

// Consultas gerais, detalhes, alteração de status e cancelamento são administrativas.
router.get('/', autorizar('ADMIN'), vendaController.listarVendas);
router.get('/:id', autorizar('ADMIN'), vendaController.buscarPorId);
router.patch('/:id/status', autorizar('ADMIN'), vendaController.atualizarStatusVenda);
router.delete('/:id', autorizar('ADMIN'), vendaController.cancelarVenda);

module.exports = router;
