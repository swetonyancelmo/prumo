import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  type: z.enum(['despesa', 'receita']),
  isDefault: z.boolean().optional().default(false),
});

export const updateCategorySchema = createCategorySchema.partial();

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
