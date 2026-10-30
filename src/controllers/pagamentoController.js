const crypto = require('crypto');
const sequelize = require('../config/database');
const { Venda, ItemVenda, Produto, MovimentacaoFinanceira } = require('../models');
const mercadoPagoService = require('../services/mercadoPagoService');

const validarAssinatura = (req, paymentId) => {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const assinatura = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  if (!assinatura || !requestId) return false;

  const partes = Object.fromEntries(assinatura.split(',').map((parte) => parte.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;

  const manifesto = `id:${String(paymentId).toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', secret).update(manifesto).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(partes.v1));
  } catch (_) {
    return false;
  }
};

exports.webhookMercadoPago = async (req, res, next) => {
  try {
    const paymentId = req.body?.data?.id || req.query['data.id'];
    if (!paymentId) return res.status(400).json({ mensagem: 'Identificador do pagamento ausente.' });
    if (!validarAssinatura(req, paymentId)) {
      return res.status(401).json({ mensagem: 'Assinatura do webhook inválida.' });
    }

    // Consulta o pagamento diretamente na API do Mercado Pago; não confia apenas no corpo do webhook.
    const pagamento = await mercadoPagoService.buscarPagamento(paymentId);
    const vendaId = pagamento.external_reference;
    if (!vendaId) return res.status(200).json({ recebido: true });

    const transaction = await sequelize.transaction();
    try {
      const venda = await Venda.findByPk(vendaId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!venda) {
        await transaction.rollback();
        return res.status(404).json({ mensagem: 'Venda vinculada ao pagamento não encontrada.' });
      }

      if (pagamento.status === 'approved') {
        await venda.update({ status_pagamento: 'APROVADO' }, { transaction });

        const movimentoExistente = await MovimentacaoFinanceira.findOne({
          where: { venda_id: venda.id },
          transaction,
        });
        if (!movimentoExistente) {
          await MovimentacaoFinanceira.create({
            usuario_id: venda.usuario_id,
            venda_id: venda.id,
            tipo: 'ENTRADA',
            valor: venda.valor_total,
            descricao: `Pagamento Pix aprovado - venda #${venda.id}`,
          }, { transaction });
        }
      } else if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(pagamento.status)) {
        await venda.update({ status_pagamento: pagamento.status.toUpperCase() }, { transaction });

        const movimentoExistente = await MovimentacaoFinanceira.findOne({
          where: { venda_id: venda.id },
          transaction,
        });
        if (movimentoExistente) await movimentoExistente.destroy({ transaction });

        if (!venda.estoque_estornado) {
          const itens = await ItemVenda.findAll({ where: { venda_id: venda.id }, transaction });
          for (const item of itens) {
            const produto = await Produto.findByPk(item.produto_id, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            });
            if (produto) {
              await produto.update({
                quantidade_estoque: produto.quantidade_estoque + item.quantidade,
              }, { transaction });
            }
          }
          await venda.update({ estoque_estornado: true }, { transaction });
        }
      } else {
        await venda.update({ status_pagamento: String(pagamento.status || 'PENDENTE').toUpperCase() }, { transaction });
      }

      await transaction.commit();
      return res.status(200).json({ recebido: true });
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};
