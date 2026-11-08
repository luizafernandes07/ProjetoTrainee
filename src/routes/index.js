const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const cepController = require('../controllers/cepController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

const produtoRoutes = require('./produtoRoutes');
const vendaRoutes = require('./vendaRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const movimentacaoRoutes = require('./movimentacaoRoutes');

// Autenticação e integração externa.
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/cep/:cep', cepController.consultarCep);

// Catálogo e vendas possuem regras de acesso próprias nos respectivos roteadores.
router.use('/produtos', produtoRoutes);
router.use('/vendas', vendaRoutes);
router.use('/usuarios', usuarioRoutes);

// Todo o recurso financeiro é restrito a administradores.
router.use('/movimentacoes', autenticar, autorizar('ADMIN'), movimentacaoRoutes);

module.exports = router;
