import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        description: dto.description,
        dueDate: dto.dueDate,
        isRecurring: dto.isRecurring ?? false,
        recurrenceRule: dto.recurrenceRule,
        source: 'web',
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }],
    });
  }

  private async findOwned(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada.');
    }
    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.findOwned(userId, id);
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.task.delete({ where: { id } });
    return { deleted: true };
  }
}
