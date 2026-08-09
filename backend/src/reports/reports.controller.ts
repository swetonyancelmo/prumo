import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import type { ReportPeriod } from './reports.util';

@Controller('reports')
@UseGuards(JwtAuthGuard)
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
