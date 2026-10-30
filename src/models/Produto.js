const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  categoria: {
    type: DataTypes.STRING, // Altere de ENUM para STRING
    allowNull: false,
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantidade_estoque: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'produtos',
  timestamps: false,
});

module.exports = Produto;