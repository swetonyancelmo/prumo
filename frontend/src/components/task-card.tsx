"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarIcon,
  RepeatIcon,
  PencilIcon,
  Trash2Icon,
  EllipsisVerticalIcon,
  ArrowRightIcon,
} from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  TASK_COLUMNS,
  dueLabel,
  isDone,
  statusColor,
} from "@/lib/task-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TaskCardActions {
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
}

/** Cartão do Kanban, arrastável entre colunas. */
export function TaskCard({ task, ...actions }: { task: Task } & TaskCardActions) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      // O cartão original fica como "fantasma" enquanto o DragOverlay se move.
      className={cn("touch-manipulation", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} {...actions} />
    </div>
  );
}

/** Visual do cartão, sem arraste — também usado no DragOverlay. */
export function TaskCardView({
  task,
  onEdit,
  onDelete,
  onMove,
  overlay,
}: { task: Task; overlay?: boolean } & Partial<TaskCardActions>) {
  const due = dueLabel(task);
  const done = isDone(task);

  return (
    <div
      className={cn(
        "flex items-stretch gap-2.5 rounded-xl border bg-card p-2.5 text-card-foreground shadow-xs",
        overlay && "rotate-1 cursor-grabbing shadow-lg",
      )}
    >
      <span
        aria-hidden
        className="w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: statusColor(task) }}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit?.(task)}
          className={cn(
            "block w-full text-left text-sm font-medium break-words outline-none focus-visible:underline",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </button>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs whitespace-pre-line text-muted-foreground">
            {task.description}
          </p>
        )}
        {(due || task.isRecurring) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
        )}
      </div>

      {!overlay && onEdit && onDelete && onMove && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mt-1 -mr-1 shrink-0 pointer-coarse:size-9"
                aria-label="Ações da tarefa"
              />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {/* Caminho principal para mover no celular, onde arrastar entre
                colunas fora da tela é desajeitado. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mover para</DropdownMenuLabel>
              {TASK_COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                <DropdownMenuItem
                  key={c.status}
                  onClick={() => onMove(task, c.status)}
                >
                  <ArrowRightIcon />
                  {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(task)}
            >
              <Trash2Icon />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
