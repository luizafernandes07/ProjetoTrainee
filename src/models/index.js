const Usuario = require('./Usuario');
const Produto = require('./Produto');
const Venda = require('./Venda');
const ItemVenda = require('./ItemVenda');
const MovimentacaoFinanceira = require('./MovimentacaoFinanceira');

// Usuario <-> Venda
Usuario.hasMany(Venda, { foreignKey: 'usuario_id', as: 'vendas' });
Venda.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'vendedor' });

// Usuario <-> MovimentacaoFinanceira
Usuario.hasMany(MovimentacaoFinanceira, { foreignKey: 'usuario_id', as: 'movimentacoes' });
MovimentacaoFinanceira.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Venda <-> ItemVenda
Venda.hasMany(ItemVenda, { foreignKey: 'venda_id', as: 'itens' });
ItemVenda.belongsTo(Venda, { foreignKey: 'venda_id', as: 'venda' });

// Produto <-> ItemVenda
Produto.hasMany(ItemVenda, { foreignKey: 'produto_id', as: 'itens_venda' });
ItemVenda.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

// Venda <-> MovimentacaoFinanceira
Venda.hasMany(MovimentacaoFinanceira, { foreignKey: 'venda_id', as: 'movimentacoes' });
MovimentacaoFinanceira.belongsTo(Venda, { foreignKey: 'venda_id', as: 'venda' });

module.exports = {
  Usuario,
  Produto,
  Venda,
  ItemVenda,
  MovimentacaoFinanceira,
};