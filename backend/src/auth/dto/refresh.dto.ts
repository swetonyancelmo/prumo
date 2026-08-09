import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Informe o refresh token.'),
});

export class RefreshDto extends createZodDto(refreshSchema) {}
