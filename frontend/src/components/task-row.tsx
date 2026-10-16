"use client";

import { CalendarIcon, RepeatIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dueLabel, isDone, statusColor } from "@/lib/task-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const done = isDone(task);
  return (
    <div className="flex items-stretch gap-3 rounded-xl px-1 py-2">
      <span
        aria-hidden
        className="w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: statusColor(task) }}
      />
      <Checkbox
        checked={done}
        onCheckedChange={() => onToggle(task)}
        disabled={busy}
        className="mt-0.5"
        aria-label={
          done ? "Marcar como pendente" : "Concluir tarefa"
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
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
