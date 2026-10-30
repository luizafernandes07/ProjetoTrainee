const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

router.use(autenticar);
router.post('/presencial', autorizar('VOLUNTARIO', 'ADMIN'), vendaController.criarVendaPresencial);
router.post('/online', vendaController.criarVendaOnline);
router.get('/', vendaController.listarVendas);
router.get('/:id', vendaController.buscarPorId);

module.exports = router;
