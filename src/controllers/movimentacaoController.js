const { MovimentacaoFinanceira, Usuario } = require('../models');
const exportService = require('../services/exportService');

// 1. Listar movimentações ordenadas por data_movimentacao
const listarMovimentacoes = async (req, res, next) => {
  try {
    const movimentacoes = await MovimentacaoFinanceira.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }],
      order: [['data_movimentacao', 'DESC']],
    });
    return res.status(200).json(movimentacoes);
  } catch (error) {
    next(error);
  }
};

// 2. Criar movimentação manual no caixa
const criarMovimentacao = async (req, res, next) => {
  try {
    const { tipo, valor, descricao } = req.body;

    if (!['ENTRADA', 'SAIDA'].includes(tipo) || valor <= 0) {
      return res.status(400).json({ mensagem: 'Tipo de movimentação ou valor inválido.' });
    }

    const novaMovimentacao = await MovimentacaoFinanceira.create({
      usuario_id: req.usuario.id,
      tipo,
      valor,
      descricao,
      data_movimentacao: new Date()
    });

    return res.status(201).json(novaMovimentacao);
  } catch (error) {
    next(error);
  }
};

// 3. Excluir/Estornar movimentação
const excluirMovimentacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movimentacao = await MovimentacaoFinanceira.findByPk(id);

    if (!movimentacao) {
      return res.status(404).json({ mensagem: 'Movimentação não encontrada.' });
    }

    await movimentacao.destroy();
    return res.status(200).json({ mensagem: 'Movimentação removida com sucesso.' });
  } catch (error) {
    next(error);
  }
};

// 4. Exportar relatório em Excel (.xlsx) ou CSV
const exportarRelatorio = async (req, res, next) => {
  try {
    const { formato } = req.query; // 'excel' ou 'csv'

    // Busca todas as movimentações incluindo os dados do usuário responsável

const movimentacoes = await MovimentacaoFinanceira.findAll({
  include: [{ model: Usuario, as: 'usuario', attributes: ['nome', 'email'] }],
  order: [['data_movimentacao', 'DESC']]
});

    if (formato === 'csv') {
      const csvData = exportService.gerarRelatorioCsv(movimentacoes);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio_caixa_agnus.csv"');
      return res.status(200).send(csvData);
    }

    // Padrão: Download em formato Excel (.xlsx)
    const excelBuffer = await exportService.gerarRelatorioExcel(movimentacoes);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_caixa_agnus.xlsx"');
    return res.status(200).send(excelBuffer);

  } catch (error) {
    next(error);
  }
};

// Exporta todas as funções do controller unificadas
module.exports = {
  listarMovimentacoes,
  criarMovimentacao,
  excluirMovimentacao,
  exportarRelatorio
};