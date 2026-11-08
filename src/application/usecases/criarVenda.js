const { artigoReligioso } = require('../../domain/policies/produtos');

function erroNegocio(mensagem, status = 400) {
  return Object.assign(new Error(mensagem), { status });
}

function validarItens(itens) {
  return Array.isArray(itens) &&
    itens.length > 0 &&
    itens.every((item) =>
      item &&
      typeof item.produto_id === 'string' &&
      item.produto_id.trim() &&
      Number.isInteger(Number(item.quantidade)) &&
      Number(item.quantidade) > 0
    );
}

async function processarItens({ itens, transaction, Produto, bloquearLanchonete }) {
  const itensProcessados = [];
  let totalCentavos = 0;

  for (const item of itens) {
    const produto = await Produto.findByPk(item.produto_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!produto || !produto.ativo) {
      throw erroNegocio('Um dos produtos não está disponível.');
    }

    if (bloquearLanchonete && !artigoReligioso(produto.categoria)) {
      throw erroNegocio(
        'A compra online está disponível somente para artigos religiosos.',
        403
      );
    }

    const quantidade = Number(item.quantidade);
    const estoque = Number(produto.quantidade_estoque || 0);

    if (estoque < quantidade) {
      throw erroNegocio(`Estoque insuficiente para: ${produto.nome}`);
    }

    const precoCentavos = Math.round(Number(produto.preco) * 100);
    if (!Number.isSafeInteger(precoCentavos) || precoCentavos <= 0) {
      throw erroNegocio(`Preço inválido para o produto: ${produto.nome}`, 409);
    }

    totalCentavos += precoCentavos * quantidade;
    if (!Number.isSafeInteger(totalCentavos)) {
      throw erroNegocio('O valor total do pedido excede o limite permitido.');
    }

    await produto.update(
      { quantidade_estoque: estoque - quantidade },
      { transaction }
    );

    itensProcessados.push({
      produto_id: produto.id,
      quantidade,
      preco_unitario: produto.preco,
    });
  }

  return { itens: itensProcessados, total: totalCentavos / 100 };
}

function criarVendaUseCases(dependencias) {
  const {
    sequelize,
    Venda,
    ItemVenda,
    Produto,
    MovimentacaoFinanceira,
    buscarEnderecoPorCep,
  } = dependencias;

  async function criarVendaOnline({ usuarioId, dados }) {
    const transaction = await sequelize.transaction();

    try {
      const {
        itens,
        cep,
        numero,
        complemento,
        forma_pagamento_entrega,
        precisa_troco = false,
        troco_para,
      } = dados || {};

      if (!validarItens(itens)) {
        throw erroNegocio('Informe pelo menos um item com quantidade válida.');
      }

      const cepLimpo = String(cep || '').replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        throw erroNegocio('Informe um CEP válido para realizar o pedido.');
      }

      if (typeof numero !== 'string' && typeof numero !== 'number') {
        throw erroNegocio('Informe o número do endereço.');
      }
      if (!String(numero).trim()) {
        throw erroNegocio('Informe o número do endereço.');
      }

      if (complemento != null && typeof complemento !== 'string') {
        throw erroNegocio('O complemento deve ser um texto.');
      }

      const pagamento = String(forma_pagamento_entrega || '').toUpperCase();
      if (!['PIX', 'DINHEIRO'].includes(pagamento)) {
        throw erroNegocio('A forma de pagamento deve ser PIX ou DINHEIRO.');
      }

      if (typeof precisa_troco !== 'boolean') {
        throw erroNegocio('O campo precisa_troco deve ser verdadeiro ou falso.');
      }

      if (pagamento !== 'DINHEIRO' && precisa_troco) {
        throw erroNegocio('A opção de troco só pode ser usada para pagamento em dinheiro.');
      }

      if (
        pagamento === 'DINHEIRO' &&
        precisa_troco &&
        (!Number.isFinite(Number(troco_para)) || Number(troco_para) <= 0)
      ) {
        throw erroNegocio('Informe um valor válido para o troco.');
      }

      const endereco = await buscarEnderecoPorCep(cepLimpo);
      const processados = await processarItens({
        itens,
        transaction,
        Produto,
        bloquearLanchonete: true,
      });

      if (
        pagamento === 'DINHEIRO' &&
        precisa_troco &&
        Math.round(Number(troco_para) * 100) < Math.round(processados.total * 100)
      ) {
        throw erroNegocio('O valor informado para troco deve ser maior ou igual ao total do pedido.');
      }

      const venda = await Venda.create({
        usuario_id: usuarioId,
        cliente_id: usuarioId,
        tipo_venda: 'ONLINE',
        valor_total: processados.total,
        forma_pagamento: pagamento,
        cep: cepLimpo,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        numero: String(numero).trim(),
        complemento: complemento ? complemento.trim() : null,
        precisa_troco: pagamento === 'DINHEIRO' && precisa_troco,
        valor_troco_para: pagamento === 'DINHEIRO' && precisa_troco
          ? Number(troco_para)
          : null,
        endereco_entrega: JSON.stringify({
          ...endereco,
          numero: String(numero).trim(),
          complemento: complemento ? complemento.trim() : '',
        }),
        observacao: pagamento === 'PIX'
          ? 'Pagamento via PIX para o pedido com entrega.'
          : 'Pagamento em dinheiro no momento da entrega.',
        status: 'AGUARDANDO_ENTREGA',
      }, { transaction });

      for (const item of processados.itens) {
        await ItemVenda.create({ venda_id: venda.id, ...item }, { transaction });
      }

      await transaction.commit();
      return venda;
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      if (/CEP inválido|CEP não encontrado/i.test(error.message || '')) {
        error.status = 400;
      }
      throw error;
    }
  }

  async function criarVendaPresencial({ usuarioId, dados }) {
    const transaction = await sequelize.transaction();

    try {
      const { itens, forma_pagamento = 'DINHEIRO' } = dados || {};
      if (!validarItens(itens)) {
        throw erroNegocio('Informe pelo menos um item com quantidade válida.');
      }

      const pagamento = String(forma_pagamento).toUpperCase();
      if (!['PIX', 'DINHEIRO'].includes(pagamento)) {
        throw erroNegocio('Forma de pagamento inválida.');
      }

      const processados = await processarItens({
        itens,
        transaction,
        Produto,
        bloquearLanchonete: false,
      });

      const venda = await Venda.create({
        usuario_id: usuarioId,
        cliente_id: null,
        vendedor_id: usuarioId,
        tipo_venda: 'PRESENCIAL',
        valor_total: processados.total,
        forma_pagamento: pagamento,
        status: 'CONCLUIDO',
        observacao: 'Venda presencial registrada no caixa.',
      }, { transaction });

      for (const item of processados.itens) {
        await ItemVenda.create({ venda_id: venda.id, ...item }, { transaction });
      }

      await MovimentacaoFinanceira.create({
        usuario_id: usuarioId,
        venda_id: venda.id,
        tipo: 'ENTRADA',
        valor: processados.total,
        descricao: `Venda presencial #${venda.id}`,
      }, { transaction });

      await transaction.commit();
      return venda;
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  const incluirItens = [
    { model: ItemVenda, as: 'itens', include: [{ model: Produto, as: 'produto' }], required: false },
  ];

  async function listarVendas() {
    return Venda.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'email'], required: false },
        ...incluirItens,
      ],
    });
  }

  async function buscarVendaPorId(id) {
    const venda = await Venda.findByPk(id, {
      include: [
        { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'email'], required: false },
        ...incluirItens,
      ],
    });
    if (!venda) throw erroNegocio('Venda não encontrada.', 404);
    return venda;
  }

  async function atualizarStatusVenda(id, status) {
    const transaction = await sequelize.transaction();
    try {
      const permitidos = ['AGUARDANDO_RETIRADA', 'AGUARDANDO_ENTREGA', 'CONCLUIDO', 'CANCELADO'];
      if (!permitidos.includes(status)) throw erroNegocio('Status de venda inválido.');

      const venda = await Venda.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!venda) throw erroNegocio('Venda não encontrada.', 404);
      if (venda.status === 'CANCELADO' && status !== 'CANCELADO') {
        throw erroNegocio('Uma venda cancelada não pode ser reaberta.');
      }

      if (status === 'CANCELADO' && venda.status !== 'CANCELADO') {
        const itens = await ItemVenda.findAll({ where: { venda_id: venda.id }, transaction });
        for (const item of itens) {
          const produto = await Produto.findByPk(item.produto_id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (produto) {
            await produto.update({
              quantidade_estoque: Number(produto.quantidade_estoque || 0) + Number(item.quantidade),
            }, { transaction });
          }
        }

        const movimento = await MovimentacaoFinanceira.findOne({
          where: { venda_id: venda.id },
          transaction,
        });
        if (movimento) await movimento.destroy({ transaction });
      }

      await venda.update({ status }, { transaction });
      await transaction.commit();
      return venda;
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async function minhasCompras(usuarioId) {
    return Venda.findAll({
      where: { cliente_id: usuarioId, tipo_venda: 'ONLINE' },
      order: [['createdAt', 'DESC']],
      include: incluirItens,
    });
  }

  return {
    criarVendaOnline,
    criarVendaPresencial,
    listarVendas,
    buscarVendaPorId,
    atualizarStatusVenda,
    cancelarVenda: (id) => atualizarStatusVenda(id, 'CANCELADO'),
    minhasCompras,
  };
}

module.exports = criarVendaUseCases;
