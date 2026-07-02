import type { Expense, Income } from "./types";
import { isSameMonth, parseAmount } from "./format";

export interface CategorySlice {
  key: string; // id ou nome — chave estável de cor
  name: string;
  total: number; // reais
  share: number; // 0..1 do total de despesas
}

export interface MonthSummary {
  totalExpenses: number;
  totalIncomes: number;
  balance: number;
  byCategory: CategorySlice[];
}

const toCents = (v: string | number) => Math.round(parseAmount(v) * 100);
const toReais = (c: number) => c / 100;

/** Agrega despesas/receitas do mês de referência. Soma em centavos (inteiros). */
export function summarizeMonth(
  expenses: Expense[],
  incomes: Income[],
  ref = new Date(),
): MonthSummary {
  const monthExpenses = expenses.filter((e) => isSameMonth(e.occurredAt, ref));
  const monthIncomes = incomes.filter((i) => isSameMonth(i.receivedAt, ref));

  const expenseCents = monthExpenses.reduce((s, e) => s + toCents(e.amount), 0);
  const incomeCents = monthIncomes.reduce((s, i) => s + toCents(i.amount), 0);

  const groups = new Map<string, { name: string; cents: number }>();
  for (const e of monthExpenses) {
    const key = e.categoryId ?? "sem-categoria";
    const name = e.category?.name ?? "Sem categoria";
    const prev = groups.get(key);
    groups.set(key, { name, cents: (prev?.cents ?? 0) + toCents(e.amount) });
  }

  const byCategory: CategorySlice[] = [...groups.entries()]
    .map(([key, { name, cents }]) => ({
      key,
      name,
      total: toReais(cents),
      share: expenseCents > 0 ? cents / expenseCents : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalExpenses: toReais(expenseCents),
    totalIncomes: toReais(incomeCents),
    balance: toReais(incomeCents - expenseCents),
    byCategory,
  };
}
