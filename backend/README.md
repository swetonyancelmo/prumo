# Prumo — Backend

Organizador de vida pessoal (financeiro + tarefas) — **painel web, gestão manual**.
Backend em **NestJS + Prisma + Postgres**.

- **Banco (dev)**: Postgres 16 em Docker, na raiz do repo (`docker compose up -d`).
- **Auth**: **Supabase** (validação de JWT via JWKS). Só o banco saiu de lá.

## Módulos

`UsersModule`, `FinanceModule` (categorias/despesas/receitas), `TasksModule`,
`ReportsModule` (relatórios financeiros), `AuthModule` (validação de JWT do Supabase).

## Setup

```bash
# 1. Sobe o Postgres local (na RAIZ do repo, não em backend/)
cd .. && docker compose up -d && cd backend

# 2. Backend
npm install
cp .env.example .env   # DATABASE_URL/DIRECT_URL já vêm apontando pro Docker; preencha SUPABASE_URL
npm run prisma:generate
npm run prisma:migrate  # aplica as migrations no Postgres local
```

### Banco local em Docker

O `docker-compose.yml` da raiz sobe um **Postgres 16** (`ordenai-postgres`, porta 5432,
usuário/senha/base `ordenai`/`ordenai_dev`/`ordenai`, fuso `America/Sao_Paulo`). Os dados
ficam no volume `ordenai_postgres_data` e sobrevivem a `docker compose down`.

```bash
docker compose up -d      # sobe
docker compose down       # para (mantém os dados)
docker compose down -v    # para e APAGA o banco (recomeçar do zero)
docker compose logs -f postgres
docker exec -it ordenai-postgres psql -U ordenai -d ordenai   # shell SQL
```

**Shim de `auth.uid()`.** A migration `enable_rls` usa `auth.uid()`, função que só existe
no Supabase — num Postgres puro ela quebraria o `prisma migrate`. Por isso
`docker/postgres/init/01-supabase-auth-shim.sql` cria o schema `auth` e essa função na
primeira subida do container, mantendo as migrations **idênticas** em local e produção.
Como nada injeta claims de JWT localmente, `auth.uid()` retorna NULL e as policies negam
tudo — igual ao Supabase para um usuário não autenticado. O backend não é afetado: o
Prisma conecta como superusuário, que ignora RLS (inclusive `FORCE`).

Como o script só roda com o volume vazio, editá-lo exige `docker compose down -v` para
ter efeito.

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
- `20260717000000_remove_whatsapp_and_phone` — pivot web-only: remove a tabela
  `whatsapp_messages`, as colunas `phone_number`/`raw_message_id`/`source` e os enums
  `EntrySource`/`MessageDirection`.

Todas já existem em `prisma/migrations`. Com o container de pé e o `.env` preenchido,
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
`reports/reports.util.ts`. Cálculos em horário local — em produção fixar
`TZ=America/Sao_Paulo`.

## Modelo de dados

Ver `prisma/schema.prisma`. Valores monetários usam `Decimal(12,2)`. Deleção de usuário
faz cascata em despesas/receitas/tarefas/categorias.
