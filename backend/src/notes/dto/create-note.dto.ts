import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().max(100).optional().nullable(),
  content: z.string().min(1, 'O conteúdo da anotação não pode ser vazio.'),
});

export class CreateNoteDto extends createZodDto(createNoteSchema) {}
