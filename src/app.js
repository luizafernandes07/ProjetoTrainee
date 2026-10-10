const express = require('express');
const sequelize = require('./config/database');
require('./models'); // Carrega modelos e relacionamentos
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

// Rota inicial de verificação do status da API
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API AgnusGestao rodando com sucesso!' });
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Autenticar e sincronizar tabelas com o PostgreSQL
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados realizada com sucesso!');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Não foi possível conectar ao banco de dados:', error);
  });