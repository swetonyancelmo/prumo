import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Payload relevante de um JWT emitido pelo Supabase Auth.
 * `sub` é o UUID do usuário (auth.users.id no Supabase).
 */
export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  aud: string;
  role?: string;
}

/**
 * Usuário autenticado que anexamos ao request após validar o token.
 */
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
}

/**
 * Monta as opções da estratégia validando o JWT via JWKS (ES256).
 *
 * O projeto Supabase usa JWT Signing Keys (chave assimétrica ECC P-256 → ES256).
 * As chaves públicas ficam em `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`; a
 * chave correta é resolvida pelo `kid` do header do token. jwks-rsa faz cache e
 * rate limit das buscas do JWKS.
 *
 * Isolado numa função para ser testável (mockando o endpoint JWKS).
 */
export function buildSupabaseJwtOptions(config: ConfigService): StrategyOptions {
  const supabaseUrl = config.get<string>('SUPABASE_URL');
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL não configurado no ambiente.');
  }

  const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    algorithms: ['ES256'],
    audience: config.get<string>('SUPABASE_JWT_AUDIENCE') ?? 'authenticated',
    issuer: `${supabaseUrl}/auth/v1`,
    secretOrKeyProvider: passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri,
    }),
  };
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(
  Strategy,
  'supabase-jwt',
) {
  constructor(config: ConfigService) {
    super(buildSupabaseJwtOptions(config));
  }

  // O retorno vira `request.user`.
  validate(payload: SupabaseJwtPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token sem subject (sub).');
    }
    return {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
    };
  }
}
