const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuario } = require('../models');

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    if (usuario) {
      const token = crypto.randomBytes(20).toString('hex');
      const expira = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      await usuario.update({
        token_recuperacao: token,
        token_recuperacao_expira: expira
      });

      console.log(`📧 Link de recuperação gerado para ${email}: Token = ${token}`);
    }

    return res.status(200).json({
      mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinição de senha.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, nova_senha } = req.body;

    const usuario = await Usuario.findOne({ where: { token_recuperacao: token } });

    if (!usuario || !usuario.token_recuperacao_expira || usuario.token_recuperacao_expira < new Date()) {
      return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
    }

    const senhaHash = await bcrypt.hash(nova_senha, 10);
    await usuario.update({
      senha_hash: senhaHash,
      token_recuperacao: null,
      token_recuperacao_expira: null
    });

    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    next(error);
  }
};