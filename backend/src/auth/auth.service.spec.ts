import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { ACCESS_AUDIENCE, JWT_ISSUER, REFRESH_AUDIENCE } from './jwt.strategy';

const SECRET = 'segredo-de-teste-longo-o-bastante-para-hs256';

// bcrypt a 12 rounds é lento de propósito; alguns testes fazem 2 hashes.
jest.setTimeout(30_000);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'maria@email.com',
    passwordHash: bcrypt.hashSync('senha-correta', 4),
    name: 'Maria',
    createdAt: new Date('2026-08-01T12:00:00Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  let prisma: { user: { create: jest.Mock; findUnique: jest.Mock } };
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(() => {
    prisma = {
      user: { create: jest.fn(), findUnique: jest.fn() },
    };
    jwt = new JwtService({});
    const config = {
      get: (key: string) => (key === 'JWT_SECRET' ? SECRET : undefined),
    } as unknown as ConfigService;

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      config,
    );
  });

  describe('register', () => {
    it('guarda a senha como hash — nunca em texto puro — e não devolve o hash', async () => {
      const created = makeUser();
      prisma.user.create.mockResolvedValue(created);

      const result = await service.register({
        email: 'maria@email.com',
        password: 'senha-correta',
        name: 'Maria',
      });

      const saved = prisma.user.create.mock.calls[0][0].data;
      expect(saved.passwordHash).not.toBe('senha-correta');
      expect(bcrypt.compareSync('senha-correta', saved.passwordHash)).toBe(true);

      expect(result.user).toEqual({
        id: created.id,
        email: created.email,
        name: created.name,
        createdAt: created.createdAt,
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejeita e-mail já cadastrado com 409', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: '5.22.0',
        }),
      );

      await expect(
        service.register({ email: 'maria@email.com', password: 'senha-correta' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('devolve tokens quando a senha confere', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      const result = await service.login({
        email: 'maria@email.com',
        password: 'senha-correta',
      });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.email).toBe('maria@email.com');
    });

    it('rejeita senha errada', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(
        service.login({ email: 'maria@email.com', password: 'senha-errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Mensagem idêntica à da senha errada: quem tenta adivinhar não descobre
    // se o e-mail existe.
    it('rejeita e-mail inexistente com a mesma mensagem de senha errada', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@email.com', password: 'qualquer' }),
      ).rejects.toThrow('E-mail ou senha incorretos.');
    });
  });

  describe('tokens', () => {
    it('emite access e refresh com audiences distintas', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      const { accessToken, refreshToken } = await service.login({
        email: 'maria@email.com',
        password: 'senha-correta',
      });

      expect(jwt.decode(accessToken)).toMatchObject({
        aud: ACCESS_AUDIENCE,
        iss: JWT_ISSUER,
        sub: '11111111-1111-4111-8111-111111111111',
      });
      expect(jwt.decode(refreshToken)).toMatchObject({ aud: REFRESH_AUDIENCE });
    });
  });

  describe('refresh', () => {
    async function issueTokens() {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      return service.login({
        email: 'maria@email.com',
        password: 'senha-correta',
      });
    }

    it('troca um refresh token válido por um par novo', async () => {
      const { refreshToken } = await issueTokens();

      const renewed = await service.refresh(refreshToken);

      expect(renewed.accessToken).toBeTruthy();
      expect(renewed.user.id).toBe('11111111-1111-4111-8111-111111111111');
    });

    // O access token vaza com mais facilidade (vai em todo request); ele não
    // pode servir para prolongar a sessão indefinidamente.
    it('recusa um access token no lugar do refresh', async () => {
      const { accessToken } = await issueTokens();

      await expect(service.refresh(accessToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('recusa token assinado com outro segredo', async () => {
      const forjado = await new JwtService({}).signAsync(
        { sub: '11111111-1111-4111-8111-111111111111', email: 'maria@email.com' },
        {
          secret: 'outro-segredo-qualquer',
          issuer: JWT_ISSUER,
          audience: REFRESH_AUDIENCE,
          expiresIn: '30d',
        },
      );

      await expect(service.refresh(forjado)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    // Conta excluída (LGPD) com token ainda dentro da validade.
    it('recusa refresh de usuário que não existe mais', async () => {
      const { refreshToken } = await issueTokens();
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
