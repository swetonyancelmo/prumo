import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildReport,
  resolvePeriod,
  type ReportPeriod,
  type ExpenseRow,
  type IncomeRow,
} from './reports.util';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(userId: string, period: ReportPeriod, anchor: Date) {
    const rp = resolvePeriod(period, anchor);

    // Uma busca cobrindo período anterior + atual (para totais e variação).
    // Escopo por userId é obrigatório — RLS não se aplica ao caminho do Prisma.
    const [expenses, incomes] = await Promise.all([
      this.prisma.expense.findMany({
        where: { userId, occurredAt: { gte: rp.previousStart, lt: rp.end } },
        select: {
          amount: true,
          occurredAt: true,
          category: { select: { name: true } },
        },
      }),
      this.prisma.income.findMany({
        where: { userId, receivedAt: { gte: rp.previousStart, lt: rp.end } },
        select: { amount: true, receivedAt: true },
      }),
    ]);

    const expenseRows: ExpenseRow[] = expenses.map((e) => ({
      amount: e.amount.toString(),
      occurredAt: e.occurredAt,
      category: e.category,
    }));
    const incomeRows: IncomeRow[] = incomes.map((i) => ({
      amount: i.amount.toString(),
      receivedAt: i.receivedAt,
    }));

    return buildReport(period, anchor, expenseRows, incomeRows);
  }
}
