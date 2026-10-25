const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

router.use(autenticar);

router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.buscarProdutoPorId);

// Operações restritas a Administradores
router.post('/', autorizar('ADMIN'), produtoController.criarProduto);
router.put('/:id', autorizar('ADMIN'), produtoController.atualizarProduto);
router.delete('/:id', autorizar('ADMIN'), produtoController.deletarProduto);

module.exports = router;