"use client";

import { useMemo, useState } from "react";
import { PlusIcon, ListChecksIcon } from "lucide-react";
import type { Task } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { TaskRow } from "@/components/task-row";
import { TaskDialog } from "@/components/task-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { toast } from "sonner";

export default function TarefasPage() {
  const tasks = useResource<Task[]>("/tasks");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { pending, done } = useMemo(() => {
    const all = tasks.data ?? [];
    return {
      pending: all.filter((t) => !t.isCompleted),
      done: all.filter((t) => t.isCompleted),
    };
  }, [tasks.data]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  async function toggleTask(task: Task) {
    setTogglingId(task.id);
    try {
      await api.patch(`/tasks/${task.id}`, { isCompleted: !task.isCompleted });
      await tasks.refetch();
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
    } finally {
      setTogglingId(null);
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
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Nova tarefa
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.loading ? (
              <div className="flex flex-col gap-3 py-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListChecksIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nada pendente</EmptyTitle>
                  <EmptyDescription>
                    Adicione uma tarefa para começar a se organizar.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col divide-y">
                {pending.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                    busy={togglingId === task.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {done.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                {done.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                    busy={togglingId === task.id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
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
