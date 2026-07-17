# Prumo

Organizador de vida pessoal (financeiro + tarefas) — **painel web, gestão manual**.
Sem integração de mensageria: tudo é registrado por formulários no painel.

## Estrutura (monorepo simples)

```
ordenai/
├── CLAUDE.md          # visão, stack e decisões do projeto
├── assets/brand/      # logo-fonte (prumo-logo.png)
├── backend/           # API NestJS + Prisma + Postgres
└── frontend/          # Painel web Next.js + shadcn/ui
```

Cada pasta é um projeto independente com seu próprio `package.json`. Não usamos
Turborepo/Nx — instala-se e roda-se cada uma separadamente. Rode o backend e o
frontend em paralelo (o front espera a API em `http://localhost:3000/api`).

## Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha as credenciais do Supabase
npm run prisma:generate
npm run start:dev
```

Ver `backend/README.md` para detalhes e lista de endpoints.

## Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # preencha URL/chave pública do Supabase + URL da API
npm run dev                        # http://localhost:3001
```

Telas: landing page pública (`/`), login, onboarding (perfil + nome), dashboard,
finanças (despesas/receitas), relatórios (gráficos por período) e tarefas (com vencimento
e horário). Dark mode e navegação mobile (tab bar). Ver `frontend/README.md` para detalhes.
