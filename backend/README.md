# Prumo — Backend

Organizador de vida pessoal (financeiro + tarefas) — **painel web, gestão manual**.
Backend em **NestJS + Prisma + Postgres**.

- **Banco (dev)**: Postgres 16 em Docker, na raiz do repo (`docker compose up -d`).
- **Banco (produção)**: Neon. Ver [`DEPLOY.md`](../DEPLOY.md).
- **Auth**: própria (e-mail + senha, bcrypt, JWT HS256). Sem provedor externo.

## Módulos

`AuthModule` (cadastro/login/refresh), `UsersModule`, `FinanceModule`
(categorias/despesas/receitas), `TasksModule`, `ReportsModule` (relatórios financeiros),
`HealthModule` (health check do Render).

## Setup

```bash
# 1. Sobe o Postgres local (na RAIZ do repo, não em backend/)
cd .. && docker compose up -d && cd backend

# 2. Backend
npm install
cp .env.example .env    # DATABASE_URL já aponta pro Docker.
                        # Gere o JWT_SECRET: openssl rand -base64 48
npm run prisma:generate
npm run prisma:deploy   # aplica as migrations no Postgres local
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

É um Postgres puro — sem extensões nem init scripts. O shim de `auth.uid()` que existia
para imitar o Supabase foi removido junto com o RLS (ver `CLAUDE.md`).

### Migrations

- `20260809000000_init` — cria todas as tabelas, enums e índices.

É a única: as quatro migrations anteriores foram squashadas nela quando o projeto saiu do
Supabase, antes de qualquer deploy. `npm run prisma:deploy` aplica em qualquer ambiente;
no Render isso roda no build.

## Rodar

```bash
npm run start:dev       # http://localhost:3000/api
npm test                # testes unitários (auth, cálculo financeiro, relatórios)
```

## Endpoints

Públicos:

| Método | Rota                  | Descrição                                    |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/api/health`         | Health check (consulta o banco)              |
| POST   | `/api/auth/register`  | Cria conta → `{ accessToken, refreshToken, user }` |
| POST   | `/api/auth/login`     | Autentica → mesmo formato                    |
| POST   | `/api/auth/refresh`   | Troca o refresh token por um par novo        |

Autenticados (`Authorization: Bearer <accessToken>`):

| Método | Rota                | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| GET    | `/api/users/me`     | Perfil autenticado                 |
| PATCH  | `/api/users/me`     | Atualiza perfil                    |
| DELETE | `/api/users/me`     | Exclusão completa (LGPD)           |
| CRUD   | `/api/categories`   | Categorias (despesa/receita)       |
| CRUD   | `/api/expenses`     | Despesas                           |
| CRUD   | `/api/incomes`      | Receitas                           |
| CRUD   | `/api/tasks`        | Tarefas (recorrência + `hasTime`)  |
| GET    | `/api/reports`      | Relatório financeiro por período   |

### Autenticação

Dois JWTs HS256 assinados com `JWT_SECRET`, separados pela **audience**: acesso
(`prumo:access`, 15min) e refresh (`prumo:refresh`, 30 dias). Um access token não renova
sessão. Senhas com bcrypt (12 rounds); `password_hash` nunca sai numa resposta.

Não há recuperação de senha nem verificação de e-mail — dependem de provedor de e-mail,
ainda não configurado.

### `GET /api/reports`

`?period=week|month|quarter|semester|year&anchor=<ISO>` (âncora = qualquer dia do período;
default hoje). Retorna `{ range, totals, previous, byCategory, series }` — totais, variação
vs. período anterior, gasto por categoria e série por sub-período. Lógica pura e testada em
`reports/reports.util.ts`. Cálculos em horário local — por isso `TZ=America/Sao_Paulo` é
fixado em todos os ambientes.

## Modelo de dados

Ver `prisma/schema.prisma`. Valores monetários usam `Decimal(12,2)`. Deleção de usuário
faz cascata em despesas/receitas/tarefas/categorias.
