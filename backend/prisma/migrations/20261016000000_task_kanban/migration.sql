-- Kanban de tarefas: o texto curto vira "title", "description" passa a ser o
-- texto longo opcional, e o booleano is_completed vira uma coluna de status.
-- Escrita à mão: o diff do Prisma faria drop + add e apagaria os títulos.

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('backlog', 'todo', 'doing', 'done');

-- Título preserva o texto atual
ALTER TABLE "tasks" RENAME COLUMN "description" TO "title";
ALTER TABLE "tasks" ADD COLUMN "description" TEXT;

-- is_completed → status
ALTER TABLE "tasks" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'todo';
UPDATE "tasks" SET "status" = 'done' WHERE "is_completed";
DROP INDEX "tasks_user_id_is_completed_idx";
ALTER TABLE "tasks" DROP COLUMN "is_completed";

-- CreateIndex
CREATE INDEX "tasks_user_id_status_idx" ON "tasks"("user_id", "status");
