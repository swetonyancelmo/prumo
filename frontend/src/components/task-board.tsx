"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { PlusIcon } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TASK_COLUMNS } from "@/lib/task-utils";
import {
  TaskCard,
  TaskCardView,
  type TaskCardActions,
} from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Quadro Kanban de colunas fixas. A ordem dentro da coluna vem da API (por
 * vencimento) — arrastar só troca a coluna, não há posição manual.
 */
export function TaskBoard({
  tasks,
  loading,
  onCreate,
  ...actions
}: {
  tasks: Task[];
  loading: boolean;
  onCreate: (status: TaskStatus) => void;
} & TaskCardActions) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // Distância mínima: um clique no cartão continua sendo clique (editar).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // No toque, só arrasta depois de segurar — senão rolar a coluna viraria
    // arraste.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(
      TASK_COLUMNS.map((c) => [c.status, [] as Task[]]),
    ) as Record<TaskStatus, Task[]>;
    for (const t of tasks) groups[t.status]?.push(t);
    return groups;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const task = tasks.find((t) => t.id === e.active.id);
    const target = e.over?.id as TaskStatus | undefined;
    if (task && target && target !== task.status) actions.onMove(task, target);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Mobile: colunas lado a lado com rolagem horizontal, sangrando até a
          borda da tela (o -mx espelha o gutter do <main>); desktop: grade. */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:scroll-px-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {TASK_COLUMNS.map((col) => (
          <BoardColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={byStatus[col.status]}
            loading={loading}
            onCreate={onCreate}
            {...actions}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCardView task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({
  status,
  label,
  tasks,
  loading,
  onCreate,
  ...actions
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  loading: boolean;
  onCreate: (status: TaskStatus) => void;
} & TaskCardActions) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        "flex w-[85vw] max-w-sm shrink-0 snap-center flex-col gap-2 rounded-2xl bg-muted/50 p-2 transition-colors lg:w-auto lg:max-w-none",
        isOver && "bg-accent ring-2 ring-ring/40",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pt-1">
        <h2 className="font-heading text-sm font-semibold">{label}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {loading ? "" : tasks.length}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto pointer-coarse:size-9"
          onClick={() => onCreate(status)}
          aria-label={`Nova tarefa em ${label}`}
        >
          <PlusIcon />
        </Button>
      </header>

      <div className="flex min-h-24 flex-col gap-2">
        {loading ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            Nada aqui.
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} {...actions} />
          ))
        )}
      </div>
    </section>
  );
}
