import { createTaskSchema } from './dto/create-task.dto';
import { updateTaskSchema } from './dto/update-task.dto';

describe('createTaskSchema (regras de recorrência)', () => {
  it('aceita tarefa simples sem recorrência', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'Pagar conta de luz',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita isRecurring=true sem recurrenceRule', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'Assinatura mensal',
      isRecurring: true,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toContain('recurrenceRule');
    }
  });

  it('aceita isRecurring=true com recurrenceRule', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'Assinatura mensal',
      isRecurring: true,
      recurrenceRule: 'FREQ=MONTHLY',
    });
    expect(parsed.success).toBe(true);
  });

  it('faz coerce de dueDate string ISO para Date', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'X',
      dueDate: '2026-07-02T00:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dueDate).toBeInstanceOf(Date);
    }
  });
});

describe('createTaskSchema (Kanban: título, descrição e status)', () => {
  it('cria em "todo" quando o status não é informado', () => {
    const parsed = createTaskSchema.safeParse({ title: 'Ler contrato' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('todo');
      expect(parsed.data.description).toBeUndefined();
    }
  });

  it('aceita status de qualquer coluna', () => {
    for (const status of ['backlog', 'todo', 'doing', 'done']) {
      const parsed = createTaskSchema.safeParse({ title: 'X', status });
      expect(parsed.success).toBe(true);
    }
  });

  it('rejeita status fora das colunas', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'X',
      status: 'arquivada',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita título vazio', () => {
    const parsed = createTaskSchema.safeParse({ title: '' });
    expect(parsed.success).toBe(false);
  });

  it('rejeita descrição acima de 5000 caracteres', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'X',
      description: 'a'.repeat(5001),
    });
    expect(parsed.success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('permite limpar a descrição com null', () => {
    const parsed = updateTaskSchema.safeParse({ description: null });
    expect(parsed.success).toBe(true);
  });

  it('move de coluna só com o status', () => {
    const parsed = updateTaskSchema.safeParse({ status: 'doing' });
    expect(parsed.success).toBe(true);
  });

  it('não aceita mais isCompleted', () => {
    const parsed = updateTaskSchema.safeParse({ isCompleted: true });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty('isCompleted');
    }
  });
});
