const { Produto } = require('../models');

exports.criarProduto = async (req, res, next) => {
  try {
    const { nome, descricao, preco, quantidade_estoque, categoria } = req.body;
    const precoNumerico = Number(preco);
    const estoqueNumerico = quantidade_estoque === undefined ? 0 : Number(quantidade_estoque);

    if (!nome || preco === undefined || !Number.isFinite(precoNumerico) || precoNumerico <= 0) {
      return res.status(400).json({ mensagem: 'Nome e preço positivo do produto são obrigatórios.' });
    }
    if (!Number.isInteger(estoqueNumerico) || estoqueNumerico < 0) {
      return res.status(400).json({ mensagem: 'O estoque deve ser um número inteiro não negativo.' });
    }

    const produto = await Produto.create({
      nome: nome.trim(),
      descricao: descricao || null,
      preco: precoNumerico,
      quantidade_estoque: estoqueNumerico,
      categoria: categoria || 'ARTIGO_RELIGIOSO',
    });

    return res.status(201).json(produto);
  } catch (error) {
    return next(error);
  }
};

exports.listarProdutos = async (req, res, next) => {
  try {
    const produtos = await Produto.findAll({ where: { ativo: true }, order: [['nome', 'ASC']] });
    return res.status(200).json(produtos);
  } catch (error) {
    return next(error);
  }
};

exports.buscarProdutoPorId = async (req, res, next) => {
  try {
    const produto = await Produto.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    return res.status(200).json(produto);
  } catch (error) {
    return next(error);
  }
};

exports.atualizarProduto = async (req, res, next) => {
  try {
    const produto = await Produto.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ mensagem: 'Produto não encontrado.' });

    const camposPermitidos = ['nome', 'descricao', 'preco', 'quantidade_estoque', 'categoria'];
    const atualizacao = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) atualizacao[campo] = req.body[campo];
    }

    if (atualizacao.preco !== undefined && (!Number.isFinite(Number(atualizacao.preco)) || Number(atualizacao.preco) <= 0)) {
      return res.status(400).json({ mensagem: 'O preço deve ser positivo.' });
    }
    if (atualizacao.quantidade_estoque !== undefined &&
        (!Number.isInteger(Number(atualizacao.quantidade_estoque)) || Number(atualizacao.quantidade_estoque) < 0)) {
      return res.status(400).json({ mensagem: 'O estoque deve ser um inteiro não negativo.' });
    }

    await produto.update(atualizacao);
    return res.status(200).json(produto);
  } catch (error) {
    return next(error);
  }
};

exports.deletarProduto = async (req, res, next) => {
  try {
    const produto = await Produto.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    // Exclusão lógica preserva o histórico dos itens vendidos.
    await produto.update({ ativo: false });
    return res.status(200).json({ mensagem: 'Produto desativado com sucesso.' });
  } catch (error) {
    return next(error);
  }
};
