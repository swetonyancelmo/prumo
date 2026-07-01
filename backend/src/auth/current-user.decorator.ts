import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './supabase-jwt.strategy';

/**
 * Injeta o usuário autenticado (extraído do JWT do Supabase) no handler.
 * Uso: `metodo(@CurrentUser() user: AuthUser)`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
