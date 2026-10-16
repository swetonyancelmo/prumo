import type { Task, TaskStatus } from "./types";
import { daysUntil, formatDate, formatTime } from "./format";

/** Colunas do quadro, na ordem em que aparecem. */
export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "todo", label: "A fazer" },
  { status: "doing", label: "Fazendo" },
  { status: "done", label: "Feito" },
];

export const TASK_STATUS_LABELS = Object.fromEntries(
  TASK_COLUMNS.map((c) => [c.status, c.label]),
) as Record<TaskStatus, string>;

export function isDone(task: Task): boolean {
  return task.status === "done";
}

/** Cor da "aba" da tarefa: urgência do vencimento; concluída fica neutra. */
export function statusColor(task: Task): string {
  if (isDone(task)) return "var(--muted-foreground)";
  const d = daysUntil(task.dueDate);
  if (d === null) return "var(--chart-1)";
  if (d < 0) return "var(--destructive)";
  if (d <= 2) return "var(--chart-4)";
  return "var(--chart-1)";
}

export function dueLabel(task: Task): { text: string; overdue: boolean } | null {
  if (!task.dueDate) return null;
  const d = daysUntil(task.dueDate);
  if (d === null) return null;
  const at = task.hasTime ? ` · ${formatTime(task.dueDate)}` : "";
  // Tarefa feita não está "atrasada": mostra só a data.
  if (d < 0 && !isDone(task))
    return { text: `Atrasada · ${formatDate(task.dueDate)}${at}`, overdue: true };
  if (d === 0) return { text: `Vence hoje${at}`, overdue: false };
  if (d === 1) return { text: `Vence amanhã${at}`, overdue: false };
  return { text: `${formatDate(task.dueDate)}${at}`, overdue: false };
}
