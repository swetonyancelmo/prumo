import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  total: number;
}

export interface FinanceSummary {
  totalExpenses: number;
  totalIncomes: number;
  balance: number;
  byCategory: CategoryBreakdown[];
}

type ExpenseForSummary = {
  amount: Prisma.Decimal | number;
  categoryId: string | null;
  category?: { name: string } | null;
};

type IncomeForSummary = {
  amount: Prisma.Decimal | number;
};

/**
 * Lógica pura de agregação financeira, isolada de I/O para ser testável (TDD).
 * Trabalha em centavos internamente para evitar erros de ponto flutuante.
 */
@Injectable()
export class FinanceService {
  private toCents(value: Prisma.Decimal | number): number {
    const asNumber =
      typeof value === 'number' ? value : Number(value.toString());
    return Math.round(asNumber * 100);
  }

  private fromCents(cents: number): number {
    return cents / 100;
  }

  summarize(
    expenses: ExpenseForSummary[],
    incomes: IncomeForSummary[],
  ): FinanceSummary {
    const totalExpensesCents = expenses.reduce(
      (acc, e) => acc + this.toCents(e.amount),
      0,
    );
    const totalIncomesCents = incomes.reduce(
      (acc, i) => acc + this.toCents(i.amount),
      0,
    );

    const byCategoryMap = new Map<string, CategoryBreakdown & { cents: number }>();
    for (const e of expenses) {
      const key = e.categoryId ?? '__uncategorized__';
      const name = e.category?.name ?? 'Sem categoria';
      const entry =
        byCategoryMap.get(key) ??
        {
          categoryId: e.categoryId,
          categoryName: name,
          total: 0,
          cents: 0,
        };
      entry.cents += this.toCents(e.amount);
      byCategoryMap.set(key, entry);
    }

    const byCategory: CategoryBreakdown[] = Array.from(byCategoryMap.values())
      .map(({ cents, ...rest }) => ({ ...rest, total: this.fromCents(cents) }))
      .sort((a, b) => b.total - a.total);

    return {
      totalExpenses: this.fromCents(totalExpensesCents),
      totalIncomes: this.fromCents(totalIncomesCents),
      balance: this.fromCents(totalIncomesCents - totalExpensesCents),
      byCategory,
    };
  }
}
