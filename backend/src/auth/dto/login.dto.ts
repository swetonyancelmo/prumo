import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Sem regras de tamanho aqui: no login, senha curta é credencial errada
// (401), não erro de validação (400) — e a mensagem não deve deixar
// deduzir nada sobre a senha cadastrada.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export class LoginDto extends createZodDto(loginSchema) {}
