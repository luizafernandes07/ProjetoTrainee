const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venda = sequelize.define('Venda', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // usuario_id permanece por compatibilidade com bancos já criados; cliente_id é usado nos relacionamentos.
  usuario_id: { type: DataTypes.UUID, allowNull: true },
  cliente_id: { type: DataTypes.UUID, allowNull: true },
  vendedor_id: { type: DataTypes.UUID, allowNull: true },
  tipo_venda: { type: DataTypes.ENUM('ONLINE', 'PRESENCIAL'), allowNull: false, defaultValue: 'ONLINE' },
  valor_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  forma_pagamento: { type: DataTypes.ENUM('PIX', 'DINHEIRO'), allowNull: false, defaultValue: 'DINHEIRO' },
  cep: { type: DataTypes.STRING(8), allowNull: true },
  logradouro: { type: DataTypes.STRING, allowNull: true },
  bairro: { type: DataTypes.STRING, allowNull: true },
  cidade: { type: DataTypes.STRING, allowNull: true },
  uf: { type: DataTypes.STRING(2), allowNull: true },
  numero: { type: DataTypes.STRING, allowNull: true },
  complemento: { type: DataTypes.STRING, allowNull: true },
  precisa_troco: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  valor_troco_para: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  endereco_entrega: { type: DataTypes.TEXT, allowNull: true },
  observacao: { type: DataTypes.TEXT, allowNull: true },
  data_retirada_prevista: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('PENDENTE', 'CONCLUIDO', 'CANCELADO', 'AGUARDANDO_RETIRADA', 'AGUARDANDO_ENTREGA'), allowNull: false, defaultValue: 'AGUARDANDO_RETIRADA' },
}, { timestamps: true });

module.exports = Venda;
