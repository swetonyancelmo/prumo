-- Pivot: produto passa a ser 100% web (financeiro + tarefas), sem WhatsApp/IA.
-- Remove tudo que só existia para a integração de mensageria.
--
-- Escrita à mão e aplicada via `prisma migrate deploy` (não `migrate dev`): o
-- shadow database do `migrate dev` não tem o shim de `auth.uid()` (só o banco
-- principal recebe os init scripts do Docker), então ele quebraria ao reaplicar
-- a migration `enable_rls`. Mesmo padrão pelo qual as migrations anteriores já
-- eram aplicadas localmente.

-- 1. Colunas que referenciavam whatsapp_messages (FK some junto com a coluna).
ALTER TABLE "expenses" DROP COLUMN "raw_message_id";
ALTER TABLE "incomes" DROP COLUMN "raw_message_id";
ALTER TABLE "tasks" DROP COLUMN "raw_message_id";

-- 2. `source` (whatsapp|web) — sem WhatsApp, todo lançamento é web. Coluna vira
--    vestígio; removida junto com o enum.
ALTER TABLE "expenses" DROP COLUMN "source";
ALTER TABLE "incomes" DROP COLUMN "source";
ALTER TABLE "tasks" DROP COLUMN "source";

-- 3. Tabela de mensagens do WhatsApp (as policies de RLS caem junto com ela).
DROP TABLE "whatsapp_messages";

-- 4. Telefone do usuário (o índice único cai junto com a coluna).
ALTER TABLE "users" DROP COLUMN "phone_number";

-- 5. Enums que ficaram sem uso.
DROP TYPE "EntrySource";
DROP TYPE "MessageDirection";
