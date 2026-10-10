const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venda = sequelize.define('Venda', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  forma_pagamento: {
    type: DataTypes.ENUM('DINHEIRO', 'PIX', 'CARTAO'),
    allowNull: false,
  },
}, {
  tableName: 'vendas',
  timestamps: true,
  createdAt: 'data_venda',
  updatedAt: false,
});

module.exports = Venda;