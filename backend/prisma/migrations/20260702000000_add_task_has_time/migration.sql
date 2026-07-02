-- Adiciona has_time: quando true, a hora em due_date é significativa
-- (compromisso/agenda). Quando false, due_date é o dia inteiro (tarefa comum).
ALTER TABLE "tasks" ADD COLUMN "has_time" BOOLEAN NOT NULL DEFAULT false;
