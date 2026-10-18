const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  senha_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  perfil: {
    type: DataTypes.ENUM('ADMIN', 'VOLUNTARIO'),
    defaultValue: 'VOLUNTARIO',
  },
  // --- Colunas para Recuperação de Senha por E-mail (Semana 3) ---
  token_recuperacao: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  token_recuperacao_expira: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false,
});

module.exports = Usuario;