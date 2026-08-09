import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * O e-mail é normalizado (trim + minúsculas) já na validação para que
 * "Joao@Email.com" e "joao@email.com" não virem duas contas — o índice único
 * de `users.email` é sensível a maiúsculas.
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(72, 'A senha pode ter no máximo 72 caracteres.'),
  name: z.string().trim().min(1).max(120).optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
