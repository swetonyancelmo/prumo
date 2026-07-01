-- Row Level Security (RLS) — defesa em profundidade.
-- Escopa cada linha ao dono via `auth.uid() = user_id`.
--
-- Contexto:
--   - `auth.uid()` é a função do Supabase que retorna o UUID do usuário
--     autenticado (do JWT). Só tem efeito em conexões que passam pelo
--     PostgREST / supabase-js (ex.: o frontend acessando o banco direto).
--   - O backend NestJS acessa via Prisma com credenciais de owner/service role,
--     que por padrão NÃO são sujeitas a RLS (BYPASSRLS) — o escopo por usuário
--     ali é garantido na camada de serviço (`where: { userId }`).
--   - Portanto, estas policies protegem o caminho Supabase-client, não o Prisma.
--
-- `user_id` nestas tabelas referencia `users.id`, que por sua vez espelha o
-- `auth.users.id` do Supabase (mesmo UUID). Por isso a comparação direta com
-- `auth.uid()` funciona.
--
-- ATENÇÃO sobre FORCE ROW LEVEL SECURITY:
--   FORCE sujeita até o DONO da tabela às policies. Ele NÃO afeta roles com o
--   atributo BYPASSRLS. No Supabase, o role `postgres` (usado pelo Prisma) tem
--   BYPASSRLS, então o backend continua funcionando normalmente. PORÉM, se você
--   conectar o Prisma com um role SEM BYPASSRLS que seja dono das tabelas, o
--   FORCE vai bloquear o backend (pois `auth.uid()` é NULL fora do contexto do
--   Supabase Auth). Nesse caso, troque `FORCE ROW LEVEL SECURITY` por apenas
--   `ENABLE ROW LEVEL SECURITY`.

-- ==========================================================================
-- expenses
-- ==========================================================================
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" FORCE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON "expenses"
  FOR SELECT USING (auth.uid() = "user_id");

CREATE POLICY "expenses_insert_own" ON "expenses"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "expenses_update_own" ON "expenses"
  FOR UPDATE USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "expenses_delete_own" ON "expenses"
  FOR DELETE USING (auth.uid() = "user_id");

-- ==========================================================================
-- incomes
-- ==========================================================================
ALTER TABLE "incomes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incomes" FORCE ROW LEVEL SECURITY;

CREATE POLICY "incomes_select_own" ON "incomes"
  FOR SELECT USING (auth.uid() = "user_id");

CREATE POLICY "incomes_insert_own" ON "incomes"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "incomes_update_own" ON "incomes"
  FOR UPDATE USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "incomes_delete_own" ON "incomes"
  FOR DELETE USING (auth.uid() = "user_id");

-- ==========================================================================
-- tasks
-- ==========================================================================
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON "tasks"
  FOR SELECT USING (auth.uid() = "user_id");

CREATE POLICY "tasks_insert_own" ON "tasks"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "tasks_update_own" ON "tasks"
  FOR UPDATE USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "tasks_delete_own" ON "tasks"
  FOR DELETE USING (auth.uid() = "user_id");

-- ==========================================================================
-- whatsapp_messages
-- ==========================================================================
ALTER TABLE "whatsapp_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "whatsapp_messages" FORCE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_select_own" ON "whatsapp_messages"
  FOR SELECT USING (auth.uid() = "user_id");

CREATE POLICY "whatsapp_messages_insert_own" ON "whatsapp_messages"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "whatsapp_messages_update_own" ON "whatsapp_messages"
  FOR UPDATE USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "whatsapp_messages_delete_own" ON "whatsapp_messages"
  FOR DELETE USING (auth.uid() = "user_id");
