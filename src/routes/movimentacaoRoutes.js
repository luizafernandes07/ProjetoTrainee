const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

// Todas as rotas de movimentação exigem login
router.use(autenticar);

// Exportar relatório (Excel ou CSV) - Exclusivo ADMIN
router.get('/exportar', autorizar('ADMIN'), movimentacaoController.exportarRelatorio);

// Resumo do caixa (totais e saldo atual)
router.get('/resumo', movimentacaoController.obterResumoCaixa);

// Listar histórico de caixa
router.get('/', movimentacaoController.listarMovimentacoes);

// Criar movimentação manual - Exclusivo ADMIN
router.post('/', autorizar('ADMIN'), movimentacaoController.criarMovimentacao);

// Excluir movimentação - Exclusivo ADMIN
router.delete('/:id', autorizar('ADMIN'), movimentacaoController.excluirMovimentacao);

module.exports = router;