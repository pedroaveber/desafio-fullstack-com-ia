# Desafio Fullstack com IA

Projeto fullstack para captura e inspeção de webhooks, desenvolvido como desafio da Rocketseat.

## 🚀 Tecnologias

### Backend (API)
- **Fastify** - Framework web rápido e eficiente
- **Drizzle ORM** - ORM TypeScript para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **Zod** - Validação de schemas
- **TypeScript** - Tipagem estática
- **Docker Compose** - Containerização do banco de dados

### Frontend (Web)
- **React 19** - Biblioteca para construção de interfaces
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática

### Ferramentas
- **pnpm** - Gerenciador de pacotes
- **Biome** - Linter e formatter
- **Scalar** - Documentação da API

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- pnpm 10.15.0
- Docker e Docker Compose

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd desafio-fullstack-com-ia
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cd api
cp .env.example .env  # Se houver, ou crie um arquivo .env
```

4. Inicie o banco de dados com Docker Compose:
```bash
cd api
docker-compose up -d
```

5. Execute as migrações do banco de dados:
```bash
cd api
pnpm db:migrate
```

## 🎯 Uso

### Desenvolvimento

Para rodar o projeto em modo de desenvolvimento:

**Backend:**
```bash
cd api
pnpm dev
```
A API estará disponível em `http://localhost:3333`
A documentação da API estará disponível em `http://localhost:3333/docs`

**Frontend:**
```bash
cd web
pnpm dev
```
O frontend estará disponível em `http://localhost:5173` (porta padrão do Vite)

### Scripts disponíveis

**API:**
- `pnpm dev` - Inicia o servidor em modo desenvolvimento
- `pnpm start` - Inicia o servidor em modo produção
- `pnpm db:generate` - Gera migrações do banco de dados
- `pnpm db:migrate` - Executa migrações do banco de dados
- `pnpm db:studio` - Abre o Drizzle Studio para visualizar o banco
- `pnpm format` - Formata o código com Biome

**Web:**
- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Gera build de produção
- `pnpm preview` - Preview do build de produção

## 📁 Estrutura do Projeto

```
desafio-fullstack-com-ia/
├── api/                 # Backend (Fastify)
│   ├── src/
│   │   ├── db/         # Configuração do banco de dados
│   │   ├── routes/     # Rotas da API
│   │   └── server.ts   # Servidor principal
│   └── docker-compose.yml
└── web/                 # Frontend (React + Vite)
    └── src/
        └── app.tsx     # Componente principal
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na pasta `api/` com as seguintes variáveis:

```env
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://docker:docker@localhost:5432/webhooks
```

## 📝 Licença

ISC
