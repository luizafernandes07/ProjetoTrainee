const { Produto } = require('../models');
exports.criarProduto = async (req, res, next) => {
  try {
    // Adicionado 'categoria' na desestruturação do req.body
    const { nome, descricao, preco, estoque, categoria } = req.body;

    if (!nome || preco === undefined) {
      return res.status(400).json({ mensagem: 'Nome e preço do produto são obrigatórios.' });
    }

    const produto = await Produto.create({
      nome,
      descricao,
      preco,
      estoque: estoque !== undefined ? estoque : 0,
      categoria // Adicionado a categoria na inserção do banco
    });

    return res.status(201).json(produto);
  } catch (error) {
    next(error);
  }
};

exports.listarProdutos = async (req, res, next) => {
  try {
    const produtos = await Produto.findAll();
    return res.status(200).json(produtos);
  } catch (error) {
    next(error);
  }
};

exports.buscarProdutoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    return res.status(200).json(produto);
  } catch (error) {
    next(error);
  }
};

exports.atualizarProduto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    await produto.update(req.body);
    return res.status(200).json(produto);
  } catch (error) {
    next(error);
  }
};

exports.deletarProduto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    await produto.destroy();
    return res.status(200).json({ mensagem: 'Produto removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};