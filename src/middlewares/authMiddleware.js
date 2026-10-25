const jwt = require('jsonwebtoken');

// Middleware para verificar se o usuário está autenticado via Token JWT
exports.autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido ou inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Ajustado para 'secret' (mesmo fallback utilizado no authController.js)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.usuario = decoded; // Armazena id e perfil do usuário logado no req
    next();
  } catch (error) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
};

// Middleware para controle de acesso por perfil (RBAC: ADMIN x VOLUNTARIO)
exports.autorizar = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ mensagem: 'Acesso negado: Perfil sem permissão para realizar esta ação.' });
    }
    next();
  };
};