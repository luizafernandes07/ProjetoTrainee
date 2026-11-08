function criarGerenciadorProdutos({ Produto }) {
  function erro(mensagem, status = 400) {
    return Object.assign(new Error(mensagem), { status });
  }

  async function listar() {
    return Produto.findAll({ where: { ativo: true }, order: [['nome', 'ASC']] });
  }

  async function buscar(id) {
    const produto = await Produto.findOne({ where: { id, ativo: true } });
    if (!produto) throw erro('Produto não encontrado.', 404);
    return produto;
  }

  async function criar(dados = {}) {
    const { nome, descricao, preco, estoque, quantidade_estoque, categoria } = dados;
    const precoNumerico = Number(preco);
    const estoqueInformado = quantidade_estoque !== undefined ? quantidade_estoque : estoque;
    const estoqueNumerico = estoqueInformado === undefined ? 0 : Number(estoqueInformado);

    if (typeof nome !== 'string' || !nome.trim() || preco === undefined || !Number.isFinite(precoNumerico) || precoNumerico <= 0) {
      throw erro('Nome e preço positivo do produto são obrigatórios.');
    }
    if (!Number.isInteger(estoqueNumerico) || estoqueNumerico < 0) {
      throw erro('O estoque deve ser um número inteiro não negativo.');
    }
    if (descricao !== undefined && descricao !== null && typeof descricao !== 'string') {
      throw erro('A descrição deve ser um texto.');
    }
    if (categoria !== undefined && typeof categoria !== 'string') {
      throw erro('A categoria deve ser um texto.');
    }

    return Produto.create({
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : null,
      preco: precoNumerico,
      quantidade_estoque: estoqueNumerico,
      categoria: categoria && categoria.trim() ? categoria.trim() : 'ARTIGO_RELIGIOSO',
    });
  }

  async function atualizar(id, dados = {}) {
    const produto = await buscar(id);
    const { nome, descricao, preco, estoque, quantidade_estoque, categoria } = dados;
    const atualizacao = {};

    if (nome !== undefined) {
      if (typeof nome !== 'string' || !nome.trim()) throw erro('O nome deve ser um texto não vazio.');
      atualizacao.nome = nome.trim();
    }
    if (descricao !== undefined) {
      if (descricao !== null && typeof descricao !== 'string') throw erro('A descrição deve ser um texto.');
      atualizacao.descricao = descricao ? descricao.trim() : null;
    }
    if (preco !== undefined) {
      const valor = Number(preco);
      if (!Number.isFinite(valor) || valor <= 0) throw erro('O preço informado deve ser um número positivo.');
      atualizacao.preco = valor;
    }
    const estoqueInformado = quantidade_estoque !== undefined ? quantidade_estoque : estoque;
    if (estoqueInformado !== undefined) {
      const valor = Number(estoqueInformado);
      if (!Number.isInteger(valor) || valor < 0) throw erro('O estoque deve ser um número inteiro não negativo.');
      atualizacao.quantidade_estoque = valor;
    }
    if (categoria !== undefined) {
      if (typeof categoria !== 'string' || !categoria.trim()) throw erro('A categoria deve ser um texto não vazio.');
      atualizacao.categoria = categoria.trim();
    }

    await produto.update(atualizacao);
    return produto;
  }

  async function desativar(id) {
    const produto = await buscar(id);
    await produto.update({ ativo: false });
    return produto;
  }

  return { listar, buscar, criar, atualizar, desativar };
}

module.exports = criarGerenciadorProdutos;
