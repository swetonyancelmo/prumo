# Ordenai

Organizador de vida pessoal (financeiro + tarefas + agenda) via WhatsApp e painel web.

## Estrutura (monorepo simples)

```
ordenai/
├── CLAUDE.md      # visão, stack e decisões do projeto
├── backend/       # API NestJS + Prisma + Supabase (Fase 1 — pronta)
└── frontend/      # Painel web Next.js + shadcn/ui (Fase 2 — pronta)
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
npm run dev                        # http://localhost:3000
```

Telas: login, onboarding (perfil + telefone), dashboard (saldo do mês, gastos por
categoria, tarefas), finanças (despesas/receitas) e tarefas (com vencimento e horário).
Ver `frontend/README.md` para detalhes.
