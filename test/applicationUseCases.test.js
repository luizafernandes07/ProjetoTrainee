const { test } = require('node:test');
const assert = require('node:assert/strict');
const criarGerenciadorProdutos = require('../src/application/usecases/gerenciarProdutos');
const criarGerenciadorMovimentacoes = require('../src/application/usecases/gerenciarMovimentacoes');
const criarGerenciadorUsuarios = require('../src/application/usecases/gerenciarUsuarios');

test('caso de uso de produtos valida e persiste estoque', async () => {
  let salvo;
  const produtoMock = {
    async create(dados) { salvo = { id: 'p1', ...dados }; return salvo; },
    async findOne() { return salvo; },
  };
  const produtos = criarGerenciadorProdutos({ Produto: produtoMock });
  const criado = await produtos.criar({
    nome: 'Terço',
    preco: 20,
    quantidade_estoque: 4,
    categoria: 'ARTIGO_RELIGIOSO',
  });
  assert.equal(criado.nome, 'Terço');
  assert.equal(criado.quantidade_estoque, 4);
  await assert.rejects(
    produtos.criar({ nome: 'Produto', preco: 10, estoque: -1 }),
    (error) => error.status === 400
  );
});

test('caso de uso financeiro calcula saldo a partir das movimentações', async () => {
  const financeiro = criarGerenciadorMovimentacoes({
    MovimentacaoFinanceira: {
      async findAll() {
        return [
          { tipo: 'ENTRADA', valor: '50.00' },
          { tipo: 'SAIDA', valor: '12.35' },
          { tipo: 'ENTRADA', valor: '5.50' },
        ];
      },
    },
    Usuario: {},
    exportService: {},
  });
  assert.deepEqual(await financeiro.obterResumo(), {
    entradas: 55.5,
    saidas: 12.35,
    saldo: 43.15,
    quantidade_movimentacoes: 3,
  });
});

test('caso de uso de usuário cria voluntário sem aceitar perfil enviado pelo cliente', async () => {
  let criado;
  const Usuario = {
    async findOne() { return null; },
    async create(dados) { criado = { id: 'u1', ...dados }; return criado; },
  };
  const bcrypt = { async hash(senha) { return `hash:${senha}`; } };
  const usuarios = criarGerenciadorUsuarios({ Usuario, bcrypt });
  const resultado = await usuarios.criarVoluntario({
    nome: 'Pessoa Teste',
    email: 'pessoa@example.com',
    senha: 'SenhaTeste123',
    perfil: 'ADMIN',
  });
  assert.equal(criado.perfil, 'VOLUNTARIO');
  assert.equal(criado.senha_hash, 'hash:SenhaTeste123');
  assert.equal(resultado.perfil, 'VOLUNTARIO');
});
