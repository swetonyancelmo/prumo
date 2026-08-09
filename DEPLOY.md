# Deploy do Prumo

Três plataformas, todas no plano gratuito:

| Peça | Plataforma | O que roda |
|---|---|---|
| Banco de dados | **Neon** | Postgres 16 gerenciado |
| API | **Render** | NestJS (`backend/`) |
| Frontend | **Vercel** | Next.js (`frontend/`) |

A ordem importa: **Neon → Render → Vercel**. A API precisa do banco para subir,
e o frontend precisa da URL da API.

> **Pré-requisito:** o repositório precisa estar no GitHub (ou GitLab/Bitbucket).
> Render e Vercel fazem deploy a partir do repositório remoto, não da sua máquina.

---

## 1. Neon — banco de dados

1. Crie a conta em [neon.tech](https://neon.tech) e um projeto novo.
2. Configure:
   - **Postgres version**: 16 ou superior
   - **Region**: `AWS US East (N. Virginia)` — mesma região da API no Render,
     para o hop entre API e banco ser curto
   - **Database name**: `prumo`
3. Vá em **Connect** e copie a connection string. O Neon oferece **dois hosts
   para o mesmo banco**, e você vai precisar dos dois — a diferença é o sufixo
   `-pooler` no host:

   | Variável | Host | Para quê |
   |---|---|---|
   | `DATABASE_URL` | **com** `-pooler` | runtime (PgBouncer aguenta muitas conexões curtas) |
   | `DIRECT_URL` | **sem** `-pooler` | `prisma migrate` (exige conexão direta) |

   Monte assim, trocando usuário/senha/host pelos seus:

   ```
   DATABASE_URL=postgresql://USER:SENHA@ep-xxx-pooler.us-east-1.aws.neon.tech/prumo?sslmode=require&pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://USER:SENHA@ep-xxx.us-east-1.aws.neon.tech/prumo?sslmode=require
   ```

   `sslmode=require` é obrigatório — o Neon só aceita TLS. `pgbouncer=true`
   avisa o Prisma para não usar prepared statements, incompatíveis com o pooler.

Guarde as duas strings: elas vão para o Render no próximo passo.

> **Autosuspend:** no plano free o Neon hiberna o banco após ~5 min sem uso. A
> primeira consulta depois disso demora ~1s a mais. É esperado, não é bug.

---

## 2. Render — API

1. Crie a conta em [render.com](https://render.com) e conecte o GitHub.
2. **New +** → **Blueprint** → escolha este repositório.
   O Render lê o [`render.yaml`](render.yaml) da raiz e já configura build,
   start, health check e região sozinho.
3. Ele vai pedir as três variáveis que **não** ficam no repo:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | a string **com** `-pooler` do passo 1 |
   | `DIRECT_URL` | a string **sem** `-pooler` do passo 1 |
   | `CORS_ORIGIN` | deixe **em branco por enquanto** — você só conhece a URL da Vercel no passo 3 |

   `JWT_SECRET` é gerado automaticamente pelo Render (`generateValue: true`).
   Não invente um valor nem reaproveite o de desenvolvimento.

4. Clique em **Apply**. O primeiro deploy leva alguns minutos: instala as
   dependências, gera o Prisma Client, compila o TypeScript e **aplica as
   migrations no Neon**.
5. Confirme que subiu:

   ```bash
   curl https://SEU-SERVICO.onrender.com/api/health
   # {"status":"ok","database":"ok","timestamp":"..."}
   ```

   Se vier `503`, o `DATABASE_URL` está errado — o health check consulta o banco
   de propósito, para o erro aparecer aqui e não na cara do usuário.

Anote a URL do serviço (`https://SEU-SERVICO.onrender.com`).

> **Cold start:** no plano free o Render derruba o serviço após 15 min sem
> tráfego. O próximo acesso demora ~50s para responder enquanto ele volta. Na
> prática, o primeiro login do dia é lento. Só o plano pago elimina isso.

---

## 3. Vercel — frontend

1. Crie a conta em [vercel.com](https://vercel.com) e importe o repositório.
2. Na tela de import, ajuste:
   - **Root Directory**: `frontend` ← **isto é obrigatório**, o repo é um
     monorepo e sem isso a Vercel tenta buildar a raiz e falha
   - **Framework Preset**: Next.js (detectado sozinho)
3. Em **Environment Variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://SEU-SERVICO.onrender.com/api` |

   O sufixo **`/api`** faz parte da URL — é o prefixo global da API. Sem ele,
   toda chamada dá 404.

4. **Deploy**. Ao terminar, anote a URL (`https://prumo-xxx.vercel.app`).

---

## 4. Fechar o CORS

Só agora você conhece a URL da Vercel. Volte ao Render:

**Environment** → `CORS_ORIGIN` → cole a URL do frontend, **sem barra no final**:

```
CORS_ORIGIN=https://prumo-xxx.vercel.app
```

Se tiver domínio próprio, liste os dois separados por vírgula:

```
CORS_ORIGIN=https://prumo-xxx.vercel.app,https://prumo.com.br
```

Salve — o Render reinicia o serviço sozinho. Sem esse passo a API aceita
chamadas de qualquer origem.

---

## 5. Validar

Abra a URL da Vercel e faça o caminho completo:

1. **Criar conta** (nome, e-mail, senha de 8+ caracteres)
2. Você cai direto no **dashboard** — não há passo de onboarding
3. Lance uma **despesa** em Finanças
4. Confira que ela aparece em **Relatórios**
5. **Saia e entre de novo** — os dados continuam lá

Se o cadastro falhar com erro de rede, é quase sempre uma destas três coisas:
`CORS_ORIGIN` com barra no final, `NEXT_PUBLIC_API_URL` sem o `/api`, ou o
serviço do Render em cold start (espere ~50s e tente de novo).

---

## Depois do primeiro deploy

Render e Vercel ficam ligados ao branch `main`: todo push faz deploy
automático. Migrations novas são aplicadas pelo build do Render.

### Variáveis de ambiente, resumo

**Render (API)** — `render.yaml` já define `NODE_ENV`, `TZ`, `JWT_SECRET`,
`JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` e `NODE_VERSION`. Você preenche:

- `DATABASE_URL` (Neon, com `-pooler`)
- `DIRECT_URL` (Neon, sem `-pooler`)
- `CORS_ORIGIN` (URL da Vercel)

**Vercel (frontend)**:

- `NEXT_PUBLIC_API_URL` (URL do Render + `/api`)

### Limites conhecidos do plano gratuito

- **Cold start de ~50s** na API após 15 min ociosa (Render)
- **Banco hiberna** após ~5 min ociosa (Neon)
- **Sem recuperação de senha**: exige provedor de e-mail, ainda não configurado.
  Esqueceu a senha, hoje só recriando a conta.
- **Sem revogação de sessão individual**: trocar o `JWT_SECRET` no Render
  invalida as sessões de todo mundo de uma vez.
