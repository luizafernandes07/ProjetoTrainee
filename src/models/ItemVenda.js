const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemVenda = sequelize.define('ItemVenda', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  venda_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  produto_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'itens_venda',
  timestamps: false,
});

module.exports = ItemVenda;