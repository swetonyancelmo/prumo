import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateTaskSchema = z.object({
  description: z.string().min(1).max(280).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().max(200).nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
