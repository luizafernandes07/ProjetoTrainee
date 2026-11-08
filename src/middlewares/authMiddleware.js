const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

exports.autenticar = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ mensagem: 'Token de autenticação não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ mensagem: 'Formato de token inválido.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }

  try {
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ['id', 'nome', 'email', 'perfil', 'ativo'],
    });

    if (!usuario || usuario.ativo === false) {
      return res.status(401).json({ mensagem: 'Usuário inválido ou inativo.' });
    }

    req.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: String(usuario.perfil || '').toUpperCase(),
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.autorizar = (...perfis) => {
  const permitidos = perfis.flat().map((perfil) => String(perfil).trim().toUpperCase());

  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }

    const perfil = String(req.usuario.perfil || '').trim().toUpperCase();
    if (!permitidos.includes(perfil)) {
      return res.status(403).json({
        mensagem: `Acesso negado. Seu perfil (${perfil}) não tem permissão para esta ação.`,
      });
    }

    return next();
  };
};
