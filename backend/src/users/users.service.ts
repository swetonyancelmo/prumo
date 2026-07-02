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
          phoneNumber: dto.phoneNumber,
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
          'Esse telefone ou e-mail já está em uso por outra conta.',
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

  findByPhone(phoneNumber: string) {
    return this.prisma.user.findUnique({ where: { phoneNumber } });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  /** Exclusão completa (LGPD) — cascata remove despesas/receitas/tarefas/mensagens. */
  async remove(id: string) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
