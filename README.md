
# AgnusGestao - Sistema de Gestão do Grupo de Oração Agnus Dei

Sistema de gerenciamento para controle de caixa, estoque e vendas do Grupo de Oração Agnus Dei, pertencente à Paróquia São Vicente Ferrer (Formiga - MG).

## 1. Tema e Propósito

O **AgnusGestao** enquadra-se na categoria de **Sistema de Gerenciamento**. Seu propósito é estruturar o controle financeiro do grupo de oração através da gestão do catálogo e venda de produtos (alimentos, bebidas, terços, camisetas e artigos religiosos) comercializados nos encontros, além de gerenciar as entradas e saídas de recursos do caixa do grupo.

## 2. Perfis de Acesso e Permissões

- **ADMIN (Coordenador):** Acesso completo ao sistema. Pode gerenciar voluntários, cadastrar e alterar produtos, registrar entradas/saídas do caixa financeiro e emitir relatórios.
- **VOLUNTARIO (Membro Servidor):** Acesso restrito à consulta do catálogo de produtos e ao registro de vendas efetuadas durante os encontros.

## 3. Entidades de Negócio

1. **Usuario:** Cadastro de membros, voluntários e coordenadores (utilizado para autenticação JWT e permissões de acesso).
2. **Produto:** Cadastro dos itens comercializados nos encontros (categoria dividida em Alimentos e Artigos Religiosos).
3. **Venda:** Registro das transações comerciais (valor total, voluntário responsável e forma de pagamento).
4. **MovimentacaoFinanceira:** Controle do caixa financeiro do grupo (entradas e despesas/saídas com descrição e data).

## 4. Diagrama de Entidade-Relacionamento (DER)

```mermaid
erDiagram
    USUARIO ||--o{ VENDA : realiza
    USUARIO ||--o{ MOVIMENTACAO_FINANCEIRA : registra
    PRODUTO ||--o{ VENDA : pertence_a

    USUARIO {
        uuid id PK
        string nome
        string email UK
        string senha_hash
        enum perfil "ADMIN | VOLUNTARIO"
        datetime criado_em
    }

    PRODUTO {
        uuid id PK
        string nome
        enum categoria "ALIMENTO | ARTIGO_RELIGIOSO"
        decimal preco
        int quantidade_estoque
        boolean ativo
    }

    VENDA {
        uuid id PK
        uuid usuario_id FK
        decimal valor_total
        enum forma_pagamento "DINHEIRO | PIX | CARTAO"
        datetime data_venda
    }

    MOVIMENTACAO_FINANCEIRA {
        uuid id PK
        uuid usuario_id FK
        enum tipo "ENTRADA | SAIDA"
        decimal valor
        string descricao
        datetime data_movimentacao
    }
