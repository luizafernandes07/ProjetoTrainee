const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Produto = require('./Produto');
const Venda = require('./Venda');
const ItemVenda = require('./ItemVenda');
const MovimentacaoFinanceira = require('./MovimentacaoFinanceira');

// Relacionamentos
Usuario.hasMany(Venda, { foreignKey: 'cliente_id', as: 'vendas' });
Venda.belongsTo(Usuario, { foreignKey: 'cliente_id', as: 'cliente' });
Usuario.hasMany(Venda, { foreignKey: 'vendedor_id', as: 'vendasPresenciais' });
Venda.belongsTo(Usuario, { foreignKey: 'vendedor_id', as: 'vendedor' });

Venda.hasMany(ItemVenda, { foreignKey: 'venda_id', as: 'itens' });
ItemVenda.belongsTo(Venda, { foreignKey: 'venda_id' });

Produto.hasMany(ItemVenda, { foreignKey: 'produto_id' });
ItemVenda.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

Usuario.hasMany(MovimentacaoFinanceira, { foreignKey: 'usuario_id', as: 'movimentacoes' });
MovimentacaoFinanceira.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Venda.hasOne(MovimentacaoFinanceira, { foreignKey: 'venda_id', as: 'movimentacaoFinanceira' });
MovimentacaoFinanceira.belongsTo(Venda, { foreignKey: 'venda_id', as: 'venda' });

module.exports = {
  sequelize,
  Usuario,
  Produto,
  Venda,
  ItemVenda,
  MovimentacaoFinanceira,
};