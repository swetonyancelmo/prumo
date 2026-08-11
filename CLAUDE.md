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
- **Banco de dados — produção**: **Neon** (Postgres gerenciado)
- **Auth**: **própria, no NestJS** (e-mail + senha, bcrypt, JWT HS256). Sem provedor
  externo. Ver "Decisões tomadas — auth própria e deploy".
- **Segurança**: Rate Limit (`@nestjs/throttler`) + cabeçalhos HTTP (`helmet`).
- **Frontend web**: Next.js 16 + Tailwind v4 + shadcn/ui (base UI)
- **ORM**: Prisma
- **Deploy**: Vercel (frontend) + Render (API) + Neon (banco). Ver `DEPLOY.md`.

## Modelo de dados

```
users
  id, email (único), password_hash, name, created_at

categories
  id, user_id, name, type (despesa|receita), is_default

expenses
  id, user_id, amount, category_id, description, occurred_at, created_at

incomes
  id, user_id, amount, description, received_at, created_at

tasks
  id, user_id, description, due_date, has_time, is_recurring,
  recurrence_rule (nullable), is_completed, created_at

notes
  id, user_id, title (nullable), content, created_at, updated_at
```

`users.id` é gerado pelo próprio app (uuid). `email` é a credencial de login — obrigatório
e único, normalizado para minúsculas na validação. `password_hash` **nunca** sai numa
resposta da API (o `UsersService` usa `select` explícito). Valores monetários usam
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

- [x] **Backend core**: modelagem, CRUD REST, auth própria (bcrypt + JWT)
- [x] **Painel web**: cadastro/login, dashboard, finanças, tarefas (Next.js)
- [x] **Relatórios**: `GET /api/reports` + `/relatorios` (semana→ano, gráficos, variação)
- [x] **Relatório em PDF**: botão "Baixar PDF" em `/relatorios`, documento com a marca
- [x] **Pronto para deploy**: Neon + Render + Vercel (`render.yaml`, `DEPLOY.md`)
- [x] **PWA instalável**: manifest, ícones, atalhos e polimento de toque (ver
      "Decisões tomadas — PWA e uso no celular")
- [x] **Anotações**: CRUD de notas com formatação markdown e visualização em tempo real (Next.js + NestJS)
- [x] **Rate Limit e Segurança**: Limitação de taxa por IP, Helmet e trust proxy na API
- [ ] **Recuperação de senha**: exige provedor de e-mail (Resend/similar). Hoje, quem
      esquece a senha não tem como recuperar a conta.
- [ ] **Export de dados (LGPD)**: endpoint + botão que devolva TODOS os dados do
      usuário em formato aberto. O PDF de relatório não cobre isto — ele é um recorte
      financeiro de um período, não o acervo da conta.
- [ ] **Recorrência de tarefas de verdade**: gerar as ocorrências a partir de `recurrence_rule`.
- [ ] **Notificações de vencimento**: cron diário + canal (e-mail) — não há infra ainda.
- [ ] **Gestão de categorias**: hoje só dá para criar categoria inline no lançamento;
      falta renomear/excluir.
- [ ] **Offline de verdade**: o app é instalável, mas todo dado vem da API. Exigiria
      service worker com cache + fila de lançamentos feitos sem rede e resolução de
      conflito. Ver "Decisões tomadas — PWA e uso no celular".

## Convenções para o Claude Code

- Estrutura de módulos do NestJS: `UsersModule`, `FinanceModule`, `TasksModule`,
  `NotesModule`, `ReportsModule`, `AuthModule`.
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
- **Onboarding só com nome**: sem telefone. *(Obsoleto desde 2026-08-09: o onboarding
  deixou de existir — o cadastro já cria o perfil completo.)*
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
  mobile), login, nav e footer da landing.
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
  não `prisma db push`. Uma única `DATABASE_URL` serve ao runtime e ao `migrate` —
  ver "Uma URL de banco só" nas decisões de auth/deploy.
- **Auth**: substituída em 2026-08-09 por implementação própria — ver "Decisões
  tomadas — auth própria e deploy".
- **Dinheiro**: `Decimal(12,2)` no Prisma; agregação financeira feita em centavos
  (inteiros) para evitar erro de ponto flutuante. Lógica pura isolada em
  `FinanceService` (testável sem I/O).
- **Escopo por usuário**: toda query de serviço é filtrada por `user_id`. É a **única**
  barreira entre os dados de dois usuários — não há RLS por baixo desde 2026-08-09.
- **RLS removido em 2026-08-09** junto com o Supabase: as policies dependiam de
  `auth.uid()` (função do Supabase) e só protegiam o caminho PostgREST, que deixou de
  existir. O escopo por usuário é garantido na camada de serviço (`where: { userId }`).

### LGPD
- `DELETE /api/users/me` remove o usuário com cascata (Prisma `onDelete: Cascade`) em
  categorias/despesas/receitas/tarefas. **Export de dados fica para fase posterior.**

### Correção pós-Fase 1 (bug de vínculo do perfil)
- `POST /api/users` criava o perfil com `id` aleatório, sem vincular ao `sub` do JWT,
  deixando o perfil órfão (404 eterno). Corrigido na época com `upsert` por auth uid.
  *(Histórico: o endpoint deixou de existir em 2026-08-09 — quem cria o usuário agora é
  `POST /api/auth/register`, e a classe inteira de bug sumiu junto.)*

## Decisões tomadas — banco local em Docker

Registradas em 2026-07-15. Efetivadas. Substitui o Supabase **como banco de desenvolvimento**.

- **`docker-compose.yml` na raiz** (não em `backend/`): a infra é do repo, não de um app só.
  Sobe `postgres:16-alpine` como `ordenai-postgres` na porta 5432, credenciais/base
  `ordenai`/`ordenai_dev`/`ordenai`, volume nomeado `ordenai_postgres_data`, healthcheck com
  `pg_isready`. `TZ=America/Sao_Paulo` fixado no container porque os relatórios agregam em
  horário local do processo — sem isso, local e produção divergiriam.
- **Sem pooler local**: `DATABASE_URL` aponta direto para a 5432 do container.
- **O shim de `auth.uid()` e os init scripts foram removidos em 2026-08-09**, junto com o
  RLS que dependia deles. O `docker/` inteiro deixou de existir: o Postgres local é agora
  um Postgres puro, sem nada que imite o Supabase.

## Decisões tomadas — Fase 2 (frontend web)

Registradas em 2026-07-02. Efetivadas.

### Stack e estrutura
- **Next.js 16 (App Router) + Tailwind v4 + shadcn/ui** em `frontend/`. shadcn com base
  **`base` (Base UI)**, não Radix — componentes usam a prop **`render`** (não `asChild`),
  ícones **lucide**. Fontes via `next/font`: **Bricolage Grotesque** (títulos) + **Figtree**
  (corpo). Tokens de tema (paleta) como CSS variables em `src/app/globals.css`.
- **Next 16 tem breaking changes** (ver `frontend/AGENTS.md`): Middleware virou `proxy.js`;
  `cookies()`/`params` são async; ESLint com `react-hooks/set-state-in-effect` como erro.
  Por isso a **auth é client-side** (sem proxy/cookies de servidor): sessão no navegador,
  guard num layout client que redireciona.

### Autenticação e acesso a dados
- **Todo dado vem da API NestJS**, com o JWT no header `Authorization: Bearer` (wrapper em
  `src/lib/api.ts`). O front nunca fala com o Postgres direto.
- Única variável `NEXT_PUBLIC_*`: `NEXT_PUBLIC_API_URL`. Não há segredo no front — a
  segurança real é a validação do JWT no backend.
- Detalhes da sessão (tokens, refresh, storage): ver "Decisões tomadas — auth própria e
  deploy".

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
  (escopo por `userId`, a única barreira entre usuários) e delega para a lógica pura. Testes em
  `reports.util.spec.ts`.
- **Resposta**: `{ period, range:{start,end,label}, totals:{incomes,expenses,balance},
  previous:{...} (para variação), byCategory:[{name,total,previousTotal,share}],
  series:[{label,incomes,expenses}] }`. Buckets da série por período: semana→7 dias,
  mês→semanas, trimestre→3 meses, semestre→6 meses, ano→12 meses.
- **Fuso**: cálculos de calendário em horário LOCAL do processo — em produção fixar
  `TZ=America/Sao_Paulo`. A âncora é enviada pelo front como **meio-dia local** (`...T12:00:00`
  sem `Z`) para não escorregar de dia.

### Exportação em PDF (`/relatorios` → "Baixar PDF")

Registrado em 2026-08-09. Documento em `frontend/src/lib/report-pdf.tsx`.

- **`@react-pdf/renderer`, gerado no navegador** — nada de PDF no backend. Fazer isso no
  servidor exigiria Chromium/Puppeteer, que não cabe nos 512MB do plano free do Render.
  A biblioteca entra por **import dinâmico no clique**: é pesada e só uma minoria exporta.
- **Vetorial, não print screen.** Os gráficos são redesenhados com primitivas do react-pdf
  (barras como `View`, linha de saldo como `Svg`/`Polyline`). Não dá para reaproveitar os
  SVGs do Recharts: eles dependem de CSS variables que não existem fora do navegador.
- **Sempre no tema claro**, com as cores hex espelhando o `:root` do `globals.css`. A cor
  de cada categoria vem de `categoryColorHex()`, que compartilha o hash com
  `categoryColor()` — a "aba" no PDF tem de ser a mesma cor da tela.
- **Fonte Helvetica** (embutida no PDF). Bricolage/Figtree vêm via `next/font` e não têm
  URL estável para registrar; a marca fica por conta do logo, da paleta e do layout.
- **Layout calibrado para caber em uma página A4** até ~9 categorias, que cobre um mês
  típico. Acima disso pagina normalmente: cabeçalho, rodapé e cabeçalho da tabela são
  `fixed` e se repetem.
- **`range.end` da API é exclusivo** (1º de setembro para agosto) — o PDF recua um instante
  para exibir o último dia real do período.
- Hifenização desligada (`Font.registerHyphenationCallback`) para nome de categoria não
  sair partido ao meio.

### Frontend — `/relatorios`
- Seletor de período (ToggleGroup), navegação ‹ ›, KPIs com variação vs. período anterior,
  3 gráficos (barras Receita×Despesa, rosca por categoria, linha de saldo acumulado) e tabela.
- Gráficos com **shadcn Chart (Recharts)**, reagindo ao dark mode via as `--chart-1..5`.
  A paleta categórica foi validada pela skill `dataviz` (daltonismo OK; contraste de algumas
  cores sobre branco fica <3:1, daí o **relief obrigatório**: rótulos/legenda + a tabela).

## Decisões tomadas — PWA e uso no celular

Registradas em 2026-08-09. Efetivadas. O celular passou a ser o dispositivo
principal de uso, e o Prumo é instalável na tela de início.

- **PWA, não app de loja.** Empacotar com Capacitor/TWA custaria conta de
  desenvolvedor Apple (US$ 99/ano), revisão a cada versão e um pipeline de build
  separado — tudo isso para entregar a mesma tela. O PWA instala pela Vercel, em
  HTTPS, e atualiza a cada deploy sem passar por ninguém.
- **`app/manifest.ts`** (rota `/manifest.webmanifest` gerada pelo Next). Detalhes
  que não são óbvios: `start_url` é **`/dashboard`**, não `/` — quem instalou o
  app não quer cair na landing de marketing toda vez; e há um ícone `maskable`
  **separado** do comum, porque o Android recorta o ícone numa forma própria e só
  o círculo central de 80% é seguro.
- **Ícones do PWA**: `public/icon-192.png`, `icon-512.png` e
  `icon-maskable-512.png`, gerados de `assets/brand/prumo-logo.png` por script
  pontual (não versionado), como os demais ícones da marca.
- **`themeColor` tem duas cores** (`viewport` no layout raiz), espelhando
  `--sidebar` no claro e no escuro. Uma cor só deixaria a barra de status do
  celular brigando com o topo do app em um dos dois temas.
- **Sem service worker / sem offline.** O manifest torna o app instalável, mas
  todo dado vem da API por HTTP. Offline de verdade exigiria cache de respostas
  **e** fila de lançamentos feitos sem rede, com resolução de conflito — é
  feature própria, não um detalhe do PWA. Fica no roadmap.
- **`InstallPrompt`** (`components/install-prompt.tsx`, exibido no dashboard):
  no Android usa o evento `beforeinstallprompt` e vira um botão de instalar de
  verdade; **no iOS esse evento não existe**, e o único caminho é o menu
  Compartilhar do Safari — ali o componente ensina o passo a passo. Some quando
  o app já roda instalado (`display-mode: standalone`, mais a flag proprietária
  `navigator.standalone` do Safari) e fica escondido depois de dispensado.
- **Atalhos do ícone** (segurar o ícone na tela de início): "Novo lançamento" e
  "Nova tarefa" abrem `/financas?novo=1` e `/tarefas?nova=1`. O hook
  `lib/use-shortcut.ts` lê a marca, **limpa a query** e serve só para
  *inicializar* o estado do diálogo — se controlasse o diálogo, recarregar a
  página o reabriria para sempre. Ler query obriga a um `<Suspense>` em volta.

### Toque, não ponteiro

- **Bug corrigido**: em `entry-row.tsx`, editar e excluir um lançamento ficavam
  atrás de `opacity-0` + `group-hover`. Como não há hover em celular, **não havia
  como mexer num lançamento pelo telefone**. Agora só somem sob `pointer-fine`.
- **O critério é `pointer-coarse`/`pointer-fine`, não breakpoint.** Alvo de toque
  é modalidade de entrada, não largura de tela — um celular deitado passa de
  `sm` e continua sendo um celular. Os tamanhos `default`, `lg`, `icon` e
  `icon-lg` do `Button` crescem sob `pointer-coarse` (32→40px, 36→44px); os
  tamanhos densos (`xs`, `sm`, `icon-*` pequenos) ficam como estão, e quem os usa
  em superfície de toque ajusta no lugar.
- **Diálogo vira folha no rodapé** no mobile (`ui/dialog.tsx`) e volta a ser
  caixa centrada a partir de `sm`. A centralização no desktop passou a usar
  `inset-0 + m-auto` em vez de `-translate-*`: as animações de entrada/saída
  também escrevem na propriedade `translate`, e com as duas coisas juntas o
  diálogo saltava. O rodapé do diálogo respeita `env(safe-area-inset-bottom)`.

## Decisões tomadas — auth própria e deploy

Registradas em 2026-08-09. Efetivadas. **Removem o Supabase do projeto por completo.**

### Por que saiu o Supabase
O produto vai para produção em **Vercel + Render + Neon**. O Supabase só sobrava como
provedor de identidade — uma quarta plataforma, com um modelo de dados (auth uid externo
ditando `users.id`) que já tinha custado um bug de perfil órfão. Autenticação por e-mail e
senha é escopo pequeno o bastante para morar no NestJS, ao lado do resto.

### Auth própria (NestJS)
- **Senha**: `bcryptjs` com **12 rounds**, guardada em `users.password_hash`. `bcryptjs`
  (JS puro) e não `bcrypt` (nativo) de propósito — o build do Render não precisa de
  node-gyp. Mínimo de 8 caracteres, máximo de 72 (limite do próprio bcrypt).
- **Tokens**: dois JWTs **HS256** assinados com `JWT_SECRET` — acesso (15min) e refresh
  (30 dias) —, distinguidos pela **audience** (`prumo:access` / `prumo:refresh`). Um access
  token **não** serve para renovar sessão; há teste cobrindo isso. `getJwtSecret()` falha na
  subida se a variável não existir, em vez de deixar a API subir sem conseguir validar nada.
- **Endpoints**: `POST /api/auth/register|login|refresh` (públicos). Não existe `/auth/me` —
  `GET /api/users/me` já faz isso.
- **Login não revela quem tem conta**: e-mail inexistente e senha errada devolvem a mesma
  mensagem, e o service compara contra um hash descartável (`DUMMY_HASH`) quando o usuário
  não existe, para o tempo de resposta não denunciar a diferença.
- **`password_hash` nunca sai da API**: o `UsersService` usa `select` explícito dos campos
  públicos. É `select` e não `omit` para que campo novo no schema não vaze por esquecimento.
- **Onboarding acabou**: o registro já cria o perfil completo (nome opcional vai no
  formulário de cadastro). Sumiram a tela `/onboarding`, o endpoint `POST /api/users` e o
  gate de "404 em `/users/me`".
- **Ainda não há**: recuperação de senha nem verificação de e-mail (dependem de provedor de
  e-mail), e nem revogação de sessão individual — trocar `JWT_SECRET` desloga todo mundo.

### Sessão no frontend
- Tokens em **localStorage** (`src/lib/auth-storage.ts`), não em cookie httpOnly: em
  produção o front (Vercel) e a API (Render) estão em domínios diferentes, e um cookie de
  sessão entre eles seria third-party — categoria que os navegadores vêm bloqueando.
  O custo é exposição a XSS, mitigado pelo access token curto.
- **Refresh automático em `lib/api.ts`**: um 401 dispara uma renovação e repete o request
  uma vez. A renovação é uma **promessa compartilhada** — o dashboard dispara vários
  requests juntos, e sem isso eles correriam para renovar em paralelo, com os perdedores
  usando um refresh token já rotacionado.
- `auth-storage` notifica a árvore React quando a sessão morre fora dela (refresh falhou),
  senão a UI seguiria mostrando o painel de uma sessão encerrada.

### Banco: Supabase → Neon
- **Migrations foram squashadas** numa única `20260809000000_init`. O projeto nunca tinha
  sido deployado, então não havia histórico a preservar — e a migration `enable_rls` usava
  `auth.uid()`, que não existe no Neon.
- **RLS foi removido, não portado.** Além de depender de `auth.uid()`, ele protegia o
  caminho PostgREST, que sumiu junto com o Supabase. Pior: as policies usavam
  `FORCE ROW LEVEL SECURITY`, e o `neondb_owner` do Neon **não tem `BYPASSRLS`** — mantê-las
  teria bloqueado o próprio backend (atributo de role não se herda por membership). O escopo
  por usuário vive na camada de serviço.
- **Uma URL de banco só.** O Neon expõe dois hosts para o mesmo banco (com e sem
  `-pooler`), e o arranjo canônico do Prisma é `DATABASE_URL` no pooler + `directUrl` no
  direto. Abandonamos isso em 2026-08-09: **usamos só a conexão direta**, em
  `DATABASE_URL`. O `prisma migrate` (que roda no build do Render) não funciona de forma
  confiável através do PgBouncer em modo transação — depende de advisory locks e sessão
  persistente. Com uma instância free abrindo poucas conexões, o pooler resolvia um
  problema que não temos, ao custo de uma segunda variável que já causou deploy quebrado
  por estar ausente. `sslmode=require` é obrigatório; `channel_binding=require`, que o
  Neon inclui por padrão, precisa ser removido — o driver do Prisma não o entende.

### Deploy
- **`render.yaml` na raiz** (Blueprint): cria o serviço já configurado. `rootDir: backend`,
  região `virginia` (não há região no Brasil no free; parear com Neon em `us-east-1`),
  `JWT_SECRET` com `generateValue: true` — o segredo de produção não existe no repo.
- **Migration roda no `buildCommand`**, não no start: uma vez por deploy, não a cada
  restart. Em plano pago o lugar certo seria `preDeployCommand`, indisponível no free.
- **`GET /api/health` consulta o banco** e é o `healthCheckPath` do Render. `DATABASE_URL`
  errada derruba o deploy ali, com erro explícito, em vez de quebrar na cara do usuário.
- **CORS deixou de ser aberto**: `main.ts` lê `CORS_ORIGIN` (lista separada por vírgula).
  Sem a variável, libera geral — aceitável no localhost, por isso ela é obrigatória no
  `render.yaml`.
- **`app.listen(port, '0.0.0.0')`**: o proxy do Render não alcança `localhost`.
- **`TZ=America/Sao_Paulo` fixado no Render** — os relatórios agregam em horário local do
  processo; em UTC, lançamento do fim do dia cai no dia seguinte.
- **Vercel**: Root Directory = `frontend` (é monorepo). `frontend/vercel.json` fixa a
  região `gru1` (São Paulo). Única env: `NEXT_PUBLIC_API_URL`, **com o sufixo `/api`**.
- Passo a passo completo em `DEPLOY.md`.

## Decisões tomadas — Anotações e Segurança (Rate Limit & Helmet)

Registradas em 2026-08-11. Efetivadas.

- **Anotações (Notes CRUD)**:
  - Adicionada a tabela `Note` vinculada ao usuário com exclusão em cascata.
  - Criada a rota de frontend `/anotacoes` integrada no menu lateral.
  - Implementada uma tela master-detail responsiva (divide em duas colunas no desktop, tela cheia no mobile).
  - Incluídos botões de formatação markdown (Negrito, Itálico, Código inline, Bloco de código, Títulos e Listas) e atalhos de teclado `Ctrl+B` / `Ctrl+I`.
  - Adicionada uma aba "Visualizar" com um parser Markdown leve que limpa a string escapando caracteres HTML antes de processá-los, garantindo total blindagem contra injeções de XSS.
- **Rate Limit na API**:
  - Limite global configurado para 100 requisições/min por IP.
  - Limite estrito de 5 requisições/min por IP em rotas críticas do `AuthController` (`register`, `login`, `refresh`) para impedir brute force.
  - Resposta customizada amigável de erro 429 configurada diretamente no NestJS.
- **Helmet e Reverse Proxy**:
  - Helmet ativado globalmente para injetar cabeçalhos HTTP recomendados.
  - `trust proxy` ativado no NestJS/Express para ler corretamente o IP dos clientes por trás dos proxies da Vercel/Render.
