import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createIncomeSchema = z.object({
  amount: z.number().positive('amount deve ser maior que zero'),
  description: z.string().max(280).optional(),
  receivedAt: z.coerce.date().optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export class CreateIncomeDto extends createZodDto(createIncomeSchema) {}
export class UpdateIncomeDto extends createZodDto(updateIncomeSchema) {}
