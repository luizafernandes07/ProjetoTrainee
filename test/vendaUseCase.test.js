const { test } = require('node:test');
const assert = require('node:assert/strict');
const criarVendaUseCases = require('../src/application/usecases/criarVenda');
const { artigoReligioso } = require('../src/domain/policies/produtos');

function montarDependencias(produtoInicial) {
  const estado = {
    estoque: produtoInicial.quantidade_estoque,
    vendas: [],
    itens: [],
    movimentos: [],
    commit: false,
    rollback: false,
  };

  const produto = {
    ...produtoInicial,
    async update(dados) {
      if (dados.quantidade_estoque !== undefined) estado.estoque = dados.quantidade_estoque;
    },
  };

  const sequelize = {
    async transaction() {
      return {
        LOCK: { UPDATE: 'UPDATE' },
        finished: false,
        async commit() { estado.commit = true; this.finished = 'commit'; },
        async rollback() { estado.rollback = true; this.finished = 'rollback'; },
      };
    },
  };

  const useCases = criarVendaUseCases({
    sequelize,
    Produto: { async findByPk() { return produto; } },
    Venda: {
      async create(dados) {
        const venda = { id: `venda-${estado.vendas.length + 1}`, ...dados };
        estado.vendas.push(venda);
        return venda;
      },
    },
    ItemVenda: {
      async create(dados) { estado.itens.push(dados); },
    },
    MovimentacaoFinanceira: {
      async create(dados) { estado.movimentos.push(dados); },
    },
    buscarEnderecoPorCep: async (cep) => ({
      cep,
      logradouro: 'Rua de Teste',
      bairro: 'Centro',
      cidade: 'Formiga',
      uf: 'MG',
    }),
  });

  return { useCases, estado };
}

test('classifica artigos religiosos e não classifica produtos de lanchonete', () => {
  assert.equal(artigoReligioso('ARTIGO_RELIGIOSO'), true);
  assert.equal(artigoReligioso('Terços'), true);
  assert.equal(artigoReligioso('LANCHONETE'), false);
});

test('pedido online valida artigo religioso, entrega e complemento', async () => {
  const { useCases, estado } = montarDependencias({
    id: 'produto-1',
    nome: 'Terço',
    categoria: 'ARTIGO_RELIGIOSO',
    preco: '15.50',
    quantidade_estoque: 5,
    ativo: true,
  });

  const venda = await useCases.criarVendaOnline({
    usuarioId: 'cliente-1',
    dados: {
      itens: [{ produto_id: 'produto-1', quantidade: 2 }],
      cep: '35570000',
      numero: '123',
      complemento: 'Casa 2',
      forma_pagamento_entrega: 'PIX',
    },
  });

  assert.equal(venda.valor_total, 31);
  assert.equal(venda.status, 'AGUARDANDO_ENTREGA');
  assert.equal(venda.complemento, 'Casa 2');
  assert.equal(estado.estoque, 3);
  assert.equal(estado.itens.length, 1);
  assert.equal(estado.movimentos.length, 0);
  assert.equal(estado.commit, true);
});

test('pedido online rejeita produto de lanchonete', async () => {
  const { useCases, estado } = montarDependencias({
    id: 'produto-2',
    nome: 'Suco',
    categoria: 'LANCHONETE',
    preco: '6.00',
    quantidade_estoque: 5,
    ativo: true,
  });

  await assert.rejects(
    useCases.criarVendaOnline({
      usuarioId: 'cliente-1',
      dados: {
        itens: [{ produto_id: 'produto-2', quantidade: 1 }],
        cep: '35570000',
        numero: '123',
        forma_pagamento_entrega: 'PIX',
      },
    }),
    /somente para artigos religiosos/
  );

  assert.equal(estado.estoque, 5);
  assert.equal(estado.commit, false);
  assert.equal(estado.rollback, true);
});

test('venda presencial baixa estoque e gera entrada no caixa', async () => {
  const { useCases, estado } = montarDependencias({
    id: 'produto-3',
    nome: 'Suco',
    categoria: 'LANCHONETE',
    preco: '7.25',
    quantidade_estoque: 4,
    ativo: true,
  });

  const venda = await useCases.criarVendaPresencial({
    usuarioId: 'voluntario-1',
    dados: {
      itens: [{ produto_id: 'produto-3', quantidade: 2 }],
      forma_pagamento: 'DINHEIRO',
    },
  });

  assert.equal(venda.valor_total, 14.5);
  assert.equal(venda.tipo_venda, 'PRESENCIAL');
  assert.equal(estado.estoque, 2);
  assert.equal(estado.movimentos.length, 1);
  assert.equal(estado.movimentos[0].tipo, 'ENTRADA');
  assert.equal(estado.commit, true);
});
