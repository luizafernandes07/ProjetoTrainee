const {
  Venda,
  ItemVenda,
  Produto,
  MovimentacaoFinanceira,
  Usuario,
  sequelize,
} = require('../models');
const ViaCepService = require('../services/viaCepService');
const criarVendaUseCases = require('../application/usecases/criarVenda');

const vendaUseCases = criarVendaUseCases({
  sequelize,
  Venda,
  ItemVenda,
  Produto,
  MovimentacaoFinanceira,
  Usuario,
  buscarEnderecoPorCep: (cep) => ViaCepService.buscarEnderecoPorCep(cep),
});

exports.criarVendaOnline = async (req, res, next) => {
  try {
    const venda = await vendaUseCases.criarVendaOnline({
      usuarioId: req.usuario.id,
      dados: req.body,
    });
    return res.status(201).json({
      mensagem: 'Pedido realizado com sucesso! Seu pedido será entregue no endereço informado.',
      venda,
    });
  } catch (error) { return next(error); }
};

exports.criarVendaPresencial = async (req, res, next) => {
  try {
    const venda = await vendaUseCases.criarVendaPresencial({
      usuarioId: req.usuario.id,
      dados: req.body,
    });
    return res.status(201).json({
      mensagem: 'Venda presencial concluída com sucesso!',
      venda,
    });
  } catch (error) { return next(error); }
};

exports.listarVendas = async (req, res, next) => {
  try { return res.status(200).json(await vendaUseCases.listarVendas()); }
  catch (error) { return next(error); }
};

exports.buscarPorId = async (req, res, next) => {
  try { return res.status(200).json(await vendaUseCases.buscarVendaPorId(req.params.id)); }
  catch (error) { return next(error); }
};

exports.cancelarVenda = async (req, res, next) => {
  try {
    const venda = await vendaUseCases.cancelarVenda(req.params.id);
    return res.status(200).json({ mensagem: 'Status atualizado para CANCELADO.', venda });
  } catch (error) { return next(error); }
};

exports.atualizarStatusVenda = async (req, res, next) => {
  try {
    const venda = await vendaUseCases.atualizarStatusVenda(req.params.id, req.body?.status);
    return res.status(200).json({
      mensagem: `Status atualizado para ${req.body.status}.`,
      venda,
    });
  } catch (error) { return next(error); }
};

exports.minhasCompras = async (req, res, next) => {
  try {
    return res.status(200).json(await vendaUseCases.minhasCompras(req.usuario.id));
  } catch (error) { return next(error); }
};
