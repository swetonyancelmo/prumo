// Lógica pura dos relatórios financeiros: resolução de período, bucketização e
// agregação. Sem I/O — testável isoladamente (TDD, como manda o CLAUDE.md).
//
// NOTA sobre fuso: os cálculos de calendário usam o horário LOCAL do processo.
// Em produção o servidor deve rodar em America/Sao_Paulo (ou a app deve fixar
// TZ) para as fronteiras de dia/mês baterem com o que o usuário vê. Os
// lançamentos vindos do web são ancorados ao meio-dia local, o que protege a
// maioria dos casos de borda.

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'semester' | 'year';

export const REPORT_PERIODS: ReportPeriod[] = [
  'week',
  'month',
  'quarter',
  'semester',
  'year',
];

export interface ExpenseRow {
  amount: number | string;
  occurredAt: Date;
  category?: { name: string } | null;
}

export interface IncomeRow {
  amount: number | string;
  receivedAt: Date;
}

export interface PeriodBucket {
  label: string;
  start: Date;
  end: Date; // exclusivo
}

export interface ResolvedPeriod {
  start: Date;
  end: Date; // exclusivo
  previousStart: Date;
  previousEnd: Date;
  label: string;
  buckets: PeriodBucket[];
}

export interface CategoryReport {
  name: string;
  total: number;
  previousTotal: number;
  share: number; // 0..1 do total de despesas do período
}

export interface SeriesPoint {
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
  series: SeriesPoint[];
}

const MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];
const MONTHS_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ---- helpers de data (horário local) ----
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monthStart = (y: number, m: number) => new Date(y, m, 1);
const startOfWeekMonday = (d: Date) => {
  const dow = (d.getDay() + 6) % 7; // 0 = segunda
  return addDays(startOfDay(d), -dow);
};

// ---- helpers de dinheiro (centavos) ----
const toCents = (v: number | string) => Math.round(Number(v) * 100);
const toReais = (c: number) => c / 100;

function monthlyBuckets(
  startYear: number,
  startMonth: number,
  count: number,
): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  for (let i = 0; i < count; i++) {
    const start = monthStart(startYear, startMonth + i);
    const end = monthStart(startYear, startMonth + i + 1);
    buckets.push({ label: MONTHS_SHORT[start.getMonth()], start, end });
  }
  return buckets;
}

export function resolvePeriod(
  period: ReportPeriod,
  anchor: Date,
): ResolvedPeriod {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();

  switch (period) {
    case 'week': {
      const start = startOfWeekMonday(anchor);
      const end = addDays(start, 7);
      const buckets: PeriodBucket[] = [];
      for (let i = 0; i < 7; i++) {
        const bStart = addDays(start, i);
        buckets.push({ label: WEEKDAYS[i], start: bStart, end: addDays(bStart, 1) });
      }
      return {
        start,
        end,
        previousStart: addDays(start, -7),
        previousEnd: start,
        label: `Semana de ${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`,
        buckets,
      };
    }
    case 'month': {
      const start = monthStart(y, m);
      const end = monthStart(y, m + 1);
      const buckets: PeriodBucket[] = [];
      let i = 0;
      while (true) {
        const bStart = new Date(y, m, 1 + 7 * i);
        if (bStart >= end) break;
        const bEndRaw = new Date(y, m, 1 + 7 * (i + 1));
        const bEnd = bEndRaw < end ? bEndRaw : end;
        buckets.push({ label: `Sem ${i + 1}`, start: bStart, end: bEnd });
        i++;
      }
      return {
        start,
        end,
        previousStart: monthStart(y, m - 1),
        previousEnd: start,
        label: `${MONTHS_LONG[m]} ${y}`,
        buckets,
      };
    }
    case 'quarter': {
      const q = Math.floor(m / 3);
      const startMonth = q * 3;
      const start = monthStart(y, startMonth);
      const end = monthStart(y, startMonth + 3);
      return {
        start,
        end,
        previousStart: monthStart(y, startMonth - 3),
        previousEnd: start,
        label: `${q + 1}º trimestre ${y}`,
        buckets: monthlyBuckets(y, startMonth, 3),
      };
    }
    case 'semester': {
      const h = m < 6 ? 0 : 6;
      const start = monthStart(y, h);
      const end = monthStart(y, h + 6);
      return {
        start,
        end,
        previousStart: monthStart(y, h - 6),
        previousEnd: start,
        label: `${h === 0 ? '1º' : '2º'} semestre ${y}`,
        buckets: monthlyBuckets(y, h, 6),
      };
    }
    case 'year': {
      const start = monthStart(y, 0);
      const end = monthStart(y + 1, 0);
      return {
        start,
        end,
        previousStart: monthStart(y - 1, 0),
        previousEnd: start,
        label: `${y}`,
        buckets: monthlyBuckets(y, 0, 12),
      };
    }
  }
}

const inRange = (d: Date, start: Date, end: Date) =>
  d.getTime() >= start.getTime() && d.getTime() < end.getTime();

export function buildReport(
  period: ReportPeriod,
  anchor: Date,
  expenses: ExpenseRow[],
  incomes: IncomeRow[],
): Report {
  const rp = resolvePeriod(period, anchor);

  const curExp = expenses.filter((e) => inRange(e.occurredAt, rp.start, rp.end));
  const curInc = incomes.filter((i) => inRange(i.receivedAt, rp.start, rp.end));
  const prevExp = expenses.filter((e) =>
    inRange(e.occurredAt, rp.previousStart, rp.previousEnd),
  );
  const prevInc = incomes.filter((i) =>
    inRange(i.receivedAt, rp.previousStart, rp.previousEnd),
  );

  const sum = (rows: { amount: number | string }[]) =>
    rows.reduce((acc, r) => acc + toCents(r.amount), 0);

  const curExpCents = sum(curExp);
  const curIncCents = sum(curInc);
  const prevExpCents = sum(prevExp);
  const prevIncCents = sum(prevInc);

  // Agrupamento por categoria (atual + anterior para a variação).
  const groupByCategory = (rows: ExpenseRow[]) => {
    const map = new Map<string, number>();
    for (const e of rows) {
      const name = e.category?.name ?? 'Sem categoria';
      map.set(name, (map.get(name) ?? 0) + toCents(e.amount));
    }
    return map;
  };
  const curMap = groupByCategory(curExp);
  const prevMap = groupByCategory(prevExp);

  const byCategory: CategoryReport[] = [...curMap.entries()]
    .map(([name, cents]) => ({
      name,
      total: toReais(cents),
      previousTotal: toReais(prevMap.get(name) ?? 0),
      share: curExpCents > 0 ? cents / curExpCents : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const series: SeriesPoint[] = rp.buckets.map((b) => ({
    label: b.label,
    incomes: toReais(
      sum(curInc.filter((i) => inRange(i.receivedAt, b.start, b.end))),
    ),
    expenses: toReais(
      sum(curExp.filter((e) => inRange(e.occurredAt, b.start, b.end))),
    ),
  }));

  return {
    period,
    range: {
      start: rp.start.toISOString(),
      end: rp.end.toISOString(),
      label: rp.label,
    },
    totals: {
      incomes: toReais(curIncCents),
      expenses: toReais(curExpCents),
      balance: toReais(curIncCents - curExpCents),
    },
    previous: {
      incomes: toReais(prevIncCents),
      expenses: toReais(prevExpCents),
      balance: toReais(prevIncCents - prevExpCents),
    },
    byCategory,
    series,
  };
}
