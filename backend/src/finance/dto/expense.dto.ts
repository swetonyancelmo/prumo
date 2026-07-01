import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z.number().positive('amount deve ser maior que zero'),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(280).optional(),
  // ISO 8601; default é "agora" quando não informado.
  occurredAt: z.coerce.date().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export class CreateExpenseDto extends createZodDto(createExpenseSchema) {}
export class UpdateExpenseDto extends createZodDto(updateExpenseSchema) {}
