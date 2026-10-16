import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { taskStatusSchema } from './create-task.dto';

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(280).optional(),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  hasTime: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().max(200).nullable().optional(),
  status: taskStatusSchema.optional(),
});

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
