const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

router.use(autenticar, autorizar('ADMIN'));
router.get('/', usuarioController.listarUsuarios);
router.get('/:id', usuarioController.buscarUsuarioPorId);
router.post('/', usuarioController.criarUsuario);
router.put('/:id', usuarioController.atualizarUsuario);
router.delete('/:id', usuarioController.desativarUsuario);

module.exports = router;
