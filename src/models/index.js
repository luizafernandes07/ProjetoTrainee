const Usuario = require('./Usuario');
const Produto = require('./Produto');
const Venda = require('./Venda');
const ItemVenda = require('./ItemVenda');
const MovimentacaoFinanceira = require('./MovimentacaoFinanceira');

// Relacionamentos conforme o DER
Usuario.hasMany(Venda, { foreignKey: 'usuario_id' });
Venda.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasMany(MovimentacaoFinanceira, { foreignKey: 'usuario_id' });
MovimentacaoFinanceira.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Venda.hasMany(ItemVenda, { foreignKey: 'venda_id' });
ItemVenda.belongsTo(Venda, { foreignKey: 'venda_id' });

Produto.hasMany(ItemVenda, { foreignKey: 'produto_id' });
ItemVenda.belongsTo(Produto, { foreignKey: 'produto_id' });

module.exports = {
  Usuario,
  Produto,
  Venda,
  ItemVenda,
  MovimentacaoFinanceira,
};