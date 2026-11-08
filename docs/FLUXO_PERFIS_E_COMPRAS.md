# Fluxo de perfis, loja e vendas

## Perfis e funcionalidades

- `CLIENTE`: consulta o catálogo, compra online somente artigos religiosos e consulta as próprias compras.
- `VOLUNTARIO`: registra venda presencial de artigos religiosos e produtos da lanchonete no PDV. Não consulta histórico geral nem altera status de pedidos.
- `ADMIN`: gerencia produtos e voluntários, registra vendas presenciais, consulta vendas, altera status e administra caixa e relatórios.

O cadastro público cria sempre `CLIENTE`. O `ADMIN` cadastra usuários `VOLUNTARIO`. O backend valida o perfil em cada rota protegida.

## Regras de compra

O cliente não compra alimentos ou bebidas pela loja online. O endpoint online valida novamente a categoria de cada item, mesmo que alguém tente chamar a API diretamente. O pedido exige CEP válido, número do endereço e forma de pagamento `PIX` ou `DINHEIRO`. O complemento é opcional. Para pagamento em dinheiro, o cliente pode informar se precisa de troco e o valor para o qual precisa de troco.

O endereço é consultado no ViaCEP e o pedido é registrado com status `AGUARDANDO_ENTREGA`. O pagamento é realizado na entrega. Não existe integração Mercado Pago.

A venda presencial é registrada como `CONCLUIDO`, baixa o estoque e gera uma entrada no caixa. O cancelamento administrativo devolve os produtos ao estoque e estorna a movimentação financeira vinculada à venda presencial.

## Endpoints principais

| Método | Endpoint | Permissão | Finalidade |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Cadastro de CLIENTE |
| POST | `/api/auth/login` | Público | Login |
| POST | `/api/auth/forgot-password` | Público | Solicitar e-mail de recuperação |
| POST | `/api/auth/reset-password` | Público | Redefinir senha com token válido |
| GET | `/api/produtos` | Público | Consultar catálogo |
| POST/PUT/DELETE | `/api/produtos` e `/api/produtos/:id` | ADMIN | Gerenciar produtos |
| GET | `/api/cep/:cep` | Público | Consultar ViaCEP |
| POST | `/api/vendas/online` | CLIENTE | Criar pedido com entrega |
| GET | `/api/vendas/minhas-compras` | CLIENTE | Consultar os próprios pedidos |
| POST | `/api/vendas/presencial` | ADMIN, VOLUNTARIO | Registrar venda no PDV |
| GET | `/api/vendas` | ADMIN | Consultar todas as vendas |
| PATCH | `/api/vendas/:id/status` | ADMIN | Atualizar status |
| GET/POST/PUT/DELETE | `/api/usuarios` e `/api/usuarios/:id` | ADMIN | Gerenciar usuários e voluntários |
| GET/POST/DELETE | `/api/movimentacoes` e subrotas | ADMIN | Gerenciar caixa e relatórios |

A lista completa, schemas, exemplos e respostas estão em `docs/openapi.json` e na collection `agnus_gestao_collection.json`.

## Portas

- Backend: `3002`
- PostgreSQL no host: `5433`; dentro do Compose: `db:5432`
- Frontend: `5174`

## Recuperação de senha por e-mail

O backend lê `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS` e `MAIL_FROM`. Para Gmail, use `smtp.gmail.com`, porta `587`, `MAIL_SECURE=false` e uma senha de aplicativo do Google. O link aponta para `/redefinir-senha?token=...`; o token fica armazenado como hash e expira em 30 minutos.

## Execução

1. Copie `.env.example` para `.env` e configure os valores locais.
2. Execute `docker compose up --build`.
3. Inicie o frontend em `http://localhost:5174`.
4. A API responde em `http://localhost:3002/`.

Não use `docker compose down -v`, pois isso remove o volume e os dados persistidos do PostgreSQL.
