import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // `userId` é o auth uid (sub do JWT). O perfil é criado com esse id; se já
  // existir (reenvio do onboarding), atualiza — mantém a operação idempotente.
  async create(userId: string, dto: CreateUserDto) {
    try {
      return await this.prisma.user.upsert({
        where: { id: userId },
        update: {
          email: dto.email,
          name: dto.name,
        },
        create: { id: userId, ...dto },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Esse e-mail já está em uso por outra conta.',
        );
      }
      throw e;
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  /** Exclusão completa (LGPD) — cascata remove despesas/receitas/tarefas/categorias. */
  async remove(id: string) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
