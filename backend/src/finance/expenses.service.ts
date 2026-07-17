import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCategory(userId: string, categoryId?: string) {
    if (!categoryId) return;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, type: 'despesa' },
    });
    if (!category) {
      throw new BadRequestException(
        'Categoria inválida (inexistente, de outro usuário, ou não é do tipo despesa).',
      );
    }
  }

  async create(userId: string, dto: CreateExpenseDto) {
    await this.assertCategory(userId, dto.categoryId);
    return this.prisma.expense.create({
      data: {
        userId,
        amount: dto.amount,
        categoryId: dto.categoryId,
        description: dto.description,
        occurredAt: dto.occurredAt ?? new Date(),
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      include: { category: true },
    });
  }

  private async findOwned(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!expense) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    return expense;
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOwned(userId, id);
    await this.assertCategory(userId, dto.categoryId);
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.expense.delete({ where: { id } });
    return { deleted: true };
  }
}
