const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  senha_hash: { type: DataTypes.STRING, allowNull: false },
  perfil: { type: DataTypes.ENUM('ADMIN', 'VOLUNTARIO', 'CLIENTE'), allowNull: false, defaultValue: 'CLIENTE' },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  token_recuperacao: { type: DataTypes.STRING(64), allowNull: true },
  token_recuperacao_expira: { type: DataTypes.DATE, allowNull: true },
});

module.exports = Usuario;
