const { Produto } = require('../models');
const criarGerenciadorProdutos = require('../application/usecases/gerenciarProdutos');

const produtos = criarGerenciadorProdutos({ Produto });

exports.criarProduto = async (req, res, next) => {
  try {
    const produto = await produtos.criar(req.body);
    return res.status(201).json(produto);
  } catch (error) { return next(error); }
};

exports.listarProdutos = async (req, res, next) => {
  try {
    return res.status(200).json(await produtos.listar());
  } catch (error) { return next(error); }
};

exports.buscarProdutoPorId = async (req, res, next) => {
  try {
    return res.status(200).json(await produtos.buscar(req.params.id));
  } catch (error) { return next(error); }
};

exports.atualizarProduto = async (req, res, next) => {
  try {
    const produto = await produtos.atualizar(req.params.id, req.body);
    return res.status(200).json(produto);
  } catch (error) { return next(error); }
};

exports.deletarProduto = async (req, res, next) => {
  try {
    await produtos.desativar(req.params.id);
    return res.status(200).json({ mensagem: 'Produto desativado com sucesso.' });
  } catch (error) { return next(error); }
};
