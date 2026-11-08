const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = Number(err.status || err.statusCode || 500);

  // Erros conhecidos do Sequelize recebem respostas HTTP previsíveis.
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError' && err.parent?.code === '22P02') {
    status = 400;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 409;
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
  }

  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;

  if (status >= 500) {
    // Detalhes técnicos permanecem somente nos logs do servidor.
    console.error('Erro interno da API:', {
      name: err.name,
      message: err.message,
      code: err.code,
    });
  }

  const mensagensSeguras = {
    400: 'Dados inválidos. Verifique os campos enviados.',
    401: 'Não autenticado.',
    403: 'Acesso não permitido.',
    404: 'Recurso não encontrado.',
    409: 'Conflito ao processar a solicitação.',
  };

  return res.status(status).json({
    mensagem: status >= 500
      ? 'Erro interno do servidor.'
      : (status < 500 && err.expose !== false
          ? (err.message || mensagensSeguras[status] || 'Não foi possível concluir a solicitação.')
          : (mensagensSeguras[status] || 'Não foi possível concluir a solicitação.')),
  });
};

module.exports = errorHandler;
