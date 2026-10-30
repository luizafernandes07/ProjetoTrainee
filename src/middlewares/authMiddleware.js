const jwt = require('jsonwebtoken');

exports.autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido ou inválido.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ mensagem: 'JWT_SECRET não configurado.' });

  try {
    req.usuario = jwt.verify(authHeader.split(' ')[1], secret);
    return next();
  } catch (error) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
};

exports.autorizar = (...perfisPermitidos) => (req, res, next) => {
  if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
    return res.status(403).json({ mensagem: 'Acesso negado: Perfil sem permissão para realizar esta ação.' });
  }
  return next();
};
