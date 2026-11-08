const express = require('express');
const router = express.Router();
const cepController = require('../controllers/cepController');

// Permite consultar o CEP livremente (ou adicione o middleware de auth se preferir)
router.get('/:cep', cepController.consultarCep);

module.exports = router;