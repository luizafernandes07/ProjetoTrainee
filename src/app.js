require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const { Usuario } = require('./models');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes');
const produtoRoutes = require('./routes/produtoRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const movimentacaoRoutes = require('./routes/movimentacaoRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();

// Configuração do CORS para permitir requisições do frontend local
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permite requisições de desenvolvimento
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/produtos', produtoRoutes);
app.use('/vendas', vendaRoutes);
app.use('/movimentacoes', movimentacaoRoutes);
app.use('/pagamentos', pagamentoRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API AgnusGestao rodando com sucesso!' });
});

app.use((req, res) => res.status(404).json({ mensagem: 'Endpoint não encontrado.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET precisa estar configurado no arquivo .env.');
  }

  await sequelize.authenticate();
  console.log('BD conectado com sucesso');

  await sequelize.sync({ alter: true });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const adminExiste = await Usuario.findOne({ where: { email: adminEmail } });
    if (!adminExiste) {
      await Usuario.create({
        nome: process.env.ADMIN_NAME || 'Administrador',
        email: adminEmail,
        senha_hash: await bcrypt.hash(adminPassword, 12),
        perfil: 'ADMIN',
      });
      console.log(`Usuário administrador inicial criado: ${adminEmail}`);
    }
  }

  app.listen(PORT, () => console.log(`servidor rodando na porta ${PORT}`));
};

if (require.main === module) {
  iniciarServidor().catch((error) => {
    console.error('Falha ao iniciar a API:', error.message);
    process.exit(1);
  });
}

module.exports = app;