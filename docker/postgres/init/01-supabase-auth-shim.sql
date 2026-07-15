-- ==========================================================================
-- Shim de compatibilidade com o Supabase — SOMENTE ambiente local (Docker).
-- ==========================================================================
--
-- Por que isto existe:
--   A migration `20260701000100_enable_rls` cria policies que comparam
--   `auth.uid() = user_id`. `auth.uid()` é uma função do Supabase (schema
--   `auth`), que NÃO existe num Postgres puro. Sem este shim, o
--   `prisma migrate dev/deploy` quebra ao aplicar aquela migration localmente.
--
-- A alternativa seria tornar a migration condicional, mas isso faria o
-- histórico de migrations divergir entre local e Supabase — exatamente o que
-- `prisma migrate` (arquivos versionados, ver CLAUDE.md) existe para evitar.
-- Preferimos: o BANCO local imita o Supabase; as migrations continuam idênticas
-- nos dois ambientes.
--
-- Este arquivo NÃO é uma migration do Prisma de propósito: ele descreve o
-- ambiente (o que o Supabase já provê de fábrica), não o schema da aplicação.
-- Ele roda só na primeira subida do container (volume vazio).
--
-- Comportamento: replica a implementação do Supabase, que lê o `sub` do JWT a
-- partir de settings de sessão injetadas pelo PostgREST. No Docker local nada
-- injeta essas settings, então `auth.uid()` retorna NULL e as policies negam
-- tudo — mesma coisa que acontece no Supabase para um usuário não autenticado.
-- Isso NÃO afeta o backend: o Prisma conecta como superusuário, e superusuário
-- ignora RLS (inclusive FORCE ROW LEVEL SECURITY). O escopo por usuário no
-- caminho do Prisma é garantido na camada de serviço (`where: { userId }`).

CREATE SCHEMA IF NOT EXISTS auth;

-- Espelha `auth.uid()` do Supabase.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      -- Formato antigo do PostgREST (claim individual).
      current_setting('request.jwt.claim.sub', true),
      -- Formato atual: todas as claims num JSON só.
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;

-- Espelha `auth.role()` do Supabase (não usado pelas policies atuais, mas é o
-- outro helper que aparece em policies escritas para Supabase).
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.role', true),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ),
    ''
  )::text
$$;

GRANT USAGE ON SCHEMA auth TO PUBLIC;
