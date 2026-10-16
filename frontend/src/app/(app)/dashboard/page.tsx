"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";
import type { Expense, Income, Task } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { summarizeMonth } from "@/lib/summary";
import {
  formatBRL,
  currentMonthLabel,
  categoryColor,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBalanceVisibility, HIDDEN_AMOUNT } from "@/lib/use-balance-visibility";
import { useProfile } from "@/components/profile-provider";
import { PageHeader } from "@/components/page-header";
import { InstallPrompt } from "@/components/install-prompt";
import { BalanceToggle } from "@/components/balance-toggle";
import { CategoryTab } from "@/components/category-tab";
import { TaskRow } from "@/components/task-row";
import { isDone } from "@/lib/task-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { toast } from "sonner";

export default function DashboardPage() {
  const profile = useProfile();
  const { visible } = useBalanceVisibility();
  const expenses = useResource<Expense[]>("/expenses");
  const incomes = useResource<Income[]>("/incomes");
  const tasks = useResource<Task[]>("/tasks");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const summary = useMemo(
    () => summarizeMonth(expenses.data ?? [], incomes.data ?? []),
    [expenses.data, incomes.data],
  );

  const pendingTasks = useMemo(
    () => (tasks.data ?? []).filter((t) => !isDone(t)).slice(0, 5),
    [tasks.data],
  );

  const loadingMoney = expenses.loading || incomes.loading;
  const firstName = profile.name?.split(" ")[0] ?? "por aqui";

  async function toggleTask(task: Task) {
    setTogglingId(task.id);
    try {
      // Concluir manda para "Feito"; desmarcar devolve para "A fazer".
      await api.patch(`/tasks/${task.id}`, {
        status: isDone(task) ? "todo" : "done",
      });
      await tasks.refetch();
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName} 👋`}
        subtitle={currentMonthLabel()}
        action={
          <Button nativeButton={false} render={<Link href="/financas" />}>
            <PlusIcon data-icon="inline-start" />
            Novo lançamento
          </Button>
        }
      />

      <InstallPrompt />

      {/* Cartão de saldo */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo do mês
          </CardTitle>
          <BalanceToggle className="-my-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {loadingMoney ? (
            <Skeleton className="h-11 w-48" />
          ) : (
            <p
              className={cn(
                "font-heading text-4xl font-semibold tabular-nums tracking-tight",
                summary.balance >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {visible
                ? `${summary.balance >= 0 ? "+ " : "− "}${formatBRL(Math.abs(summary.balance))}`
                : HIDDEN_AMOUNT}
            </p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              Receitas{" "}
              <span className="font-medium tabular-nums text-foreground">
                {visible ? formatBRL(summary.totalIncomes) : HIDDEN_AMOUNT}
              </span>
            </span>
            <span className="text-muted-foreground">
              Despesas{" "}
              <span className="font-medium tabular-nums text-foreground">
                {visible ? formatBRL(summary.totalExpenses) : HIDDEN_AMOUNT}
              </span>
            </span>
          </div>

          {/* Barra segmentada por categoria — lombada do planner */}
          {summary.totalExpenses > 0 && (
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
              {summary.byCategory.map((c) => (
                <div
                  key={c.key}
                  title={visible ? `${c.name} · ${formatBRL(c.total)}` : c.name}
                  style={{
                    width: `${Math.max(c.share * 100, 2)}%`,
                    backgroundColor: categoryColor(c.key),
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gastos por categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMoney ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : summary.byCategory.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma despesa neste mês ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {summary.byCategory.map((c) => (
                  <li key={c.key} className="flex items-center gap-3 py-1.5">
                    <CategoryTab colorKey={c.key} className="h-6" />
                    <span className="flex-1 truncate text-sm">{c.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {Math.round(c.share * 100)}%
                    </span>
                    <span className="w-24 text-right text-sm font-medium tabular-nums">
                      {visible ? formatBRL(c.total) : HIDDEN_AMOUNT}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <Empty className="py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SparklesIcon />
                  </EmptyMedia>
                  <EmptyTitle>Tudo em dia!</EmptyTitle>
                  <EmptyDescription>
                    Nenhuma tarefa pendente por agora.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col">
                {pendingTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    busy={togglingId === task.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              nativeButton={false}
              render={<Link href="/tarefas" />}
              variant="ghost"
              className="w-full"
            >
              Ver todas as tarefas
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
