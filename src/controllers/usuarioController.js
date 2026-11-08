const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const criarGerenciadorUsuarios = require('../application/usecases/gerenciarUsuarios');

const usuarios = criarGerenciadorUsuarios({ Usuario, bcrypt });

exports.listarUsuarios = async (req, res, next) => {
  try { return res.status(200).json(await usuarios.listar()); }
  catch (error) { return next(error); }
};

exports.buscarUsuarioPorId = async (req, res, next) => {
  try { return res.status(200).json(await usuarios.buscar(req.params.id)); }
  catch (error) { return next(error); }
};

exports.criarUsuario = async (req, res, next) => {
  try {
    const usuario = await usuarios.criarVoluntario(req.body);
    return res.status(201).json({ mensagem: 'Voluntário cadastrado.', usuario });
  } catch (error) { return next(error); }
};

exports.atualizarUsuario = async (req, res, next) => {
  try {
    const usuario = await usuarios.atualizar(req.params.id, req.body);
    return res.status(200).json({ mensagem: 'Usuário atualizado.', usuario });
  } catch (error) { return next(error); }
};

exports.desativarUsuario = async (req, res, next) => {
  try {
    await usuarios.desativar(req.params.id, req.usuario.id);
    return res.status(200).json({ mensagem: 'Usuário desativado com sucesso.' });
  } catch (error) { return next(error); }
};
