# docker/postgres/init

Scripts SQL que o container do Postgres roda **uma única vez**, na primeira
inicialização — ou seja, quando o volume `ordenai_postgres_data` está vazio.
Rodam em ordem alfabética, como `POSTGRES_USER` no banco `POSTGRES_DB`.

Editar um arquivo daqui **não afeta um container já inicializado**. Para
reaplicar, é preciso destruir o volume:

```bash
docker compose down -v && docker compose up -d
```

## O que NÃO vai aqui

Schema da aplicação (tabelas, colunas, índices). Isso é responsabilidade do
`prisma migrate` (`backend/prisma/migrations`), que roda igual em local e em
produção.

Aqui vai só o que **descreve o ambiente**: coisas que o Supabase já provê de
fábrica e que o Postgres puro não tem — hoje, o shim de `auth.uid()`.
