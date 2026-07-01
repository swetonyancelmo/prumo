# Ordenai — Backend

Organizador de vida pessoal (financeiro + tarefas + agenda) via WhatsApp e painel web.
Backend em **NestJS + Prisma + Supabase (Postgres)**.

## Fase atual: 1 — Backend core (sem WhatsApp/IA)

Módulos implementados: `UsersModule`, `FinanceModule` (categorias/despesas/receitas),
`TasksModule`, `AuthModule` (validação de JWT do Supabase). `WhatsappModule` e `AiModule`
existem como placeholders (Fases 3 e 4).

## Setup

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL e SUPABASE_JWT_SECRET
npm run prisma:generate
npm run prisma:migrate  # aplica as migrations (init + enable_rls) no Supabase
```

### Migrations já versionadas

- `20260701000000_init` — cria todas as tabelas/enums/índices.
- `20260701000100_enable_rls` — habilita RLS em `expenses`, `incomes`, `tasks` e
  `whatsapp_messages`, escopando por `auth.uid() = user_id`.

Ambas já existem em `prisma/migrations`. Depois de preencher o `.env`, rodar
`npm run prisma:migrate` (ou `prisma migrate deploy` em produção) aplica as duas em
ordem. Ver o cabeçalho de `enable_rls/migration.sql` para o caveat sobre `FORCE RLS`
e `BYPASSRLS`.

## Rodar

```bash
npm run start:dev       # http://localhost:3000/api
npm test                # testes unitários (parsing + cálculo financeiro)
```

## Endpoints (todos exigem `Authorization: Bearer <supabase_jwt>`)

| Método | Rota                | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| POST   | `/api/users`        | Cria perfil do usuário             |
| GET    | `/api/users/me`     | Perfil autenticado                 |
| PATCH  | `/api/users/me`     | Atualiza perfil                    |
| DELETE | `/api/users/me`     | Exclusão completa (LGPD)           |
| CRUD   | `/api/categories`   | Categorias (despesa/receita)       |
| CRUD   | `/api/expenses`     | Despesas                           |
| CRUD   | `/api/incomes`      | Receitas                           |
| CRUD   | `/api/tasks`        | Tarefas (com recorrência)          |

## Modelo de dados

Ver `prisma/schema.prisma`. Valores monetários usam `Decimal(12,2)`. Deleção de usuário
faz cascata em despesas/receitas/tarefas/mensagens.
