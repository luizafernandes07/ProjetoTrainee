const sequelize = require('../config/database');
const { Venda, ItemVenda, Produto, MovimentacaoFinanceira, Usuario } = require('../models');
const mercadoPagoService = require('../services/mercadoPagoService');

const carregarItensEValidar = async (itens, transaction) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    const error = new Error('É necessário informar ao menos um item.');
    error.status = 400;
    throw error;
  }

  const itensAgrupados = new Map();
  for (const item of itens) {
    const quantidade = Number(item.quantidade);
    if (!item.produto_id || !Number.isInteger(quantidade) || quantidade <= 0) {
      const error = new Error('Cada item deve possuir produto_id e quantidade inteira maior que zero.');
      error.status = 400;
      throw error;
    }
    itensAgrupados.set(item.produto_id, (itensAgrupados.get(item.produto_id) || 0) + quantidade);
  }

  const itensCalculados = [];
  let valorTotal = 0;
  for (const [produtoId, quantidade] of itensAgrupados.entries()) {
    const produto = await Produto.findByPk(produtoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!produto || !produto.ativo) {
      const error = new Error(`Produto ${produtoId} não encontrado ou inativo.`);
      error.status = 404;
      throw error;
    }

    if (produto.quantidade_estoque < quantidade) {
      const error = new Error(`Estoque insuficiente para: ${produto.nome}.`);
      error.status = 400;
      throw error;
    }

    const precoUnitario = Number(produto.preco);
    valorTotal += precoUnitario * quantidade;
    itensCalculados.push({ produto, quantidade, precoUnitario });
  }

  return { itensCalculados, valorTotal: Number(valorTotal.toFixed(2)) };
};

const baixarEstoque = async (itensCalculados, transaction) => {
  for (const item of itensCalculados) {
    await item.produto.update(
      { quantidade_estoque: item.produto.quantidade_estoque - item.quantidade },
      { transaction }
    );
  }
};

const salvarItens = async (venda, itensCalculados, transaction) => {
  await ItemVenda.bulkCreate(itensCalculados.map((item) => ({
    venda_id: venda.id,
    produto_id: item.produto.id,
    quantidade: item.quantidade,
    preco_unitario: item.precoUnitario,
  })), { transaction });
};

exports.criarVendaPresencial = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { itens, forma_pagamento } = req.body;
    const forma = forma_pagamento || 'DINHEIRO';
    if (!['DINHEIRO', 'PIX', 'CARTAO'].includes(forma)) {
      await transaction.rollback();
      return res.status(400).json({ mensagem: 'Forma de pagamento inválida.' });
    }

    const { itensCalculados, valorTotal } = await carregarItensEValidar(itens, transaction);
    const venda = await Venda.create({
      usuario_id: req.usuario.id,
      valor_total: valorTotal,
      forma_pagamento: forma,
      tipo_venda: 'PRESENCIAL',
      status_pagamento: 'PAGO',
    }, { transaction });

    await salvarItens(venda, itensCalculados, transaction);
    await baixarEstoque(itensCalculados, transaction);

    await MovimentacaoFinanceira.create({
      usuario_id: req.usuario.id,
      venda_id: venda.id,
      tipo: 'ENTRADA',
      valor: valorTotal,
      descricao: `Venda presencial #${venda.id}`,
    }, { transaction });

    await transaction.commit();
    return res.status(201).json({ mensagem: 'Venda presencial realizada com sucesso!', venda });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
};

exports.criarVendaOnline = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { itens } = req.body;
    const { itensCalculados, valorTotal } = await carregarItensEValidar(itens, transaction);

    const venda = await Venda.create({
      usuario_id: req.usuario.id,
      valor_total: valorTotal,
      forma_pagamento: 'PIX',
      tipo_venda: 'ONLINE',
      status_pagamento: 'PENDENTE',
    }, { transaction });

    await salvarItens(venda, itensCalculados, transaction);
    // Reserva o estoque enquanto o Pix está pendente.
    await baixarEstoque(itensCalculados, transaction);

    const usuario = await Usuario.findByPk(req.usuario.id, { transaction });
    const pagamento = await mercadoPagoService.criarPagamentoPix({
      venda,
      email: usuario.email,
    });

    await venda.update({
      pagamento_externo_id: pagamento.id,
      status_pagamento: pagamento.status || 'PENDING',
      pix_qr_code: pagamento.qr_code,
      pix_qr_code_base64: pagamento.qr_code_base64,
      pix_ticket_url: pagamento.ticket_url,
    }, { transaction });

    await transaction.commit();
    return res.status(201).json({
      mensagem: 'Pedido criado. Finalize o pagamento Pix para confirmar a compra.',
      venda,
      pagamento: {
        provedor: 'Mercado Pago',
        id: pagamento.id,
        status: pagamento.status,
        qr_code: pagamento.qr_code,
        qr_code_base64: pagamento.qr_code_base64,
        ticket_url: pagamento.ticket_url,
      },
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
};

exports.listarVendas = async (req, res, next) => {
  try {
    const filtro = {};
    if (req.usuario.perfil === 'VOLUNTARIO') filtro.usuario_id = req.usuario.id;

    const vendas = await Venda.findAll({
      where: filtro,
      include: [
        { model: Usuario, as: 'vendedor', attributes: ['id', 'nome', 'email'] },
        { model: ItemVenda, as: 'itens', include: [{ model: Produto, as: 'produto' }] },
      ],
      order: [['data_venda', 'DESC']],
    });
    return res.status(200).json(vendas);
  } catch (error) {
    return next(error);
  }
};

exports.buscarPorId = async (req, res, next) => {
  try {
    const venda = await Venda.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'vendedor', attributes: ['id', 'nome', 'email'] },
        { model: ItemVenda, as: 'itens', include: [{ model: Produto, as: 'produto' }] },
      ],
    });

    if (!venda) return res.status(404).json({ mensagem: 'Venda não encontrada.' });
    if (req.usuario.perfil === 'VOLUNTARIO' && venda.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensagem: 'Acesso negado a esta venda.' });
    }
    return res.status(200).json(venda);
  } catch (error) {
    return next(error);
  }
};
