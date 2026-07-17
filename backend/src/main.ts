import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();
  // A validação é feita pelo ZodValidationPipe registrado como APP_PIPE global
  // (ver AppModule). Não usamos o ValidationPipe nativo do Nest — ele depende de
  // class-validator, que este projeto substituiu por Zod/nestjs-zod.

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Prumo API rodando em http://localhost:${port}/api`);
}

bootstrap();
