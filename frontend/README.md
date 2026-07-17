# Prumo — Frontend

Painel web do Prumo (Next.js 16 + Tailwind v4 + shadcn/ui, base UI).
Consome a API NestJS em `../backend` e autentica via Supabase Auth (JWT ES256).

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha as variáveis
npm run dev                        # http://localhost:3001
```

Suba o backend (`../backend`) em paralelo — por padrão o front espera a API em
`http://localhost:3000/api` (ajuste `NEXT_PUBLIC_API_URL` se necessário).

## Variáveis de ambiente

Ver `.env.local.example`. Só chaves públicas (`NEXT_PUBLIC_*`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.

## Design

Direção "caderno de organização que respira": paleta Névoa/Tinta/Orquídea/Menta/Coral,
tipografia Bricolage Grotesque + Figtree, e a "aba de categoria" como elemento de
assinatura. Tokens em `src/app/globals.css`.

## Telas

- `/` — **landing page** pública (marketing, SEO); nav ciente de sessão
- `/login` e `/onboarding` (cria o perfil — só o nome)
- `/dashboard` — saldo do mês, gastos por categoria, prévia de tarefas
- `/financas` — despesas e receitas do mês (criar/editar/excluir)
- `/relatorios` — relatórios financeiros por período (semana → ano): KPIs com variação,
  gráficos (barras, rosca, linha) e tabela por categoria. Consome `GET /api/reports`
- `/tarefas` — tarefas com vencimento, **horário opcional** (com hora = compromisso/agenda)
  e recorrência (criar/editar/concluir/excluir)

## Notas

- **Dark mode** (`next-themes`): default do sistema + toggle Sistema/Claro/Escuro.
- **Mobile**: tab bar fixa no rodapé + topo enxuto; desktop usa a sidebar.
- shadcn com base **Base UI** (não Radix): componentes usam `render` (não `asChild`).
