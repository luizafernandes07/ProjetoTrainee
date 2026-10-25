const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');

// Importa a função 'autenticar' exportada no seu middleware
const { autenticar } = require('../middlewares/authMiddleware');

// Aplica o middleware de autenticação JWT em todas as rotas de vendas
router.use(autenticar);

// Rotas de Vendas
router.post('/', vendaController.realizarVenda);
router.get('/', vendaController.listarVendas);
router.get('/:id', vendaController.buscarPorId); // Rota para buscar venda por ID

module.exports = router;