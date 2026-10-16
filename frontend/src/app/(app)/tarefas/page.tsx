"use client";

import { Suspense, useState } from "react";
import { PlusIcon } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { useShortcutFlag } from "@/lib/use-shortcut";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/components/task-board";
import { TaskDialog } from "@/components/task-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TarefasPage() {
  // O atalho do PWA (/tarefas?nova=1) chega pela query, e ler query obriga a
  // um limite de Suspense.
  return (
    <Suspense fallback={null}>
      <Tarefas />
    </Suspense>
  );
}

function Tarefas() {
  const tasks = useResource<Task[]>("/tasks");
  // Atalho "Nova tarefa" do ícone do app: já abre o diálogo.
  const fromShortcut = useShortcutFlag("nova");
  const [dialogOpen, setDialogOpen] = useState(fromShortcut);
  const [editing, setEditing] = useState<Task | null>(null);
  const [createIn, setCreateIn] = useState<TaskStatus>("todo");
  const [deleting, setDeleting] = useState<Task | null>(null);

  function openCreate(status: TaskStatus = "todo") {
    setEditing(null);
    setCreateIn(status);
    setDialogOpen(true);
  }
  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  // Otimista: o cartão muda de coluna na hora e volta se a API recusar.
  async function moveTask(task: Task, status: TaskStatus) {
    const setStatus = (s: TaskStatus) =>
      tasks.setData((prev) =>
        prev ? prev.map((t) => (t.id === task.id ? { ...t, status: s } : t)) : prev,
      );
    setStatus(status);
    try {
      await api.patch(`/tasks/${task.id}`, { status });
    } catch {
      setStatus(task.status);
      toast.error("Não foi possível mover a tarefa.");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await api.delete(`/tasks/${deleting.id}`);
      toast.success("Tarefa excluída.");
      await tasks.refetch();
    } catch {
      toast.error("Não foi possível excluir.");
    }
  }

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle="O que precisa da sua atenção"
        action={
          <Button onClick={() => openCreate()}>
            <PlusIcon data-icon="inline-start" />
            Nova tarefa
          </Button>
        }
      />

      <TaskBoard
        tasks={tasks.data ?? []}
        // Só o carregamento inicial mostra esqueleto; um refetch não pisca o quadro.
        loading={tasks.loading && !tasks.data}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={setDeleting}
        onMove={moveTask}
      />

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultStatus={createIn}
        onSaved={tasks.refetch}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir tarefa?"
        description="Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}
