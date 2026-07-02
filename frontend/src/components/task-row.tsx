"use client";

import { CalendarIcon, RepeatIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { daysUntil, formatDate, formatTime } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function statusColor(task: Task): string {
  if (task.isCompleted) return "var(--muted-foreground)";
  const d = daysUntil(task.dueDate);
  if (d === null) return "var(--chart-1)";
  if (d < 0) return "var(--destructive)";
  if (d <= 2) return "var(--chart-4)";
  return "var(--chart-1)";
}

function dueLabel(task: Task): { text: string; overdue: boolean } | null {
  if (!task.dueDate) return null;
  const d = daysUntil(task.dueDate);
  if (d === null) return null;
  const at = task.hasTime ? ` · ${formatTime(task.dueDate)}` : "";
  if (d < 0)
    return { text: `Atrasada · ${formatDate(task.dueDate)}${at}`, overdue: true };
  if (d === 0) return { text: `Vence hoje${at}`, overdue: false };
  if (d === 1) return { text: `Vence amanhã${at}`, overdue: false };
  return { text: `${formatDate(task.dueDate)}${at}`, overdue: false };
}

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  busy,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  busy?: boolean;
}) {
  const due = dueLabel(task);
  return (
    <div className="flex items-stretch gap-3 rounded-xl px-1 py-2">
      <span
        aria-hidden
        className="w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: statusColor(task) }}
      />
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={() => onToggle(task)}
        disabled={busy}
        className="mt-0.5"
        aria-label={
          task.isCompleted ? "Marcar como pendente" : "Concluir tarefa"
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            task.isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {due && (
            <Badge variant={due.overdue ? "destructive" : "secondary"}>
              <CalendarIcon data-icon="inline-start" />
              {due.text}
            </Badge>
          )}
          {task.isRecurring && (
            <Badge variant="outline">
              <RepeatIcon data-icon="inline-start" />
              Recorrente
            </Badge>
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-0.5">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              aria-label="Editar tarefa"
            >
              <PencilIcon />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task)}
              aria-label="Excluir tarefa"
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
