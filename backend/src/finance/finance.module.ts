import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { FinanceService } from './finance.service';

@Module({
  controllers: [
    CategoriesController,
    ExpensesController,
    IncomesController,
  ],
  providers: [
    CategoriesService,
    ExpensesService,
    IncomesService,
    FinanceService,
  ],
  exports: [FinanceService],
})
export class FinanceModule {}
