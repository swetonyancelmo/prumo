import { FinanceService } from './finance.service';

describe('FinanceService.summarize', () => {
  let service: FinanceService;

  beforeEach(() => {
    service = new FinanceService();
  });

  it('retorna zeros quando não há lançamentos', () => {
    const result = service.summarize([], []);
    expect(result.totalExpenses).toBe(0);
    expect(result.totalIncomes).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.byCategory).toEqual([]);
  });

  it('calcula saldo = receitas - despesas', () => {
    const result = service.summarize(
      [
        { amount: 45.5, categoryId: 'c1', category: { name: 'Alimentação' } },
        { amount: 100, categoryId: 'c2', category: { name: 'Transporte' } },
      ],
      [{ amount: 2000 }],
    );

    expect(result.totalExpenses).toBe(145.5);
    expect(result.totalIncomes).toBe(2000);
    expect(result.balance).toBe(1854.5);
  });

  it('não sofre com erro de ponto flutuante (0.1 + 0.2)', () => {
    const result = service.summarize(
      [
        { amount: 0.1, categoryId: 'c1', category: { name: 'A' } },
        { amount: 0.2, categoryId: 'c1', category: { name: 'A' } },
      ],
      [],
    );
    expect(result.totalExpenses).toBe(0.3);
  });

  it('agrupa por categoria e ordena do maior para o menor', () => {
    const result = service.summarize(
      [
        { amount: 10, categoryId: 'c1', category: { name: 'Alimentação' } },
        { amount: 40, categoryId: 'c2', category: { name: 'Transporte' } },
        { amount: 15, categoryId: 'c1', category: { name: 'Alimentação' } },
      ],
      [],
    );

    expect(result.byCategory).toEqual([
      { categoryId: 'c2', categoryName: 'Transporte', total: 40 },
      { categoryId: 'c1', categoryName: 'Alimentação', total: 25 },
    ]);
  });

  it('agrupa despesas sem categoria sob "Sem categoria"', () => {
    const result = service.summarize(
      [{ amount: 30, categoryId: null, category: null }],
      [],
    );
    expect(result.byCategory).toEqual([
      { categoryId: null, categoryName: 'Sem categoria', total: 30 },
    ]);
  });
});
