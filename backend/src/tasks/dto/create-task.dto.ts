import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTaskSchema = z
  .object({
    description: z.string().min(1).max(280),
    dueDate: z.coerce.date().optional(),
    // true quando dueDate carrega um horário significativo (compromisso/agenda).
    hasTime: z.boolean().optional().default(false),
    isRecurring: z.boolean().optional().default(false),
    // Ex: RRULE simplificada ("FREQ=MONTHLY"). Obrigatória quando isRecurring=true.
    recurrenceRule: z.string().max(200).optional(),
  })
  .refine((d) => !d.isRecurring || !!d.recurrenceRule, {
    message: 'recurrenceRule é obrigatória quando isRecurring for true',
    path: ['recurrenceRule'],
  })
  .refine((d) => !d.hasTime || !!d.dueDate, {
    message: 'dueDate é obrigatória quando hasTime for true',
    path: ['dueDate'],
  });

export class CreateTaskDto extends createZodDto(createTaskSchema) {}
