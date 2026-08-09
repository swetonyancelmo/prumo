import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

export const JWT_ISSUER = 'prumo';
/** Distingue o token de acesso do de refresh — um não vale pelo outro. */
export const ACCESS_AUDIENCE = 'prumo:access';
export const REFRESH_AUDIENCE = 'prumo:refresh';

/**
 * Payload dos JWTs emitidos pelo próprio Prumo.
 * `sub` é o `users.id`.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  aud: string;
  iss: string;
}

/** Usuário autenticado anexado ao request após validar o token. */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Segredo de assinatura dos tokens (HS256).
 *
 * Falha rápido se ausente: sem segredo não há como validar token nenhum, e
 * subir a API "funcionando" nesse estado esconderia o problema até o primeiro
 * login em produção.
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error(
      'JWT_SECRET não configurado no ambiente. Gere um valor aleatório longo ' +
        '(ex.: `openssl rand -base64 48`) e defina antes de subir a API.',
    );
  }
  return secret;
}

/**
 * Opções da estratégia que valida o token de ACESSO.
 * Isolada numa função para ser testável sem levantar o módulo inteiro.
 */
export function buildJwtOptions(config: ConfigService): StrategyOptions {
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: ACCESS_AUDIENCE,
    secretOrKey: getJwtSecret(config),
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super(buildJwtOptions(config));
  }

  // O retorno vira `request.user`.
  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token sem subject (sub).');
    }
    return { id: payload.sub, email: payload.email };
  }
}
