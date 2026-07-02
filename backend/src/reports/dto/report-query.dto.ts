import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { REPORT_PERIODS } from '../reports.util';

export const reportQuerySchema = z.object({
  period: z
    .enum(REPORT_PERIODS as [string, ...string[]])
    .optional()
    .default('month'),
  // Data de referência (qualquer dia dentro do período desejado). Default: hoje.
  anchor: z.coerce.date().optional(),
});

export class ReportQueryDto extends createZodDto(reportQuerySchema) {}
