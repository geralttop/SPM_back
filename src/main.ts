  import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Импортируем
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Раздача статических файлов (аватарки)
  // __dirname в скомпилированном коде = dist/src, поэтому идем на 2 уровня вверх
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

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
    origin: (origin, callback) => {
      // Разрешаем localhost, локальные IP и Vercel
      const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://shareplacesmap.vercel.app',
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,  // 10.x.x.x
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,     // 192.168.x.x
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/, // 172.16-31.x.x
      ];
      
      if (!origin || allowedOrigins.some(allowed => 
        typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
      )) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // ВАЖНО: разрешаем отправку cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Конфигурация Swagger
  const config = new DocumentBuilder()
    .setTitle('Geo Map API')
    .setDescription(
      'Документация API картографического сервиса. ' +
      'Включает авторизацию (JWT + 2FA по email), точки на карте, категории, контейнеры, комментарии, избранное, подписки и жалобы. ' +
      'Используйте кнопку **Authorize** и введите Bearer токен для защищённых эндпоинтов.'
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Доступ будет по адресу /api

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Слушаем на всех интерфейсах
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();