require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const { Usuario } = require('./models');
const errorHandler = require('./middlewares/errorHandler');
const openapi = require('../docs/openapi.json');

// Roteador Unificado
const routes = require('./routes');

const app = express();

// Configuração de Origens Permitidas (CORS)
const allowedOrigins = [
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rota raiz de verificação.
app.get('/', (req, res) => res.status(200).json({
  nome: 'AgnusGestao API',
  status: 'ok',
  versao: '1.0.0',
  documentacao: '/api/docs'
}));

app.get('/api/docs', (req, res) => res.status(200).json(openapi));

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: 'ok', database: 'ok' });
  } catch {
    return res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

// Rotas versionadas e compatibilidade sem prefixo.
app.use('/api', routes);
app.use('/', routes);

// 2. Tratamento de rotas inexistentes (404) — Mantenha sempre no FINAL
app.use((req, res) => res.status(404).json({ mensagem: 'Endpoint não encontrado.' }));
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3002);

// Inicialização do Servidor e Banco de Dados
const iniciarServidor = async () => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET precisa ser configurado e possuir pelo menos 32 caracteres.');
    }
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) {
      throw new Error('ADMIN_PASSWORD precisa ser configurado e possuir pelo menos 8 caracteres.');
    }

    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados realizada com sucesso!');

    await sequelize.sync({ alter: true });

    // Compatibilidade com bancos antigos: venda presencial nao possui cliente.
    await sequelize.query('ALTER TABLE IF EXISTS "Vendas" ALTER COLUMN "cliente_id" DROP NOT NULL');

    // Seed do Administrador Inicial
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agnus.com';
    const adminSenha = process.env.ADMIN_PASSWORD;

    let adminExiste = await Usuario.findOne({ where: { email: adminEmail } });

    if (!adminExiste) {
      const senhaHash = await bcrypt.hash(adminSenha, 10);
      await Usuario.create({
        nome: process.env.ADMIN_NAME || 'Administrador',
        email: adminEmail,
        senha_hash: senhaHash,
        perfil: 'ADMIN'
      });
      console.log(`👤 Utilizador Admin criado: ${adminEmail}`);
    } else {
      console.log(`👤 Utilizador Admin já configurado: ${adminEmail}`);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar a API:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  iniciarServidor();
}

module.exports = app;
