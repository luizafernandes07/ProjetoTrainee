const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

// Exige autenticação para todas as rotas financeiras
router.use(autenticar);

// GET /movimentacoes/exportar?formato=excel (ou ?formato=csv) - Exclusivo ADMIN
router.get('/exportar', autorizar('ADMIN'), movimentacaoController.exportarRelatorio);

// GET /movimentacoes - Listar histórico de caixa
router.get('/', autorizar('ADMIN'), movimentacaoController.listarMovimentacoes);

// POST /movimentacoes - Lançamento manual (Exclusivo ADMIN)
router.post('/', autorizar('ADMIN'), movimentacaoController.criarMovimentacao);

// DELETE /movimentacoes/:id - Estorno/Exclusão (Exclusivo ADMIN)
router.delete('/:id', autorizar('ADMIN'), movimentacaoController.excluirMovimentacao);

module.exports = router;