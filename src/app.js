require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const { Usuario } = require('./models'); // Carrega modelos e relacionamentos
const errorHandler = require('./middlewares/errorHandler');

// Importação das rotas de autenticação (Semana 3)
const authRoutes = require('./routes');

const app = express();
app.use(express.json());

// Registro de Rotas
app.use('/auth', authRoutes);

// Rota inicial de verificação do status da API
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API AgnusGestao rodando com sucesso!' });
});

// Middleware Global de Tratamento de Erros (deve ficar após as rotas)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Autenticar e sincronizar tabelas com o PostgreSQL
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados realizada com sucesso!');
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    // --- SEED AUTOMÁTICO DO USUÁRIO ADMIN ---
    try {
      const adminExiste = await Usuario.findOne({ where: { email: 'admin@agnus.com' } });
      if (!adminExiste) {
        const senhaHash = await bcrypt.hash('123456', 10);
        await Usuario.create({
          nome: 'Administrador',
          email: 'admin@agnus.com',
          senha_hash: senhaHash,
          perfil: 'ADMIN'
        });
        console.log('👤 Usuário Admin inicial criado: admin@agnus.com / 123456');
      }
    } catch (err) {
      console.error('Erro ao criar usuário inicial:', err);
    }
    // ----------------------------------------

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Não foi possível conectar ao banco de dados:', error);
  });