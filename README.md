# Aether ERP 🚀

Sistema de gestão empresarial (ERP) moderno construído com Go e React.

## 🛠 Tecnologias

- **Backend**: Go (Fiber), PostgreSQL, sqlc, pgx.
- **Frontend**: React (React Router v7), Tailwind CSS, TanStack Query.
- **Infra**: Docker, Docker Compose, Makefile.

## 🚀 Como Executar

### Pré-requisitos

- Docker e Docker Compose instalados.
- Go 1.25+ (opcional para desenvolvimento local).

### Passo a Passo

1. **Subir o Banco de Dados**:

   ```bash
   make docker-up

    Configurar o Backend:

        Entre na pasta backend e configure o .env.

        Execute as migrações: make migrate-up.

    Rodar o Ambiente de Desenvolvimento:
    Na raiz do projeto, execute:
    Bash

    make dev

    O frontend estará disponível em http://localhost:5173 e o backend em http://localhost:3000.
   ```

📦 Funcionalidades Atualizadas

    [x] Autenticação JWT.

    [x] Gestão de Clientes e Produtos.

    [x] PDV (Ponto de Venda) com baixa de stock automática.

    [x] Histórico de Vendas com detalhes.

Para subir isto para o GitHub, basta:

```bash
git add README.md
git commit -m "docs: adiciona README principal do projeto"
git push
```
