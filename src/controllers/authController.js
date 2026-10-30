const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuario } = require('../models');
const emailService = require('../services/emailService');

const gerarToken = (usuario) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado.');
  return jwt.sign(
    { id: usuario.id, perfil: usuario.perfil },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token: gerarToken(usuario),
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (senha.length < 8) {
      return res.status(400).json({ mensagem: 'A senha deve possuir pelo menos 8 caracteres.' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({ mensagem: 'Este e-mail já está em uso.' });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha_hash: senhaHash,
      perfil: 'VOLUNTARIO', // Cadastro público nunca pode conceder ADMIN.
    });

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, perfil: novoUsuario.perfil },
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensagem: 'E-mail é obrigatório.' });

    const usuario = await Usuario.findOne({ where: { email } });
    // Resposta igual para e-mail existente ou inexistente, evitando enumeração de contas.
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expira = new Date(Date.now() + 30 * 60 * 1000);

      await usuario.update({
        token_recuperacao: tokenHash,
        token_recuperacao_expira: expira,
      });

      try {
        await emailService.enviarEmailRecuperacao({
          destinatario: usuario.email,
          nome: usuario.nome,
          token,
        });
      } catch (emailError) {
        await usuario.update({ token_recuperacao: null, token_recuperacao_expira: null });
        return res.status(503).json({
          mensagem: 'Não foi possível enviar o e-mail de recuperação. Verifique a configuração SMTP.',
        });
      }
    }

    return res.status(200).json({
      mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinição de senha.',
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, nova_senha } = req.body;
    if (!token || !nova_senha) {
      return res.status(400).json({ mensagem: 'Token e nova_senha são obrigatórios.' });
    }
    if (nova_senha.length < 8) {
      return res.status(400).json({ mensagem: 'A nova senha deve possuir pelo menos 8 caracteres.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const usuario = await Usuario.findOne({ where: { token_recuperacao: tokenHash } });

    if (!usuario || !usuario.token_recuperacao_expira || usuario.token_recuperacao_expira < new Date()) {
      return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
    }

    await usuario.update({
      senha_hash: await bcrypt.hash(nova_senha, 12),
      token_recuperacao: null,
      token_recuperacao_expira: null,
    });

    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    next(error);
  }
};
