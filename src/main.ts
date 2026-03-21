import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const LOCAL_NETWORK_PATTERNS = [
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/,
];

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsOrigins.includes(origin) ||
        LOCAL_NETWORK_PATTERNS.some(p => p.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();