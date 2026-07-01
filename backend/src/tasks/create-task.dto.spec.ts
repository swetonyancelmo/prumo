import { createTaskSchema } from './dto/create-task.dto';

describe('createTaskSchema (regras de recorrência)', () => {
  it('aceita tarefa simples sem recorrência', () => {
    const parsed = createTaskSchema.safeParse({
      description: 'Pagar conta de luz',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita isRecurring=true sem recurrenceRule', () => {
    const parsed = createTaskSchema.safeParse({
      description: 'Assinatura mensal',
      isRecurring: true,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toContain('recurrenceRule');
    }
  });

  it('aceita isRecurring=true com recurrenceRule', () => {
    const parsed = createTaskSchema.safeParse({
      description: 'Assinatura mensal',
      isRecurring: true,
      recurrenceRule: 'FREQ=MONTHLY',
    });
    expect(parsed.success).toBe(true);
  });

  it('faz coerce de dueDate string ISO para Date', () => {
    const parsed = createTaskSchema.safeParse({
      description: 'X',
      dueDate: '2026-07-02T00:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dueDate).toBeInstanceOf(Date);
    }
  });
});
