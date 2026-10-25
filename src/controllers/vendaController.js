const sequelize = require('../config/database');
const { Venda, ItemVenda, Produto, MovimentacaoFinanceira, Usuario } = require('../models');

exports.realizarVenda = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { itens, forma_pagamento } = req.body;
    const usuario_id = req.usuario.id;

    // 1. Validações básicas de entrada
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      await t.rollback();
      return res.status(400).json({ mensagem: 'É necessário informar ao menos um item para a venda.' });
    }

    if (!forma_pagamento) {
      await t.rollback();
      return res.status(400).json({ mensagem: 'A forma de pagamento é obrigatória.' });
    }

    let valorTotalVenda = 0;
    const itensProcessados = [];

    // 2. Validar produtos, quantidades e estoque disponível
    for (const item of itens) {
      // Impede o envio de quantidade menor ou igual a zero
      if (!item.quantidade || item.quantidade <= 0) {
        await t.rollback();
        return res.status(400).json({ mensagem: 'A quantidade de cada item deve ser maior que zero.' });
      }

      const produto = await Produto.findByPk(item.produto_id, { transaction: t });

      if (!produto) {
        await t.rollback();
        return res.status(404).json({ mensagem: `Produto ID ${item.produto_id} não encontrado.` });
      }

      // Suporta 'quantidade_estoque' ou 'estoque'
      const estoqueAtual = produto.quantidade_estoque !== undefined ? produto.quantidade_estoque : produto.estoque;

      if (estoqueAtual < item.quantidade) {
        await t.rollback();
        return res.status(400).json({
          mensagem: `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${estoqueAtual}`
        });
      }

      const precoUnitario = Number(produto.preco);
      const subtotal = precoUnitario * item.quantidade;
      valorTotalVenda += subtotal;

      itensProcessados.push({
        produto,
        estoqueAtual,
        quantidade: item.quantidade,
        preco_unitario: precoUnitario,
        subtotal
      });
    }

    // 3. Criar o registro principal da Venda
    const venda = await Venda.create({
      usuario_id,
      forma_pagamento,
      valor_total: valorTotalVenda,
      status: 'CONCLUIDA'
    }, { transaction: t });

    // 4. Criar os Itens da Venda e atualizar Estoque
    for (const item of itensProcessados) {
      await ItemVenda.create({
        venda_id: venda.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }, { transaction: t });

      // Atualiza o estoque reduzindo a quantidade vendida
      const novaQuantidade = item.estoqueAtual - item.quantidade;
      if (item.produto.quantidade_estoque !== undefined) {
        await item.produto.update({ quantidade_estoque: novaQuantidade }, { transaction: t });
      } else {
        await item.produto.update({ estoque: novaQuantidade }, { transaction: t });
      }
    }

    // 5. Registrar a Movimentação Financeira
    await MovimentacaoFinanceira.create({
      venda_id: venda.id,
      usuario_id,
      tipo: 'ENTRADA',
      valor: valorTotalVenda,
      descricao: `Receita gerada pela Venda ID: ${venda.id}`
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({
      mensagem: 'Venda realizada com sucesso!',
      venda_id: venda.id,
      valor_total: valorTotalVenda
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.listarVendas = async (req, res, next) => {
  try {
    const filtro = {};
    if (req.usuario.perfil === 'VOLUNTARIO') {
      filtro.usuario_id = req.usuario.id;
    }

    const vendas = await Venda.findAll({
      where: filtro,
      include: [
        { model: Usuario, as: 'vendedor', attributes: ['id', 'nome', 'email'] },
        {
          model: ItemVenda,
          as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['id', 'nome'] }]
        }
      ],
      order: [['id', 'DESC']]
    });

    return res.status(200).json(vendas);
  } catch (error) {
    next(error);
  }
};
exports.buscarPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venda = await Venda.findByPk(id, {
      include: [
        { model: Usuario, as: 'vendedor', attributes: ['id', 'nome', 'email'] },
        {
          model: ItemVenda,
          as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['id', 'nome'] }]
        }
      ]
    });

    if (!venda) {
      return res.status(404).json({ mensagem: 'Venda não encontrada.' });
    }

    // Se o usuário for VOLUNTARIO, restringe o acesso apenas às suas próprias vendas
    if (req.usuario.perfil === 'VOLUNTARIO' && venda.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensagem: 'Acesso negado a esta venda.' });
    }

    return res.status(200).json(venda);
  } catch (error) {
    next(error);
  }
};