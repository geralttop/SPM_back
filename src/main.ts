import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Импортируем

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Подключаем cookie-parser для работы с cookies
  app.use(cookieParser());

  // Подключаем глобальную валидацию
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Удаляет свойства, которых нет в DTO
    forbidNonWhitelisted: true, // Выбрасывает ошибку при лишних свойствах
    transform: true, // Автоматически преобразует типы
    disableErrorMessages: false, // Показывает подробные ошибки валидации
  }));

  // Настройка CORS для разрешения запросов с фронтенда
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true, // ВАЖНО: разрешаем отправку cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Конфигурация Swagger
  const config = new DocumentBuilder()
    .setTitle('Geo Map API') // Название твоего проекта
    .setDescription('Документация API для картографического сервиса') // Описание
    .setVersion('1.0')
    .addBearerAuth() // Включаем поддержку JWT токенов в Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Доступ будет по адресу /api

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();