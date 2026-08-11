import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { FinanceModule } from './finance/finance.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      errorMessage: 'Muitas requisições. Por favor, tente novamente em breve.',
      throttlers: [
        {
          name: 'global',
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    UsersModule,
    FinanceModule,
    ReportsModule,
    TasksModule,
    NotesModule,
  ],
  providers: [
    // Valida DTOs criados com nestjs-zod (createZodDto) em toda a aplicação.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Rate limiter global para todas as rotas da aplicação.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
