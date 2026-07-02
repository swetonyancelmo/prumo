import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/supabase-jwt.strategy';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import type { ReportPeriod } from './reports.util';

@Controller('reports')
@UseGuards(SupabaseJwtGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Query() query: ReportQueryDto) {
    return this.reports.getReport(
      user.id,
      query.period as ReportPeriod,
      query.anchor ?? new Date(),
    );
  }
}
