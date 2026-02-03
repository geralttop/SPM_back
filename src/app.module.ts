import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer'; // Не забудь импорт
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PointsModule } from './points/points.module';
import { CategoriesModule } from './categories/categories.module';
import { ContainersModule } from './containers/containers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Делаем ConfigModule доступным глобально
      envFilePath: '.env', // Путь к .env файлу
    }),
    
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 секунда
        limit: 3, // 3 запроса в секунду (общий лимит)
      },
      {
        name: 'medium', 
        ttl: 10000, // 10 секунд
        limit: 20, // 20 запросов за 10 секунд
      },
      {
        name: 'long',
        ttl: 60000, // 1 минута
        limit: 100, // 100 запросов в минуту
      }
    ]),
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'my_secret_password',
      database: 'geo_map_app',
      autoLoadEntities: true,
      synchronize: true, 
    }),
    
    // --- ВСТАВЛЯЕМ СЮДА ---
    MailerModule.forRoot({
      transport: {
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true, // true для порта 465
        auth: {
          user: 'bluevotinamaliba@yandex.ru',
          pass: 'zesvvcnuzgstbfnl', // Специальный пароль из настроек Яндекса
        },
      },
      defaults: {
        from: '"SMP" <bluevotinamaliba@yandex.ru>',
      },
    }),
    // -----------------------

    AuthModule,
    UsersModule,
    PointsModule,
    CategoriesModule,
    ContainersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Применяем rate limiting глобально
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Применять ко всем эндпоинтам
  }
}