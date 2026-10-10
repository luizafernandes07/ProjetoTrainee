const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimentacaoFinanceira = sequelize.define('MovimentacaoFinanceira', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('ENTRADA', 'SAIDA'),
    allowNull: false,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'movimentacoes_financeiras',
  timestamps: true,
  createdAt: 'data_movimentacao',
  updatedAt: false,
});

module.exports = MovimentacaoFinanceira;