const { MovimentacaoFinanceira, Usuario } = require('../models');
const exportService = require('../services/exportService');
const criarGerenciadorMovimentacoes = require('../application/usecases/gerenciarMovimentacoes');

const financeiro = criarGerenciadorMovimentacoes({
  MovimentacaoFinanceira,
  Usuario,
  exportService,
});

exports.listarMovimentacoes = async (req, res, next) => {
  try { return res.status(200).json(await financeiro.listar()); }
  catch (error) { return next(error); }
};

exports.obterResumoCaixa = async (req, res, next) => {
  try { return res.status(200).json(await financeiro.obterResumo()); }
  catch (error) { return next(error); }
};

exports.criarMovimentacao = async (req, res, next) => {
  try {
    const movimentacao = await financeiro.criar({ usuarioId: req.usuario.id, dados: req.body });
    return res.status(201).json(movimentacao);
  } catch (error) { return next(error); }
};

exports.excluirMovimentacao = async (req, res, next) => {
  try {
    await financeiro.excluir(req.params.id);
    return res.status(200).json({ mensagem: 'Movimentação removida com sucesso.' });
  } catch (error) { return next(error); }
};

exports.exportarRelatorio = async (req, res, next) => {
  try {
    const arquivo = await financeiro.exportar(req.query.formato);
    res.setHeader('Content-Type', arquivo.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${arquivo.filename}"`);
    return res.status(200).send(arquivo.body);
  } catch (error) { return next(error); }
};
