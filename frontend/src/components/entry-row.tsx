"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import type { Expense, Income } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatBRL, formatDate } from "@/lib/format";
import { CategoryTab } from "@/components/category-tab";
import { Button } from "@/components/ui/button";

export type EntryKind = "expense" | "income";

export function ExpenseRow({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}) {
  return (
    <Row
      colorKey={expense.categoryId ?? "sem-categoria"}
      title={expense.description || expense.category?.name || "Despesa"}
      meta={`${expense.category?.name ?? "Sem categoria"} · ${formatDate(expense.occurredAt)}`}
      amount={formatBRL(expense.amount)}
      amountClass="text-destructive"
      sign="−"
      onEdit={() => onEdit(expense)}
      onDelete={() => onDelete(expense)}
    />
  );
}

export function IncomeRow({
  income,
  onEdit,
  onDelete,
}: {
  income: Income;
  onEdit: (i: Income) => void;
  onDelete: (i: Income) => void;
}) {
  return (
    <Row
      colorKey="receita"
      title={income.description || "Receita"}
      meta={formatDate(income.receivedAt)}
      amount={formatBRL(income.amount)}
      amountClass="text-success"
      sign="+"
      onEdit={() => onEdit(income)}
      onDelete={() => onDelete(income)}
    />
  );
}

function Row({
  colorKey,
  title,
  meta,
  amount,
  amountClass,
  sign,
  onEdit,
  onDelete,
}: {
  colorKey: string;
  title: string;
  meta: string;
  amount: string;
  amountClass: string;
  sign: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-stretch gap-3 rounded-xl px-1 py-2.5">
      <CategoryTab colorKey={colorKey} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            amountClass,
          )}
        >
          {sign} {amount}
        </span>
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Editar"
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Excluir"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    </div>
  );
}
