"use client";

import { useMemo, useState } from "react";
import { PlusIcon, WalletIcon } from "lucide-react";
import type { Category, Expense, Income } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { formatBRL, isSameMonth } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ExpenseRow, IncomeRow } from "@/components/entry-row";
import { EntryDialog } from "@/components/entry-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

type Editing =
  | { kind: "expense"; entry: Expense }
  | { kind: "income"; entry: Income }
  | null;

type Deleting =
  | { kind: "expense"; entry: Expense }
  | { kind: "income"; entry: Income }
  | null;

export default function FinancasPage() {
  const expenses = useResource<Expense[]>("/expenses");
  const incomes = useResource<Income[]>("/incomes");
  const categories = useResource<Category[]>("/categories");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);

  const monthExpenses = useMemo(
    () => (expenses.data ?? []).filter((e) => isSameMonth(e.occurredAt)),
    [expenses.data],
  );
  const monthIncomes = useMemo(
    () => (incomes.data ?? []).filter((i) => isSameMonth(i.receivedAt)),
    [incomes.data],
  );

  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncomes = monthIncomes.reduce((s, i) => s + Number(i.amount), 0);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEditExpense(entry: Expense) {
    setEditing({ kind: "expense", entry });
    setDialogOpen(true);
  }
  function openEditIncome(entry: Income) {
    setEditing({ kind: "income", entry });
    setDialogOpen(true);
  }

  async function refetchMoney() {
    await Promise.all([expenses.refetch(), incomes.refetch()]);
  }

  async function handleDelete() {
    if (!deleting) return;
    const path =
      deleting.kind === "expense"
        ? `/expenses/${deleting.entry.id}`
        : `/incomes/${deleting.entry.id}`;
    try {
      await api.delete(path);
      toast.success("Lançamento excluído.");
      await refetchMoney();
    } catch {
      toast.error("Não foi possível excluir.");
    }
  }

  return (
    <>
      <PageHeader
        title="Finanças"
        subtitle="Suas despesas e receitas deste mês"
        action={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Novo lançamento
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas</CardTitle>
            <CardDescription className="tabular-nums">
              {formatBRL(totalExpenses)} no mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.loading ? (
              <ListSkeleton />
            ) : monthExpenses.length === 0 ? (
              <EmptyState
                title="Nenhuma despesa"
                description="Adicione seu primeiro gasto do mês."
              />
            ) : (
              <div className="flex flex-col divide-y">
                {monthExpenses.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    onEdit={openEditExpense}
                    onDelete={(x) => setDeleting({ kind: "expense", entry: x })}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
            <CardDescription className="tabular-nums">
              {formatBRL(totalIncomes)} no mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomes.loading ? (
              <ListSkeleton />
            ) : monthIncomes.length === 0 ? (
              <EmptyState
                title="Nenhuma receita"
                description="Registre entradas como salário ou freelas."
              />
            ) : (
              <div className="flex flex-col divide-y">
                {monthIncomes.map((i) => (
                  <IncomeRow
                    key={i.id}
                    income={i}
                    onEdit={openEditIncome}
                    onDelete={(x) => setDeleting({ kind: "income", entry: x })}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        categories={categories.data ?? []}
        onSaved={refetchMoney}
        onCategoryCreated={categories.refetch}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir lançamento?"
        description="Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
