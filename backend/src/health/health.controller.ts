import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Usado pelo health check do Render (rota pública, sem guard).
 *
 * Consulta o banco de propósito: uma API do Prumo sem Postgres não serve para
 * nada, e é melhor o deploy falhar aqui — com a causa explícita — do que subir
 * "saudável" e quebrar no primeiro request do usuário.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unreachable',
      });
    }
    return { status: 'ok', database: 'ok', timestamp: new Date().toISOString() };
  }
}
