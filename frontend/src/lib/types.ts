// Espelham as respostas da API NestJS (Prisma). Valores monetários chegam como
// string (Decimal serializado) — usar parseAmount() de lib/format ao exibir.

export type CategoryType = "despesa" | "receita";
export type EntrySource = "whatsapp" | "web";

export interface UserProfile {
  id: string;
  phoneNumber: string;
  email: string | null;
  name: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  amount: string;
  categoryId: string | null;
  description: string | null;
  occurredAt: string;
  source: EntrySource;
  createdAt: string;
  category: Category | null;
}

export interface Income {
  id: string;
  amount: string;
  description: string | null;
  receivedAt: string;
  source: EntrySource;
  createdAt: string;
}

export type ReportPeriod = "week" | "month" | "quarter" | "semester" | "year";

export interface CategoryReport {
  name: string;
  total: number;
  previousTotal: number;
  share: number;
}

export interface ReportSeriesPoint {
  label: string;
  incomes: number;
  expenses: number;
}

export interface Report {
  period: ReportPeriod;
  range: { start: string; end: string; label: string };
  totals: { incomes: number; expenses: number; balance: number };
  previous: { incomes: number; expenses: number; balance: number };
  byCategory: CategoryReport[];
  series: ReportSeriesPoint[];
}

export interface Task {
  id: string;
  description: string;
  dueDate: string | null;
  hasTime: boolean;
  isRecurring: boolean;
  recurrenceRule: string | null;
  isCompleted: boolean;
  source: EntrySource;
  createdAt: string;
}
