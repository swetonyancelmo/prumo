import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Controller('incomes')
@UseGuards(JwtAuthGuard)
export class IncomesController {
  constructor(private readonly incomes: IncomesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateIncomeDto) {
    return this.incomes.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.incomes.findAll(user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomes.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incomes.remove(user.id, id);
  }
}
