# Ordenai — Frontend

Painel web do Ordenai (Next.js 16 + Tailwind v4 + shadcn/ui, base UI).
Consome a API NestJS em `../backend` e autentica via Supabase Auth (JWT ES256).

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha as variáveis
npm run dev                        # http://localhost:3000
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

## Telas (Fase 2)

- `/login` e `/onboarding` (cria o perfil com telefone — WhatsApp-first)
- `/dashboard` — saldo do mês, gastos por categoria, prévia de tarefas
- `/financas` — despesas e receitas do mês (criar/editar/excluir)
- `/tarefas` — tarefas com vencimento, **horário opcional** (com hora = compromisso/agenda)
  e recorrência (criar/editar/concluir/excluir)
