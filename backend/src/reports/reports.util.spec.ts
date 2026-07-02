import {
  resolvePeriod,
  buildReport,
  type ExpenseRow,
  type IncomeRow,
} from './reports.util';

const exp = (amount: number, occurredAt: string, category?: string): ExpenseRow => ({
  amount,
  occurredAt: new Date(occurredAt),
  category: category ? { name: category } : null,
});
const inc = (amount: number, receivedAt: string): IncomeRow => ({
  amount,
  receivedAt: new Date(receivedAt),
});

// Datas ancoradas ao meio-dia local para evitar deriva de fuso nos testes.
const at = (isoDay: string) => `${isoDay}T12:00:00`;

describe('resolvePeriod', () => {
  it('mês: intervalo do 1º ao 1º do mês seguinte + mês anterior', () => {
    const rp = resolvePeriod('month', new Date('2026-07-15T12:00:00'));
    expect(rp.start.getMonth()).toBe(6); // julho
    expect(rp.start.getDate()).toBe(1);
    expect(rp.end.getMonth()).toBe(7); // agosto
    expect(rp.previousStart.getMonth()).toBe(5); // junho
    expect(rp.label).toBe('Julho 2026');
  });

  it('ano: 12 buckets mensais', () => {
    const rp = resolvePeriod('year', new Date('2026-03-10T12:00:00'));
    expect(rp.buckets).toHaveLength(12);
    expect(rp.buckets[0].label).toBe('jan');
    expect(rp.buckets[11].label).toBe('dez');
    expect(rp.label).toBe('2026');
  });

  it('trimestre: agrupa o bloco de 3 meses da âncora', () => {
    const rp = resolvePeriod('quarter', new Date('2026-08-20T12:00:00'));
    // agosto → 3º trimestre (jul-ago-set)
    expect(rp.start.getMonth()).toBe(6);
    expect(rp.end.getMonth()).toBe(9);
    expect(rp.buckets).toHaveLength(3);
    expect(rp.label).toBe('3º trimestre 2026');
  });

  it('semestre: 6 buckets; 2º semestre para meses >= julho', () => {
    const rp = resolvePeriod('semester', new Date('2026-09-01T12:00:00'));
    expect(rp.start.getMonth()).toBe(6); // julho
    expect(rp.buckets).toHaveLength(6);
    expect(rp.label).toBe('2º semestre 2026');
  });

  it('semana: 7 buckets diários começando na segunda', () => {
    // 2026-07-15 é uma quarta-feira → semana começa 13 (segunda)
    const rp = resolvePeriod('week', new Date('2026-07-15T12:00:00'));
    expect(rp.buckets).toHaveLength(7);
    expect(rp.start.getDate()).toBe(13);
    expect(rp.buckets[0].label).toBe('Seg');
    expect(rp.buckets[6].label).toBe('Dom');
  });
});

describe('buildReport', () => {
  const expenses: ExpenseRow[] = [
    exp(100, at('2026-07-05'), 'Alimentação'),
    exp(50, at('2026-07-06'), 'Transporte'),
    exp(30, at('2026-07-20'), 'Alimentação'),
    exp(200, at('2026-06-10'), 'Alimentação'), // mês anterior
    exp(999, at('2026-08-01'), 'Lazer'), // fora do mês
  ];
  const incomes: IncomeRow[] = [
    inc(2000, at('2026-07-01')),
    inc(500, at('2026-06-15')), // mês anterior
  ];

  it('totais do mês somam só os lançamentos do período', () => {
    const r = buildReport('month', new Date(at('2026-07-15')), expenses, incomes);
    expect(r.totals.expenses).toBe(180); // 100+50+30
    expect(r.totals.incomes).toBe(2000);
    expect(r.totals.balance).toBe(1820);
  });

  it('inclui totais do período anterior para variação', () => {
    const r = buildReport('month', new Date(at('2026-07-15')), expenses, incomes);
    expect(r.previous.expenses).toBe(200);
    expect(r.previous.incomes).toBe(500);
  });

  it('agrega por categoria ordenado desc, com share e previousTotal', () => {
    const r = buildReport('month', new Date(at('2026-07-15')), expenses, incomes);
    expect(r.byCategory[0]).toMatchObject({
      name: 'Alimentação',
      total: 130,
      previousTotal: 200,
    });
    expect(r.byCategory[1]).toMatchObject({ name: 'Transporte', total: 50 });
    // share de Alimentação = 130/180
    expect(r.byCategory[0].share).toBeCloseTo(130 / 180, 5);
  });

  it('série tem um ponto por bucket e soma corretamente', () => {
    const r = buildReport('month', new Date(at('2026-07-15')), expenses, incomes);
    const totalSerie = r.series.reduce((s, p) => s + p.expenses, 0);
    expect(totalSerie).toBe(180);
    // receita de 2000 cai na primeira semana (dia 1)
    expect(r.series[0].incomes).toBe(2000);
  });

  it('não sofre erro de ponto flutuante (0.1 + 0.2)', () => {
    const r = buildReport(
      'month',
      new Date(at('2026-07-15')),
      [exp(0.1, at('2026-07-02'), 'A'), exp(0.2, at('2026-07-03'), 'A')],
      [],
    );
    expect(r.totals.expenses).toBe(0.3);
  });

  it('despesa sem categoria cai em "Sem categoria"', () => {
    const r = buildReport(
      'month',
      new Date(at('2026-07-15')),
      [exp(40, at('2026-07-02'))],
      [],
    );
    expect(r.byCategory[0].name).toBe('Sem categoria');
  });
});
