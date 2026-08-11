import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Origens autorizadas a chamar a API, de `CORS_ORIGIN` (lista separada por
 * vírgula). Em produção o frontend fica na Vercel, em domínio diferente do da
 * API no Render, então a lista precisa ser explícita.
 *
 * Sem a variável definida, libera geral — conveniente no `localhost`, mas é
 * justamente por isso que `CORS_ORIGIN` é obrigatória no render.yaml.
 */
function corsOrigin(): string[] | boolean {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) return true;
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configura o Express para confiar nos cabeçalhos de proxy do Render (necessário para rate limit)
  app.set('trust proxy', true);

  // Cabeçalhos HTTP de segurança contra vulnerabilidades comuns
  app.use(helmet());

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigin(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // A validação é feita pelo ZodValidationPipe registrado como APP_PIPE global
  // (ver AppModule). Não usamos o ValidationPipe nativo do Nest — ele depende de
  // class-validator, que este projeto substituiu por Zod/nestjs-zod.

  // O Render injeta a porta em PORT — ouvir noutra faz o deploy falhar por
  // timeout. 0.0.0.0 porque localhost não recebe o tráfego do proxy dele.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Prumo API rodando na porta ${port} (prefixo /api)`);
}

bootstrap();
