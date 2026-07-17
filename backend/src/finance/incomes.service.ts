import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        userId,
        amount: dto.amount,
        description: dto.description,
        receivedAt: dto.receivedAt ?? new Date(),
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.income.findMany({
      where: { userId },
      orderBy: { receivedAt: 'desc' },
    });
  }

  private async findOwned(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: { id, userId },
    });
    if (!income) {
      throw new NotFoundException('Receita não encontrada.');
    }
    return income;
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto) {
    await this.findOwned(userId, id);
    return this.prisma.income.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.income.delete({ where: { id } });
    return { deleted: true };
  }
}
