# AgnusGestao — Sistema de Gestão do Grupo de Oração Agnus Dei

Sistema de gerenciamento do catálogo, vendas, estoque e caixa do Grupo de Oração Agnus Dei, pertencente à Paróquia São Vicente Ferrer (Formiga - MG).

## 1. Tema e propósito

O sistema apoia o controle de produtos comercializados nos encontros, vendas presenciais e pedidos online, além do registro de entradas e saídas financeiras.

## 2. Perfis de acesso

- **ADMIN:** gerencia produtos e movimentações financeiras, consulta vendas e relatórios.
- **VOLUNTARIO:** consulta produtos, registra vendas presenciais e consulta apenas as próprias vendas.
- O cadastro público (`POST /auth/register`) cria somente usuários `VOLUNTARIO`. A criação de ADMIN é feita pelo seed configurado no ambiente, evitando elevação de privilégio pelo formulário público.

## 3. Entidades

- `Usuario`: autenticação, e-mail, hash de senha e perfil.
- `Produto`: catálogo, preço, categoria, estoque e situação.
- `Venda`: responsável, valor, forma/tipo de venda e estado do pagamento.
- `ItemVenda`: produtos, quantidades e preço unitário de cada venda.
- `MovimentacaoFinanceira`: entradas e saídas do caixa, incluindo vínculo com venda.

## 4. Tecnologias

Node.js, Express, PostgreSQL, Sequelize, Docker Compose, JWT, bcryptjs, Nodemailer, Axios e Mercado Pago. Relatórios são gerados com ExcelJS e CSV.

## 5. Como executar

### Pré-requisitos

- Docker e Docker Compose.
- Uma cópia do arquivo `.env.example` chamada `.env`.
- Credenciais SMTP para testar envio de recuperação de senha.
- Credenciais de teste do Mercado Pago para criar cobranças Pix.

### Configuração

1. Copie `.env.example` para `.env`.
2. Altere `DB_PASSWORD`, `JWT_SECRET` e `ADMIN_PASSWORD`.
3. Configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` e `MAIL_FROM`.
4. Configure `MERCADOPAGO_ACCESS_TOKEN` com credencial de teste.
5. Configure `MERCADOPAGO_WEBHOOK_SECRET` e `MERCADOPAGO_NOTIFICATION_URL` para receber notificações do Mercado Pago. A URL de notificação precisa estar acessível externamente (por exemplo, em ambiente de homologação).

### Subir os serviços

```bash
docker compose up --build
```

A API ficará disponível em `http://localhost:3000`. O endpoint `GET /` verifica o estado básico do servidor.

Para encerrar:

```bash
docker compose down
```

Para remover também os dados persistidos do PostgreSQL (ação destrutiva):

```bash
docker compose down -v
```

### Execução sem Docker

Com PostgreSQL disponível e `.env` configurado:

```bash
npm install
npm run dev
```

## 6. Semana 1 — Tema, escopo e repositório

Definição do problema, delimitação das funcionalidades, identificação dos perfis e entidades principais e criação do repositório do projeto.

## 7. Semana 2 — Modelagem, persistência e ambiente executável

- Modelos Sequelize para `Usuario`, `Produto`, `Venda`, `ItemVenda` e `MovimentacaoFinanceira`.
- Relacionamentos entre usuários, vendas, itens, produtos e movimentações.
- PostgreSQL como banco relacional.
- Dockerfile e Docker Compose para execução padronizada da API e do banco.
- Configuração de ambiente por variáveis, sem versionar o `.env`.

## 8. Semana 3 — Autenticação, perfis e recuperação de senha

- Login com JWT e validação de senha com bcryptjs.
- Middleware de autenticação e autorização por perfil.
- Cadastro público limitado ao perfil VOLUNTARIO.
- Recuperação de senha com token aleatório, armazenamento do hash do token e expiração de 30 minutos.
- Envio do link de redefinição por e-mail via Nodemailer/SMTP.
- O envio de e-mail depende de credenciais SMTP válidas configuradas no `.env`.

### Endpoints de autenticação

| Método | Endpoint                | Descrição                      |
| ------ | ----------------------- | ------------------------------ |
| POST   | `/auth/login`           | Autentica e retorna JWT        |
| POST   | `/auth/register`        | Cadastra usuário VOLUNTARIO    |
| POST   | `/auth/forgot-password` | Solicita e-mail de recuperação |
| POST   | `/auth/reset-password`  | Redefine senha com token       |

## 9. Semana 4 — CRUD e regras de negócio

### Usuários

| Método | Endpoint        | Permissão                  |
| ------ | --------------- | -------------------------- |
| GET    | `/usuarios`     | ADMIN                      |
| GET    | `/usuarios/:id` | ADMIN                      |
| POST   | `/usuarios`     | ADMIN (cria VOLUNTARIO)    |
| PUT    | `/usuarios/:id` | ADMIN                      |
| DELETE | `/usuarios/:id` | ADMIN (desativação lógica) |

A rota pública `/auth/register` também cadastra somente VOLUNTARIO. O perfil não pode ser alterado pelo endpoint de atualização. Usuários desativados não conseguem autenticar, e a exclusão lógica preserva os vínculos históricos.

### Produtos

| Método | Endpoint        | Permissão   |
| ------ | --------------- | ----------- |
| GET    | `/produtos`     | Autenticado |
| GET    | `/produtos/:id` | Autenticado |
| POST   | `/produtos`     | ADMIN       |
| PUT    | `/produtos/:id` | ADMIN       |
| DELETE | `/produtos/:id` | ADMIN       |

### Vendas

| Método | Endpoint             | Permissão                                 |
| ------ | -------------------- | ----------------------------------------- |
| POST   | `/vendas/presencial` | VOLUNTARIO ou ADMIN                       |
| POST   | `/vendas/online`     | Autenticado                               |
| GET    | `/vendas`            | ADMIN vê todas; VOLUNTARIO vê as próprias |
| GET    | `/vendas/:id`        | ADMIN; VOLUNTARIO somente a própria venda |

Cada venda grava seus itens em `ItemVenda`. A validação de quantidade e estoque e a baixa de estoque são realizadas em transação de banco de dados. Na venda presencial, a movimentação de entrada é registrada junto com a venda. Na venda online, o estoque fica reservado enquanto o pagamento Pix aguarda confirmação.

### Corpo de exemplo — venda presencial

```json
{
  "itens": [
    {
      "produto_id": "UUID_DO_PRODUTO",
      "quantidade": 2
    }
  ],
  "forma_pagamento": "DINHEIRO"
}
```

Formas aceitas: `DINHEIRO`, `PIX` e `CARTAO`.

## 10. Semana 5 — Operações financeiras e integração externa

### Movimentações financeiras

| Método | Endpoint                                | Permissão |
| ------ | --------------------------------------- | --------- |
| GET    | `/movimentacoes`                        | ADMIN     |
| POST   | `/movimentacoes`                        | ADMIN     |
| DELETE | `/movimentacoes/:id`                    | ADMIN     |
| GET    | `/movimentacoes/exportar?formato=excel` | ADMIN     |
| GET    | `/movimentacoes/exportar?formato=csv`   | ADMIN     |

Corpo de exemplo para lançamento manual:

```json
{
  "tipo": "ENTRADA",
  "valor": 120.0,
  "descricao": "Oferta do encontro"
}
```

`tipo` aceita `ENTRADA` ou `SAIDA`, e `valor` deve ser positivo.

### Integração com Mercado Pago — Pix

O endpoint `POST /vendas/online` cria um pedido, registra os itens, reserva o estoque e solicita uma cobrança Pix à API do Mercado Pago. A resposta inclui os dados retornados pelo provedor, como QR Code, código Pix e link de pagamento (quando disponibilizados pela API).

Corpo de exemplo:

```json
{
  "itens": [
    {
      "produto_id": "UUID_DO_PRODUTO",
      "quantidade": 1
    }
  ]
}
```

A confirmação do pagamento é recebida em:

`POST /pagamentos/mercadopago/webhook`

O webhook valida a assinatura configurada, consulta o pagamento diretamente na API do Mercado Pago e atualiza a venda. Quando o pagamento é aprovado, registra a entrada no caixa. Em estados de pagamento cancelado/rejeitado/estornado, o estoque reservado é devolvido. Para testar a integração, são necessárias credenciais de teste do Mercado Pago e uma URL pública de notificação configurada no painel do provedor.

## 11. Collection obrigatória do Postman

Arquivo: `docs/postman/Agnus_Gestao_Postman_Collection.json`

### Importação

1. Abrir o Postman.
2. Selecionar **Import**.
3. Escolher o arquivo JSON acima.
4. Confirmar a importação.
5. Manter `baseUrl` como `http://localhost:3000` ou ajustar para o ambiente de avaliação.

A collection possui pastas para saúde da API, autenticação, produtos, vendas, movimentações e testes de permissões. Os logins capturam os tokens JWT nas variáveis `token_admin` e `token_voluntario`.

### Dados de teste

O usuário ADMIN inicial é criado com `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no `.env`. Não há credenciais reais incluídas na collection. Após cadastrar um voluntário por `/auth/register`, use o mesmo e-mail e senha no login de VOLUNTARIO.

Para testar recuperação de senha, configure SMTP. Para redefinir, use o token recebido no e-mail. Para testar pagamento Pix, configure o token de teste do Mercado Pago e o webhook.

## 12. Variáveis de ambiente

| Variável                                                        | Finalidade                         |
| --------------------------------------------------------------- | ---------------------------------- | --- | -------------- | ------------------------------------------------------- |
| `PORT`                                                          | Porta da API                       |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`       | Conexão PostgreSQL                 |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                                  | Assinatura e validade do JWT       |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`                   | Seed do administrador              |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Envio de e-mail                    |
| `MERCADOPAGO_ACCESS_TOKEN`                                      | Credencial da API Mercado Pago     |
| `MERCADOPAGO_WEBHOOK_SECRET`                                    | Validação de assinatura do webhook |
| `MERCADOPAGO_NOTIFICATION_URL`                                  | URL pública para notificações      |
| `FRONTEND_ORIGIN`                                               | Origem autorizada pelo CORS        | \n  | `FRONTEND_URL` | Base do link de redefinição de senha enviado por e-mail |

**Importante:** nunca envie `.env`, tokens ou credenciais para o Git. O arquivo `.env.example` contém somente valores ilustrativos.

## 13. Situação do cronograma

- **Semana 1:** tema, escopo, modelagem inicial e repositório.
- **Semana 2:** modelagem, persistência e execução com Docker.
- **Semana 3:** autenticação, perfis e recuperação de senha por e-mail.
- **Semana 4:** CRUD das entidades centrais e regras de negócio.
- **Semana 5:** operações financeiras e integração Pix com Mercado Pago.

As funcionalidades que dependem de serviços externos só podem ser consideradas testadas após configurar credenciais válidas e executar os fluxos no ambiente de homologação.

## Semana 5 — Conclusão dos CRUDs e Exportação de Relatórios Financeiros

Nesta etapa final da Semana 5, consolidamos as operações de CRUD do sistema, aplicando regras rigorosas de **integridade e imutabilidade contábil**, além de disponibilizar a exportação de relatórios financeiros consolidados em formatos **Excel (`.xlsx`)** e **CSV (`.csv`)**.

---

### 8.1. Módulo Financeiro & Regras de Integridade Contábil (`/movimentacoes`)

Para preservar a rastreabilidade e a transparência das finanças do grupo de oração, o módulo adota o princípio de **auditabilidade contábil**:

- **Sem Atualização Direta (`PUT`/`PATCH`):** Lançamentos financeiros **não podem ser editados**. Em caso de erro de digitação ou lançamento indevido, a correção deve ser feita via **estorno/remoção** (`DELETE`).
- **Lançamentos Manuais:** Permite registrar entradas (doações, ofertas) e saídas (despesas operacionais), vinculando cada operação ao usuário responsável.

#### Endpoints do Módulo Financeiro

|  Método  | Endpoint                                |       Proteção / RBAC        | Descrição                                                        |
| :------: | :-------------------------------------- | :--------------------------: | :--------------------------------------------------------------- |
|  `GET`   | `/movimentacoes`                        | Autenticado (`Bearer Token`) | Lista o histórico de entradas e saídas ordenado por data.        |
|  `POST`  | `/movimentacoes`                        |    Autenticado (`ADMIN`)     | Registra uma nova entrada ou saída manual no caixa.              |
| `DELETE` | `/movimentacoes/:id`                    |    Autenticado (`ADMIN`)     | Estorna/remove um lançamento financeiro incorreto.               |
|  `GET`   | `/movimentacoes/exportar?formato=excel` |    Autenticado (`ADMIN`)     | Gera e faz o download do relatório formatado em Excel (`.xlsx`). |
|  `GET`   | `/movimentacoes/exportar?formato=csv`   |    Autenticado (`ADMIN`)     | Gera e faz o download do extrato delimitado em CSV (`.csv`).     |

---

### 8.2. Serviços de Exportação (`src/services/exportService.js`)

- **Relatório Excel (`.xlsx`):** Desenvolvido com a biblioteca `exceljs`. Conta com layout corporativo (cabeçalho destacado em azul, linhas zebradas para facilitar a leitura, formatação monetária em `R$ #,##0.00`) e linha de resumo final contendo **Total de Entradas**, **Total de Saídas** e **Saldo Final em Caixa**.
- **Relatório CSV (`.csv`):** Formato em texto puro delimitado por ponto e vírgula (`;`), leve e otimizado para importação direta em planilhas ou sistemas legados.
- **Prevenção de Cache:** Respostas de exportação e listagem incluem os cabeçalhos HTTP `Cache-Control: no-cache` e `Pragma: no-cache` para garantir que Postman e clientes web sempre recebam dados atualizados.

---

## Postman Collection Obrigatória para Avaliação

A coleção de requisições do Postman para testes e avaliação da API está disponível na raiz do repositório:

**`agnus_gestao_collection.json`**

### Instruções para Importação e Execução

1. **Como Importar:**
   - Abra o Postman e clique em **Import** (canto superior esquerdo).
   - Arraste o arquivo `agnus_gestao_collection.json` ou selecione-o na pasta raiz do projeto.
2. **Fluxo de Autenticação Automática:**
   - Execute a requisição **`1.1 Login - ADMIN`** na pasta `1. Autenticação & Recuperação de Senha`.
   - O script de teste (_Test Script_) do Postman salvará automaticamente o token JWT na variável da coleção `{{token_admin}}`.
   - As demais requisições (Usuários, Produtos, Vendas e Financeiro) utilizarão esse token automaticamente.
3. **Estrutura de Pastas na Collection:**
   - `1. Autenticação & Recuperação de Senha` — Login (Admin/Voluntário), Esqueci a Senha e Redefinir Senha.
   - `2. Usuários` — Cadastro e listagem de usuários.
   - `3. Produtos (Estoque)` — CRUD completo de produtos (`GET`, `POST`, `PUT`, `DELETE`).
   - `4. Vendas` — Registro de vendas com baixa atômica no estoque e registro do histórico.
   - `5. Financeiro & Relatórios` — Consulta de caixa, lançamentos manuais, estornos e exportação (Excel/CSV).
