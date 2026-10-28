import { INestApplication, ValidationPipe } from '@nestjs/common';

// Configuração compartilhada entre main.ts e os testes e2e:
// garante que o app de teste valida entrada exatamente como o app real.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
