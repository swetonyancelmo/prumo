import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Campos devolvidos pela API. Existe para garantir que `passwordHash` NUNCA
 * saia numa resposta — por isso é um `select` explícito, e não um `omit`:
 * campo novo no schema não vaza por esquecimento.
 */
const publicFields = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // A criação da conta é do AuthService (`POST /api/auth/register`), que é
  // quem tem a senha para hashear.
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicFields,
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
        select: publicFields,
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

  /** Exclusão completa (LGPD) — cascata remove despesas/receitas/tarefas/categorias. */
  async remove(id: string) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
