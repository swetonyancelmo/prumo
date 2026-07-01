import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  // E.164 simplificado (ex: +5511999998888)
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'phoneNumber deve estar em formato E.164'),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
