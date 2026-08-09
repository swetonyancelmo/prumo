import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ACCESS_AUDIENCE,
  JWT_ISSUER,
  REFRESH_AUDIENCE,
  getJwtSecret,
} from './jwt.strategy';

const BCRYPT_ROUNDS = 12;

/**
 * Hash descartável usado para gastar tempo de CPU quando o e-mail não existe.
 * Sem isso, "e-mail inexistente" responderia bem mais rápido que "senha
 * errada", e daria para descobrir quem tem conta no Prumo pelo relógio.
 * (Valor arbitrário — corresponde a uma senha que ninguém usa.)
 */
const DUMMY_HASH = bcrypt.hashSync('prumo-timing-equalizer', BCRYPT_ROUNDS);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

interface RefreshPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
        },
      });
      return this.buildAuthResult(user);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já tem uma conta.');
      }
      throw e;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Compara sempre — inclusive sem usuário — para não vazar a existência da
    // conta pelo tempo de resposta. Ver DUMMY_HASH.
    const matches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !matches) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    return this.buildAuthResult(user);
  }

  /**
   * Troca um refresh token válido por um par novo (rotação).
   * O token precisa ter sido emitido como refresh — um access token aqui é
   * rejeitado pela audience.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: getJwtSecret(this.config),
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: REFRESH_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('Sessão expirada. Entre novamente.');
    }

    // O usuário pode ter sido excluído (LGPD) com o token ainda válido.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Sessão expirada. Entre novamente.');
    }

    return this.buildAuthResult(user);
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const secret = getJwtSecret(this.config);
    const claims = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(claims, {
        secret,
        issuer: JWT_ISSUER,
        audience: ACCESS_AUDIENCE,
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
      }),
      this.jwt.signAsync(claims, {
        secret,
        issuer: JWT_ISSUER,
        audience: REFRESH_AUDIENCE,
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '30d',
      }),
    ]);

    return { accessToken, refreshToken, user: toPublicUser(user) };
  }
}

/** Remove o hash da senha antes de qualquer coisa sair pela API. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
