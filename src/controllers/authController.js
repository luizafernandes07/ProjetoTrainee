const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuario } = require('../models');
const emailService = require('../services/emailService');
const criarCasosDeAutenticacao = require('../application/usecases/autenticacao');

const autenticacao = criarCasosDeAutenticacao({
  Usuario,
  bcrypt,
  jwt,
  crypto,
  emailService,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
});

exports.login = async (req, res, next) => {
  try {
    const resultado = await autenticacao.login(req.body);
    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      ...resultado,
    });
  } catch (error) { return next(error); }
};

exports.register = async (req, res, next) => {
  try {
    const usuario = await autenticacao.registrar(req.body);
    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario,
    });
  } catch (error) { return next(error); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const mensagem = await autenticacao.solicitarRecuperacao(req.body?.email);
    return res.status(200).json({ mensagem });
  } catch (error) { return next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    await autenticacao.redefinirSenha(req.body);
    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) { return next(error); }
};
