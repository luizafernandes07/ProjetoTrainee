const ExcelJS = require('exceljs');

/**
 * Gera um buffer de arquivo Excel (.xlsx) profissional e estilizado
 */
exports.gerarRelatorioExcel = async (movimentacoes) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório Financeiro');

  // 1. Larguras das colunas
  worksheet.columns = [
    { header: 'Data', key: 'data', width: 22 },
    { header: 'Tipo', key: 'tipo', width: 16 },
    { header: 'Descrição', key: 'descricao', width: 45 },
    { header: 'Valor (R$)', key: 'valor', width: 20 },
    { header: 'Responsável', key: 'usuario', width: 28 },
  ];

  // 2. Estilo do Cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' } // Azul Marinho Corporativo
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let totalEntradas = 0;
  let totalSaidas = 0;

  // 3. Preenchimento de Dados
  movimentacoes.forEach((m, index) => {
    const valorNum = parseFloat(m.valor) || 0;
    if (m.tipo === 'ENTRADA') totalEntradas += valorNum;
    if (m.tipo === 'SAIDA') totalSaidas += valorNum;

    const row = worksheet.addRow({
      data: new Date(m.data_movimentacao).toLocaleString('pt-BR'),
      tipo: m.tipo,
      descricao: m.descricao || 'Sem descrição',
      valor: valorNum,
      usuario: m.usuario ? m.usuario.nome : 'Sistema/Admin'
    });

    row.height = 22;
    row.font = { name: 'Calibri', size: 10 };

    // Fundo zebrado
    if (index % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
    }

    // Alinhamentos
    row.getCell('data').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('tipo').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('descricao').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('valor').alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell('usuario').alignment = { vertical: 'middle', horizontal: 'left' };

    // Cores para Entrada / Saída
    if (m.tipo === 'ENTRADA') {
      row.getCell('tipo').font = { name: 'Calibri', size: 10, bold: true, color: { argb: '2E7D32' } };
    } else if (m.tipo === 'SAIDA') {
      row.getCell('tipo').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'C62828' } };
    }
  });

  // Formatação da coluna de Moeda
  worksheet.getColumn('valor').numFmt = 'R$ #,##0.00';

  // 4. Seção de Totais Consolidados
  worksheet.addRow([]); // Espaço

  const rowEntradas = worksheet.addRow(['', '', 'TOTAL ENTRADAS:', totalEntradas, '']);
  rowEntradas.getCell(3).alignment = { horizontal: 'right' };
  rowEntradas.getCell(3).font = { bold: true };
  rowEntradas.getCell(4).font = { bold: true, color: { argb: '2E7D32' } };

  const rowSaidas = worksheet.addRow(['', '', 'TOTAL SAÍDAS:', totalSaidas, '']);
  rowSaidas.getCell(3).alignment = { horizontal: 'right' };
  rowSaidas.getCell(3).font = { bold: true };
  rowSaidas.getCell(4).font = { bold: true, color: { argb: 'C62828' } };

  const saldo = totalEntradas - totalSaidas;
  const rowSaldo = worksheet.addRow(['', '', 'SALDO FINAL EM CAIXA:', saldo, '']);
  rowSaldo.getCell(3).alignment = { horizontal: 'right' };
  rowSaldo.getCell(3).font = { bold: true, size: 11 };
  rowSaldo.getCell(4).font = { bold: true, size: 11, color: { argb: '1F4E78' } };

  return await workbook.xlsx.writeBuffer();
};

/**
 * Gera uma string no formato CSV a partir das movimentações
 */
exports.gerarRelatorioCsv = (movimentacoes) => {
  let csv = 'Data;Tipo;Descricao;Valor;Responsavel\n';

  movimentacoes.forEach((m) => {
    const data = new Date(m.data_movimentacao).toLocaleString('pt-BR');
    const tipo = m.tipo;
    const desc = (m.descricao || '').replace(/;/g, ',');
    const valor = parseFloat(m.valor).toFixed(2);
    const usuario = m.usuario ? m.usuario.nome : 'Sistema/Admin';

    csv += `${data};${tipo};${desc};${valor};${usuario}\n`;
  });

  return csv;
};