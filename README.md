# Prumo

Organizador de vida pessoal (financeiro + tarefas) — **painel web, gestão manual**.
Sem integração de mensageria: tudo é registrado por formulários no painel.

## Estrutura (monorepo simples)

```
prumo/
├── CLAUDE.md          # visão, stack e decisões do projeto
├── DEPLOY.md          # deploy em Neon + Render + Vercel
├── render.yaml        # blueprint da API no Render
├── docker-compose.yml # Postgres local de desenvolvimento
├── assets/brand/      # logo-fonte (prumo-logo.png)
├── backend/           # API NestJS + Prisma + Postgres
└── frontend/          # Painel web Next.js + shadcn/ui
```

Cada pasta é um projeto independente com seu próprio `package.json`. Não usamos
Turborepo/Nx — instala-se e roda-se cada uma separadamente. Rode o backend e o
frontend em paralelo (o front espera a API em `http://localhost:3000/api`).

## Rodando localmente

### 1. Banco de dados

```bash
docker compose up -d      # Postgres 16 em localhost:5432
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # gere um JWT_SECRET: openssl rand -base64 48
npm run prisma:generate
npm run prisma:deploy     # aplica as migrations
npm run start:dev         # http://localhost:3000/api
```

Ver `backend/README.md` para detalhes e lista de endpoints.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                        # http://localhost:3001
```

Telas: landing page pública (`/`), login/cadastro, dashboard, finanças
(despesas/receitas), relatórios (gráficos por período) e tarefas (com vencimento
e horário). Dark mode e navegação mobile (tab bar). Ver `frontend/README.md`.

## Deploy

Neon (banco) + Render (API) + Vercel (frontend), todos no plano gratuito.
Passo a passo em **[DEPLOY.md](DEPLOY.md)**.
