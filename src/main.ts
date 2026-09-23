import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:3001",
    Credential: true
  })
  app.useGlobalPipes(new ValidationPipe())

  
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
