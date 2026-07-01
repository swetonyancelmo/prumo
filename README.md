# Ordenai

Organizador de vida pessoal (financeiro + tarefas + agenda) via WhatsApp e painel web.

## Estrutura (monorepo simples)

```
ordenai/
├── CLAUDE.md      # visão, stack e decisões do projeto
├── backend/       # API NestJS + Prisma + Supabase (Fase 1 — pronta)
└── frontend/      # Painel web Next.js (Fase 2 — a fazer)
```

Cada pasta é um projeto independente com seu próprio `package.json`. Não usamos
Turborepo/Nx — instala-se e roda-se cada uma separadamente.

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

A criar na Fase 2 do roadmap (ver `CLAUDE.md`).
