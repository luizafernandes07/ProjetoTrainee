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
  tipo_venda: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PRESENCIAL',
  },
  status_pagamento: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PAGO',
  },
  pagamento_externo_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  pix_qr_code: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pix_qr_code_base64: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pix_ticket_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estoque_estornado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'vendas',
  timestamps: true,
  createdAt: 'data_venda',
  updatedAt: false,
});

module.exports = Venda;
