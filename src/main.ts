import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Импортируем

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Конфигурация Swagger
  const config = new DocumentBuilder()
    .setTitle('Geo Map API') // Название твоего проекта
    .setDescription('Документация API для картографического сервиса') // Описание
    .setVersion('1.0')
    .addBearerAuth() // Включаем поддержку JWT токенов в Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Доступ будет по адресу /api

  await app.listen(3000);
}
bootstrap();