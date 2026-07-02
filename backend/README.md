# Ordenai — Backend

Organizador de vida pessoal (financeiro + tarefas + agenda) via WhatsApp e painel web.
Backend em **NestJS + Prisma + Supabase (Postgres)**.

## Fases concluídas: 1 (backend core) e 2 (consumido pelo web em `../frontend`)

Módulos implementados: `UsersModule`, `FinanceModule` (categorias/despesas/receitas),
`TasksModule`, `ReportsModule` (relatórios financeiros — Fase 5 adiantada), `AuthModule`
(validação de JWT do Supabase). `WhatsappModule` e `AiModule` existem como placeholders
(Fases 3 e 4).

## Setup

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL e SUPABASE_URL
npm run prisma:generate
npm run prisma:migrate  # aplica as migrations no Supabase
```

**Auth por JWKS/ES256 — sem segredo compartilhado.** O projeto Supabase usa JWT Signing
Keys assimétricas (ECC P-256). A strategy valida o JWT buscando a chave pública em
`${SUPABASE_URL}/auth/v1/.well-known/jwks.json` (por isso o `.env` precisa de `SUPABASE_URL`,
não mais de `SUPABASE_JWT_SECRET`, que foi removido).

### Migrations já versionadas

- `20260701000000_init` — cria todas as tabelas/enums/índices.
- `20260701000100_enable_rls` — habilita RLS em `expenses`, `incomes`, `tasks` e
  `whatsapp_messages`, escopando por `auth.uid() = user_id`.
- `20260702000000_add_task_has_time` — adiciona `tasks.has_time` (tarefa de dia inteiro
  vs. compromisso com horário).

Todas já existem em `prisma/migrations`. Depois de preencher o `.env`, rodar
`npm run prisma:migrate` (ou `prisma migrate deploy` em produção) aplica-as em ordem. Ver o
cabeçalho de `enable_rls/migration.sql` para o caveat sobre `FORCE RLS` e `BYPASSRLS`.

## Rodar

```bash
npm run start:dev       # http://localhost:3000/api
npm test                # testes unitários (parsing + cálculo financeiro)
```

## Endpoints (todos exigem `Authorization: Bearer <supabase_jwt>`)

| Método | Rota                | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| POST   | `/api/users`        | Cria/atualiza perfil (id = auth uid) |
| GET    | `/api/users/me`     | Perfil autenticado                 |
| PATCH  | `/api/users/me`     | Atualiza perfil                    |
| DELETE | `/api/users/me`     | Exclusão completa (LGPD)           |
| CRUD   | `/api/categories`   | Categorias (despesa/receita)       |
| CRUD   | `/api/expenses`     | Despesas                           |
| CRUD   | `/api/incomes`      | Receitas                           |
| CRUD   | `/api/tasks`        | Tarefas (recorrência + `hasTime`)  |
| GET    | `/api/reports`      | Relatório financeiro por período   |

### `GET /api/reports`

`?period=week|month|quarter|semester|year&anchor=<ISO>` (âncora = qualquer dia do período;
default hoje). Retorna `{ range, totals, previous, byCategory, series }` — totais, variação
vs. período anterior, gasto por categoria e série por sub-período. Lógica pura e testada em
`reports/reports.util.ts`; será reusado pelo WhatsApp na Fase 5. Cálculos em horário local —
em produção fixar `TZ=America/Sao_Paulo`.

## Modelo de dados

Ver `prisma/schema.prisma`. Valores monetários usam `Decimal(12,2)`. Deleção de usuário
faz cascata em despesas/receitas/tarefas/mensagens.
