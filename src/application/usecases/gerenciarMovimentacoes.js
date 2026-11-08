function criarGerenciadorMovimentacoes({ MovimentacaoFinanceira, Usuario, exportService }) {
  function erro(mensagem, status = 400) {
    return Object.assign(new Error(mensagem), { status });
  }

  async function listar() {
    return MovimentacaoFinanceira.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }],
      order: [['data_movimentacao', 'DESC']],
    });
  }

  async function obterResumo() {
    const movimentacoes = await MovimentacaoFinanceira.findAll({ attributes: ['tipo', 'valor'] });
    let entradasCentavos = 0;
    let saidasCentavos = 0;

    for (const movimentacao of movimentacoes) {
      const centavos = Math.round(Number(movimentacao.valor) * 100);
      if (!Number.isSafeInteger(centavos) || centavos < 0) {
        throw erro('Valor financeiro inválido armazenado no banco.', 500);
      }
      if (movimentacao.tipo === 'ENTRADA') entradasCentavos += centavos;
      if (movimentacao.tipo === 'SAIDA') saidasCentavos += centavos;
    }

    return {
      entradas: entradasCentavos / 100,
      saidas: saidasCentavos / 100,
      saldo: (entradasCentavos - saidasCentavos) / 100,
      quantidade_movimentacoes: movimentacoes.length,
    };
  }

  async function criar({ usuarioId, dados = {} }) {
    const { tipo, valor, descricao } = dados;
    const tipoNormalizado = String(tipo || '').toUpperCase();
    const valorNumerico = Number(valor);

    if (!['ENTRADA', 'SAIDA'].includes(tipoNormalizado) ||
        !Number.isFinite(valorNumerico) ||
        valorNumerico <= 0 ||
        typeof descricao !== 'string' ||
        !descricao.trim()) {
      throw erro('Tipo de movimentação ou valor inválido.');
    }

    return MovimentacaoFinanceira.create({
      usuario_id: usuarioId,
      tipo: tipoNormalizado,
      valor: valorNumerico,
      descricao: descricao.trim(),
      data_movimentacao: new Date(),
    });
  }

  async function excluir(id) {
    const movimentacao = await MovimentacaoFinanceira.findByPk(id);
    if (!movimentacao) throw erro('Movimentação não encontrada.', 404);
    if (movimentacao.venda_id) {
      throw erro('Esta movimentação pertence a uma venda. Para estornar, cancele a venda pelo controle de pedidos.', 409);
    }
    await movimentacao.destroy();
  }

  async function exportar(formato = 'excel') {
    const movimentacoes = await MovimentacaoFinanceira.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['data_movimentacao', 'DESC']],
    });

    if (formato === 'csv') {
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: 'relatorio_caixa_agnus.csv',
        body: exportService.gerarRelatorioCsv(movimentacoes),
      };
    }

    const buffer = await exportService.gerarRelatorioExcel(movimentacoes);
    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'relatorio_caixa_agnus.xlsx',
      body: buffer,
    };
  }

  return { listar, obterResumo, criar, excluir, exportar };
}

module.exports = criarGerenciadorMovimentacoes;
