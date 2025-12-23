import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 8000;

  // Global validation for each route handler
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port, () => {
    console.log(`Application running on http://localhost:${port}`);
  });
}
bootstrap();
