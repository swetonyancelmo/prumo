# Projeto: [Nome do SaaS] — Organizador de Vida Pessoal via WhatsApp

## Visão geral

SaaS de produtividade pessoal (financeiro + tarefas + agenda) onde o usuário interage
principalmente por WhatsApp em linguagem natural, e tem um painel web para gestão mais
detalhada e relatórios. Uma IA (Claude API) interpreta as mensagens e extrai dados
estruturados (despesas, receitas, tarefas) para salvar no banco.

Exemplo de fluxo:
> Usuário manda no WhatsApp: "Gastei 45 reais de almoço hoje e me lembre de pagar a
> conta de luz amanhã"
> Sistema extrai e salva: 1 despesa (R$45, categoria Alimentação, hoje) + 1 tarefa
> ("Pagar conta de luz", vencimento amanhã)
> Sistema responde confirmando o que entendeu.

## Stack decidida

- **Backend**: NestJS (TypeScript)
- **Banco de dados**: Supabase (Postgres gerenciado + Auth + Row Level Security)
- **Frontend web**: Next.js + Tailwind + shadcn/ui
- **Fila assíncrona**: Redis + BullMQ (processar mensagens do WhatsApp fora do ciclo do webhook)
- **IA**: Claude API (Anthropic), usando *tool use* para extração estruturada — não usar
  prompt solto pedindo "responda em JSON"
- **WhatsApp — fase de desenvolvimento**: Evolution API (self-hosted, open-source,
  grátis, conexão via QR code). Usar SOMENTE para testes locais.
- **WhatsApp — fase de produção**: migrar para API oficial da Meta (Cloud API) via um
  BSP (Z-API ou similar). Motivo: Evolution API roda risco de banimento em uso comercial
  contínuo; a API oficial garante estabilidade para dados financeiros de usuários reais.
  Ver seção "Notas de custo" abaixo.
- **ORM**: Prisma (integra bem com Supabase/Postgres e com NestJS)

## Modelo de dados (rascunho inicial — ajustar durante o desenvolvimento)

```
users
  id, phone_number (unique), email, name, created_at

categories
  id, user_id, name, type (despesa|receita), is_default

expenses
  id, user_id, amount, category_id, description, occurred_at,
  source (whatsapp|web), raw_message_id (nullable), created_at

incomes
  id, user_id, amount, description, received_at,
  source (whatsapp|web), raw_message_id (nullable), created_at

tasks
  id, user_id, description, due_date, is_recurring, recurrence_rule (nullable),
  is_completed, source (whatsapp|web), raw_message_id (nullable), created_at

whatsapp_messages
  id, user_id, raw_text, direction (inbound|outbound), processed (bool),
  ai_extraction_result (jsonb, nullable), created_at
```

Guardar `raw_message_id` em expenses/incomes/tasks permite rastrear "isso veio de qual
mensagem" — útil para o usuário corrigir um lançamento errado ("não, isso foi transporte,
não alimentação") e para auditoria.

## Fluxo de processamento de mensagem do WhatsApp

1. Webhook recebe mensagem → responde 200 OK imediatamente → enfileira job (BullMQ)
2. Worker processa o job:
   - Salva mensagem raw em `whatsapp_messages`
   - Chama Claude API com tool use, schema fixo (despesas/receitas/tarefas)
   - Salva os registros extraídos no banco
   - Envia mensagem de confirmação de volta ao usuário via WhatsApp
3. Se a IA não tiver certeza ou faltar informação crítica (ex: valor ambíguo), o worker
   deve pedir esclarecimento em vez de adivinhar

## Regras de negócio importantes

- Toda extração da IA deve ser **confirmada de volta ao usuário** no WhatsApp antes de
  ser tratada como definitiva (ex: "Entendi: R$45 em Alimentação, hoje ✅"). Dados
  financeiros errados corroem confiança rápido.
- Suportar correção via linguagem natural depois do lançamento.
- Tarefas recorrentes precisam de `recurrence_rule` desde o schema inicial (não deixar
  para depois).
- Dados financeiros são sensíveis — pensar em LGPD desde o início: permitir export e
  exclusão completa de dados pelo usuário.

## Roadmap de fases

1. **Backend core sem WhatsApp** ✅ **concluída**: modelagem do banco, CRUD via API REST,
   autenticação (Supabase Auth)
2. **Web mínimo** ✅ **concluída**: login, dashboard, listas de despesas/receitas/tarefas,
   formulário manual (Next.js)
3. **Integração WhatsApp sem IA**: webhook (Evolution API local) recebendo mensagem,
   salvando raw, respondendo "recebi" — validar toda a infra (fila, webhook) isolada
4. **IA parsing**: Claude API com tool use extraindo JSON estruturado, salvando no
   banco, respondendo confirmação
5. **Relatórios** 🟡 **web adiantada**: endpoint `GET /api/reports` + página `/relatorios`
   (semana/mês/trimestre/semestre/ano, gráficos e variação) já prontos; falta expor via
   WhatsApp (reusa o mesmo endpoint) na Fase 5 completa
6. **Refinamentos**: recorrência de tarefas, notificações proativas (cron diário
   checando vencimentos e orçamentos), correção de lançamento via mensagem

## Notas de custo (WhatsApp)

- API oficial da Meta: primeiras 1.000 conversas/mês grátis (conversas iniciadas pelo
  cliente). Acima disso, ~R$0,22/conversa. Estimativa: até ~50 usuários ativos diários
  cabe no tier gratuito.
- Evolution API (dev/teste): grátis, só custo de servidor.

## Convenções para o Claude Code

- Seguir estrutura de módulos do NestJS: `WhatsappModule`, `FinanceModule`,
  `TasksModule`, `AiModule`, `UsersModule`
- Escrever testes (TDD) para toda lógica de parsing e cálculo financeiro
- Não inventar chaves de API — usar variáveis de ambiente (`.env`, nunca commitado)
- Ao final de cada fase do roadmap, rodar os testes e mostrar um resumo do que foi feito
  antes de avançar para a próxima fase

## Decisões tomadas — Fase 1 (backend core)

Registradas em 2026-07-01. Estas são decisões efetivadas, não mais rascunho.

### Estrutura do repositório
- **Monorepo simples** (sem Turborepo/Nx): duas pastas na raiz —
  `backend/` (NestJS) e `frontend/` (Next.js, criado na Fase 2). O `CLAUDE.md`
  fica na raiz. Cada pasta tem seu próprio `package.json` e é instalada/rodada
  isoladamente.

### Backend
- **Validação com Zod** (via `nestjs-zod` + `createZodDto`), não class-validator.
  Motivo: reaproveitar os schemas Zod no *tool use* da Claude API na Fase 4
  (consistência ponta a ponta). `ZodValidationPipe` registrado como `APP_PIPE` global.
- **Migrations com `prisma migrate`** (arquivos versionados em `prisma/migrations`),
  não `prisma db push`. Usa `DIRECT_URL` (porta 5432); o runtime usa `DATABASE_URL`
  (pooler 6543).
- **Auth**: o NestJS **valida o JWT emitido pelo Supabase Auth** (não recria login
  próprio). O projeto usa **JWT Signing Keys assimétricas (ECC P-256 → ES256)**, então
  a strategy `supabase-jwt` valida **via JWKS**: busca a chave pública em
  `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` (jwks-rsa, com cache + rate limit),
  resolve pelo `kid` do header e valida `issuer`/`audience`. **Não há segredo
  compartilhado** — o fallback HS256/`SUPABASE_JWT_SECRET` foi removido (a chave legada
  só verificava tokens pré-migração, já todos expirados). Guard `SupabaseJwtGuard`,
  decorator `@CurrentUser()` extrai `user.id` do `sub`. As opções da strategy estão
  isoladas em `buildSupabaseJwtOptions()` para testabilidade (o teste mocka o endpoint
  JWKS com nock + um par de chaves EC).
- **Dinheiro**: `Decimal(12,2)` no Prisma; agregação financeira feita em centavos
  (inteiros) para evitar erro de ponto flutuante. Lógica pura isolada em
  `FinanceService` (testável sem I/O).
- **Escopo por usuário**: toda query de serviço é filtrada por `user_id`. Em runtime a
  API usa a service role / conexão direta do Prisma (RLS não é aplicado pelo Prisma).
- **RLS como defesa em profundidade**: policies SQL escopando `auth.uid() = user_id`
  nas tabelas `expenses`, `incomes`, `tasks`, `whatsapp_messages` (migration
  `enable_rls`). Protege acessos que passem pelo PostgREST/Supabase client (ex.: frontend
  acessando direto), não o caminho do Prisma com service role.

### LGPD
- `DELETE /api/users/me` remove o usuário com cascata (Prisma `onDelete: Cascade`) em
  despesas/receitas/tarefas/mensagens. Export de dados fica para fase posterior.

### Correção pós-Fase 1 (bug de vínculo do perfil)
- `POST /api/users` criava o perfil com `id` aleatório, sem vincular ao `sub` do JWT.
  Como tudo é escopado por `auth uid` e `GET /users/me` busca por ele, o perfil ficava
  órfão (404 eterno). **Corrigido**: o endpoint agora usa `@CurrentUser()` e o service faz
  `upsert` com `id = userId` (auth uid) — idempotente no reenvio do onboarding. O `id` da
  tabela `users` **é** o auth uid do Supabase.

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
- **Onboarding**: como `expenses/incomes/tasks` têm FK para `users` e a conta é WhatsApp-first,
  após o primeiro login a tela `/onboarding` cria o perfil com **telefone (E.164)** via
  `POST /api/users`. `GET /users/me` = 404 dispara o onboarding.

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
  compromisso/agenda. Uma consulta médica é uma `task` com `dueDate` + `hasTime=true`. A
  visão de calendário (Fase 5–6) lê as mesmas `tasks`; a extração da IA (Fase 4) produz
  `{ description, dueDate, hasTime }` de uma mensagem só. Separar em `events` só se surgir
  necessidade de local/duração/participantes/integração com calendários externos.

### Extras da web (pós-Fase 2)
- **Dark mode**: `next-themes` (`ThemeProvider`, `attribute="class"`), default do sistema +
  toggle Sistema/Claro/Escuro persistido. A paleta escura vive em `.dark` no `globals.css`.
  `<html suppressHydrationWarning>` é obrigatório. Toggle no app (sidebar/topo) e nas telas
  de auth.
- **Landing page pública**: a rota `/` é a página de marketing (server component, com
  `metadata` de SEO) — NÃO redireciona mais. Nav ciente de sessão ("Entrar/Criar conta" ↔
  "Ir para o painel"). Rotas do app ficam em `/dashboard`, `/financas`, `/relatorios`,
  `/tarefas`. O login, após autenticar, manda para `/dashboard`.
- **Navegação mobile**: no mobile o app usa **tab bar fixa no rodapé** (4 itens) + topo
  enxuto (logo, tema, avatar → menu de conta). Desktop segue com a sidebar. Em `app-shell.tsx`.
- **Base UI (shadcn base) — pegadinhas de runtime** (o `tsc` não pega): (1) `DropdownMenuLabel`
  é um `Menu.GroupLabel` e precisa estar dentro de um `DropdownMenuGroup`; (2) `Button` usado
  como link (`render={<Link/>}`) deve receber `nativeButton={false}` para não perder semântica
  e não poluir o console.

## Relatórios financeiros (Fase 5 adiantada — endpoint + web)

Feito antes da Fase 3 a pedido do produto. O **endpoint é a peça reutilizável**: na Fase 5,
o worker do WhatsApp chama o mesmo `GET /api/reports` para responder relatórios por mensagem.

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
