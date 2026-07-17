# Projeto: Prumo — Organizador de Vida Pessoal (Web)

## Visão geral

SaaS de produtividade pessoal (**financeiro + tarefas**) via **painel web**. O usuário
registra despesas, receitas e tarefas **manualmente, por formulários**, organiza por
categoria e acompanha o mês com relatórios. **Não há integração de mensageria nem IA** —
toda entrada de dados é feita pela própria pessoa no painel.

> **Nota histórica:** o produto nasceu com a proposta de registro por WhatsApp + extração
> por IA (Claude API). Em 2026-07-17 o escopo pivotou para **web-only, gestão manual**.
> Toda a infra de WhatsApp/IA (que era só planejamento — nunca chegou a ser construída) e
> os campos de banco associados foram removidos. Ver "Decisões tomadas — pivot web-only".

## Stack decidida

- **Backend**: NestJS (TypeScript)
- **Banco de dados — dev**: Postgres 16 em **Docker local** (`docker-compose.yml` na raiz).
  Ver "Decisões tomadas — banco local em Docker".
- **Banco de dados — produção**: Supabase (Postgres gerenciado + Row Level Security)
- **Auth**: Supabase Auth (JWT via JWKS) — **em todos os ambientes**, inclusive com o
  banco local. Só o Postgres saiu do Supabase em dev; o login não.
- **Frontend web**: Next.js 16 + Tailwind v4 + shadcn/ui (base UI)
- **ORM**: Prisma

## Modelo de dados

```
users
  id (= auth uid do Supabase), email, name, created_at

categories
  id, user_id, name, type (despesa|receita), is_default

expenses
  id, user_id, amount, category_id, description, occurred_at, created_at

incomes
  id, user_id, amount, description, received_at, created_at

tasks
  id, user_id, description, due_date, has_time, is_recurring,
  recurrence_rule (nullable), is_completed, created_at
```

`users.id` **é** o auth uid do Supabase (não um id próprio). Valores monetários usam
`Decimal(12,2)`. Deleção de usuário faz cascata (Prisma `onDelete: Cascade`) em
categorias/despesas/receitas/tarefas.

## Regras de negócio importantes

- **Tarefas com horário = agenda**: `tasks.has_time` indica se a hora em `due_date` é
  significativa (compromisso) ou se é tarefa de dia inteiro. Não há entidade `events`.
- **Tarefas recorrentes**: `recurrence_rule` existe no schema desde o início. A **geração
  das ocorrências** ainda não está implementada (hoje é um campo guardado).
- **Dados financeiros são sensíveis — LGPD desde o início**: exclusão completa já existe
  (`DELETE /api/users/me`, cascata). **Export de dados ainda falta** (ver roadmap).

## Roadmap

Estado atual: o núcleo web (cadastro, CRUD de finanças/tarefas, dashboard, relatórios) está
**funcional e validável**. O que falta para um produto web "minimamente completo":

- [x] **Backend core**: modelagem, CRUD REST, auth (Supabase JWKS)
- [x] **Painel web**: login, onboarding, dashboard, finanças, tarefas (Next.js)
- [x] **Relatórios**: `GET /api/reports` + `/relatorios` (semana→ano, gráficos, variação)
- [ ] **Export de dados (LGPD)**: endpoint + botão. Só existe exclusão hoje.
- [ ] **Recorrência de tarefas de verdade**: gerar as ocorrências a partir de `recurrence_rule`.
- [ ] **Notificações de vencimento**: cron diário + canal (e-mail) — não há infra ainda.
- [ ] **Gestão de categorias**: hoje só dá para criar categoria inline no lançamento;
      falta renomear/excluir.

## Convenções para o Claude Code

- Estrutura de módulos do NestJS: `UsersModule`, `FinanceModule`, `TasksModule`,
  `ReportsModule`, `AuthModule`.
- Escrever testes (TDD) para toda lógica de **cálculo financeiro e de relatórios**.
- Não inventar chaves de API — usar variáveis de ambiente (`.env`, nunca commitado).
- Ao final de cada bloco de trabalho, rodar os testes e mostrar um resumo antes de avançar.

## Decisões tomadas — pivot web-only

Registradas em 2026-07-17. Efetivadas. Removem o escopo de WhatsApp/IA.

- **WhatsApp e IA nunca foram construídos** — existiam só como planos no CLAUDE.md e dois
  módulos-placeholder vazios (`WhatsappModule`, `AiModule`) no NestJS. BullMQ, Redis,
  Evolution API e Claude API **não** estavam no `package.json` nem no código. O pivot
  removeu os placeholders e toda a documentação relacionada.
- **Schema enxugado** (migration `20260717000000_remove_whatsapp_and_phone`, destrutiva):
  removidos a tabela `whatsapp_messages`, `users.phone_number`, `raw_message_id` de
  expenses/incomes/tasks, a coluna `source` e os enums `EntrySource`/`MessageDirection`.
  Como tudo é web, `source` (whatsapp|web) virou vestígio.
- **Migration escrita à mão + `prisma migrate deploy`** (não `migrate dev`): o shadow
  database do `migrate dev` não tem o shim de `auth.uid()` (só o banco principal recebe os
  init scripts do Docker), então ele quebraria ao reaplicar `enable_rls`. Padrão a repetir
  para novas migrations locais enquanto o RLS depender de `auth.uid()`.
- **Onboarding só com nome**: sem telefone. `POST /api/users` cria o perfil (necessário
  pela FK) só com `name` (opcional) + `email`. O gate segue igual: `GET /users/me` = 404 →
  `/onboarding`.
- **Nome do produto: Prumo** (fio de prumo — alinhamento/organização). Renomeado em README,
  UI, metadados e `package.json` (`name: prumo`). Identificadores de infra continuam
  minúsculos e inalterados: container `ordenai-postgres`, base/usuário `ordenai`, projeto
  compose `ordenai` (renomeá-los exigiria recriar o volume, sem ganho).

### Logo

- **Fonte**: `assets/brand/prumo-logo.png` (PNG 1254², roxo sobre fundo branco). Fica na
  raiz do repo, fora dos apps.
- **Aplicação**: como o PNG tem fundo branco sólido, a marca é exibida num **tile branco
  arredondado** (funciona em qualquer fundo, claro/escuro, sem virar quadrado solto). O
  componente `Logo`/`LogoMark` (`frontend/src/components/logo.tsx`) renderiza
  `public/prumo-mark.png` via `next/image`. Aparece no header do app (sidebar + topo
  mobile), login, onboarding, nav e footer da landing.
- **Ícones gerados** a partir da fonte (script pontual, não versionado): `app/icon.png`
  (512), `app/apple-icon.png` (180), `app/favicon.ico` (16/32/48), `public/prumo-mark.png`
  (128, in-app) e `app/opengraph-image.png` (1200×630). Regerar exige re-rodar o script a
  partir de `assets/brand/prumo-logo.png`.

## Decisões tomadas — Fase 1 (backend core)

Registradas em 2026-07-01. Estas são decisões efetivadas, não mais rascunho.

### Estrutura do repositório
- **Monorepo simples** (sem Turborepo/Nx): `backend/` (NestJS) e `frontend/` (Next.js) na
  raiz, mais `assets/brand/` (logo-fonte) e `docker/` (init scripts do Postgres). O
  `CLAUDE.md` fica na raiz. Cada app tem seu `package.json` e é instalado/rodado isoladamente.

### Backend
- **Validação com Zod** (via `nestjs-zod` + `createZodDto`), não class-validator — validação
  declarativa e schemas reaproveitáveis. `ZodValidationPipe` registrado como `APP_PIPE` global.
- **Migrations com `prisma migrate`** (arquivos versionados em `prisma/migrations`),
  não `prisma db push`. Usa `DIRECT_URL` (porta 5432); o runtime usa `DATABASE_URL`
  (pooler 6543 no Supabase; mesma porta 5432 no Docker local).
- **Auth**: o NestJS **valida o JWT emitido pelo Supabase Auth** (não recria login
  próprio). O projeto usa **JWT Signing Keys assimétricas (ECC P-256 → ES256)**, então
  a strategy `supabase-jwt` valida **via JWKS**: busca a chave pública em
  `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` (jwks-rsa, com cache + rate limit),
  resolve pelo `kid` do header e valida `issuer`/`audience`. **Não há segredo
  compartilhado** — o fallback HS256/`SUPABASE_JWT_SECRET` foi removido. Guard
  `SupabaseJwtGuard`, decorator `@CurrentUser()` extrai `user.id` do `sub`. As opções da
  strategy estão isoladas em `buildSupabaseJwtOptions()` para testabilidade (o teste mocka
  o endpoint JWKS com nock + um par de chaves EC).
- **Dinheiro**: `Decimal(12,2)` no Prisma; agregação financeira feita em centavos
  (inteiros) para evitar erro de ponto flutuante. Lógica pura isolada em
  `FinanceService` (testável sem I/O).
- **Escopo por usuário**: toda query de serviço é filtrada por `user_id`. Em runtime a
  API usa a service role / conexão direta do Prisma (RLS não é aplicado pelo Prisma).
- **RLS como defesa em profundidade**: policies SQL escopando `auth.uid() = user_id`
  nas tabelas `expenses`, `incomes`, `tasks` (migration `enable_rls`; a policy de
  `whatsapp_messages` caiu junto com a tabela no pivot). Protege acessos que passem pelo
  PostgREST/Supabase client (ex.: frontend acessando direto), não o caminho do Prisma.

### LGPD
- `DELETE /api/users/me` remove o usuário com cascata (Prisma `onDelete: Cascade`) em
  categorias/despesas/receitas/tarefas. **Export de dados fica para fase posterior.**

### Correção pós-Fase 1 (bug de vínculo do perfil)
- `POST /api/users` criava o perfil com `id` aleatório, sem vincular ao `sub` do JWT.
  Como tudo é escopado por `auth uid` e `GET /users/me` busca por ele, o perfil ficava
  órfão (404 eterno). **Corrigido**: o endpoint usa `@CurrentUser()` e o service faz
  `upsert` com `id = userId` (auth uid) — idempotente no reenvio do onboarding. O `id` da
  tabela `users` **é** o auth uid do Supabase.

## Decisões tomadas — banco local em Docker

Registradas em 2026-07-15. Efetivadas. Substitui o Supabase **como banco de desenvolvimento**.

- **`docker-compose.yml` na raiz** (não em `backend/`): a infra é do repo, não de um app só.
  Sobe `postgres:16-alpine` como `ordenai-postgres` na porta 5432, credenciais/base
  `ordenai`/`ordenai_dev`/`ordenai`, volume nomeado `ordenai_postgres_data`, healthcheck com
  `pg_isready`. `TZ=America/Sao_Paulo` fixado no container porque os relatórios agregam em
  horário local do processo — sem isso, local e produção divergiriam.
- **Sem pooler local**: `DATABASE_URL` e `DIRECT_URL` apontam ambas para 5432. A distinção
  (6543 pooled / 5432 direct) só existe no Supabase e continua documentada no `.env.example`.
- **Auth continua no Supabase.** Migrar o banco NÃO removeu a dependência do Supabase: o
  backend ainda valida JWT via JWKS e o front ainda faz login lá. `users.id` continua sendo
  o auth uid do Supabase. Um `.env` de dev ainda precisa de `SUPABASE_URL`.
- **Shim de `auth.uid()` em vez de migration condicional.** A migration `enable_rls` usa
  `auth.uid()`, que não existe em Postgres puro — ela quebraria o `prisma migrate` local.
  Em vez de tornar a migration condicional (o que faria o histórico divergir entre
  ambientes, exatamente o que `prisma migrate` evita), o **ambiente local imita o Supabase**:
  `docker/postgres/init/01-supabase-auth-shim.sql` cria o schema `auth` com `uid()`/`role()`
  lendo as claims de `current_setting('request.jwt.claims')`. As migrations ficam idênticas
  em local e produção.
- **Init scripts descrevem o ambiente, não o schema.** `docker/postgres/init/` só recebe o
  que o Supabase já provê de fábrica. Tabela/coluna/índice é sempre `prisma migrate`. Esses
  scripts rodam **só com o volume vazio** — mudá-los exige `docker compose down -v`.
- **RLS local se comporta como Supabase**: sem PostgREST injetando claims, `auth.uid()` é
  NULL e as policies negam tudo — igual a um usuário não autenticado. O backend não é
  afetado porque o Prisma conecta como superusuário, que ignora RLS (inclusive `FORCE`).
  Verificado: insert/select/cascata via Prisma passam com as policies ativas.

## Decisões tomadas — Fase 2 (frontend web)

Registradas em 2026-07-02. Efetivadas.

### Stack e estrutura
- **Next.js 16 (App Router) + Tailwind v4 + shadcn/ui** em `frontend/`. shadcn com base
  **`base` (Base UI)**, não Radix — componentes usam a prop **`render`** (não `asChild`),
  ícones **lucide**. Fontes via `next/font`: **Bricolage Grotesque** (títulos) + **Figtree**
  (corpo). Tokens de tema (paleta) como CSS variables em `src/app/globals.css`.
- **Next 16 tem breaking changes** (ver `frontend/AGENTS.md`): Middleware virou `proxy.js`;
  `cookies()`/`params` são async; ESLint com `react-hooks/set-state-in-effect` como erro.
  Por isso a **auth é client-side** (sem proxy/cookies de servidor): sessão no navegador via
  `@supabase/supabase-js`, guard num layout client que redireciona.

### Autenticação e acesso a dados
- O frontend usa o **Supabase só para auth** (login/logout e obter o access token). **Nenhuma
  query de dados passa pelo supabase-js** — tudo vai para a **API NestJS** com o JWT no header
  `Authorization: Bearer` (wrapper em `src/lib/api.ts`). Casa com o RLS: o front nunca acessa
  o Postgres direto.
- Variáveis `NEXT_PUBLIC_*` (URL do Supabase, chave **publishable/anon** pública, URL da API).
  Só chaves públicas no front — segurança real é RLS + validação de JWT no backend.
- **Onboarding**: como `expenses/incomes/tasks` têm FK para `users`, após o primeiro login a
  tela `/onboarding` cria o perfil (só **nome**, opcional) via `POST /api/users`.
  `GET /users/me` = 404 dispara o onboarding.

### Design
- Direção **"caderno de organização que respira"** (não dashboard bancário). Elemento de
  assinatura: a **"aba de categoria"** (retângulo arredondado colorido na borda esquerda de
  itens/cartões), repetida em despesas, receitas e tarefas (nas tarefas, colore por urgência).
- Dinheiro exibido em `tabular-nums`; agregação do dashboard feita **em centavos** (espelha o
  backend). `Decimal` do Prisma chega como **string** — sempre passar por `parseAmount`.
- **Datas são dia de calendário**: inputs de data são ancorados ao **meio-dia local** ao
  serializar para ISO (`dateInputToISO`), evitando off-by-one em fusos negativos (UTC−3).

### Agenda = Tarefas com horário (decisão de produto)
- Não criamos entidade `events` separada. `tasks.hasTime` (migration `add_task_has_time`)
  indica se a hora em `dueDate` é significativa: `false` = tarefa de dia inteiro; `true` =
  compromisso/agenda. Uma consulta médica é uma `task` com `dueDate` + `hasTime=true`.
  Separar em `events` só se surgir necessidade de local/duração/participantes/integração com
  calendários externos.

### Extras da web (pós-Fase 2)
- **Dark mode**: `next-themes` (`ThemeProvider`, `attribute="class"`), default do sistema +
  toggle Sistema/Claro/Escuro persistido. A paleta escura vive em `.dark` no `globals.css`.
  `<html suppressHydrationWarning>` é obrigatório. Toggle no app (sidebar/topo) e nas telas
  de auth.
- **Landing page pública**: a rota `/` é a página de marketing (server component, com
  `metadata` de SEO) — NÃO redireciona. Nav ciente de sessão ("Entrar/Criar conta" ↔
  "Ir para o painel"). Rotas do app ficam em `/dashboard`, `/financas`, `/relatorios`,
  `/tarefas`. O login, após autenticar, manda para `/dashboard`.
- **Navegação mobile**: no mobile o app usa **tab bar fixa no rodapé** (4 itens) + topo
  enxuto (logo, tema, avatar → menu de conta). Desktop segue com a sidebar. Em `app-shell.tsx`.
- **Base UI (shadcn base) — pegadinhas de runtime** (o `tsc` não pega): (1) `DropdownMenuLabel`
  é um `Menu.GroupLabel` e precisa estar dentro de um `DropdownMenuGroup`; (2) `Button` usado
  como link (`render={<Link/>}`) deve receber `nativeButton={false}` para não perder semântica
  e não poluir o console.

## Relatórios financeiros

### Backend — `ReportsModule`
- `GET /api/reports?period=week|month|quarter|semester|year&anchor=<data>` (JWT obrigatório).
  `anchor` é qualquer dia dentro do período desejado (default: hoje).
- **Lógica pura e testada** em `reports.util.ts` (`resolvePeriod`, `buildReport`), isolada de
  I/O como o `FinanceService`. Agrega **em centavos**; `reports.service.ts` faz a query Prisma
  (escopo por `userId` — RLS não cobre o Prisma) e delega para a lógica pura. Testes em
  `reports.util.spec.ts`.
- **Resposta**: `{ period, range:{start,end,label}, totals:{incomes,expenses,balance},
  previous:{...} (para variação), byCategory:[{name,total,previousTotal,share}],
  series:[{label,incomes,expenses}] }`. Buckets da série por período: semana→7 dias,
  mês→semanas, trimestre→3 meses, semestre→6 meses, ano→12 meses.
- **Fuso**: cálculos de calendário em horário LOCAL do processo — em produção fixar
  `TZ=America/Sao_Paulo`. A âncora é enviada pelo front como **meio-dia local** (`...T12:00:00`
  sem `Z`) para não escorregar de dia.

### Frontend — `/relatorios`
- Seletor de período (ToggleGroup), navegação ‹ ›, KPIs com variação vs. período anterior,
  3 gráficos (barras Receita×Despesa, rosca por categoria, linha de saldo acumulado) e tabela.
- Gráficos com **shadcn Chart (Recharts)**, reagindo ao dark mode via as `--chart-1..5`.
  A paleta categórica foi validada pela skill `dataviz` (daltonismo OK; contraste de algumas
  cores sobre branco fica <3:1, daí o **relief obrigatório**: rótulos/legenda + a tabela).
