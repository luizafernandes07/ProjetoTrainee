function artigoReligioso(categoria = '') {
  const normalizada = String(categoria)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  return [
    'RELIG', 'LOJA', 'LOJINHA', 'TERCO',
    'BIBLIA', 'CRUCIFIXO', 'IMAGEM', 'SANTO',
  ].some((termo) => normalizada.includes(termo));
}

module.exports = { artigoReligioso };
