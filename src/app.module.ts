import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PointsModule } from './points/points.module';
import { CategoriesModule } from './categories/categories.module';
import { ContainersModule } from './containers/containers.module';
import { AdminModule } from './admin/admin.module';
import { ReportsModule } from './reports/reports.module';
import { ZlataModule } from './zlata/zlata.module';
import { VinlandModule } from './vinland/vinland.module';
import { SeedService } from './common/services/seed.service';
import { Container } from './containers/entities/container.entity';
import { Category } from './categories/entities/category.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Делаем ConfigModule доступным глобально
      envFilePath: '.env', // Путь к .env файлу
    }),
    
    // Rate limiting configuration - отключено для разработки
    ...(process.env.NODE_ENV === 'production' ? [
      ThrottlerModule.forRoot([
        {
          name: 'short',
          ttl: 1000, // 1 секунда
          limit: 10, // 10 запросов в секунду
        },
        {
          name: 'medium', 
          ttl: 10000, // 10 секунд
          limit: 50, // 50 запросов за 10 секунд
        },
        {
          name: 'long',
          ttl: 60000, // 1 минута
          limit: 200, // 200 запросов в минуту
        }
      ])
    ] : [
      // Для разработки - очень мягкие ограничения
      ThrottlerModule.forRoot([
        {
          name: 'dev',
          ttl: 1000,
          limit: 1000, // 1000 запросов в секунду для разработки
        }
      ])
    ]),
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    
    // --- ВСТАВЛЯЕМ СЮДА ---
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '465'),
        secure: true, // true для порта 465
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      },
    }),
    // -----------------------

    AuthModule,
    UsersModule,
    PointsModule,
    CategoriesModule,
    ContainersModule,
    AdminModule,
    ReportsModule,
    ZlataModule,
    VinlandModule,

    TypeOrmModule.forFeature([Category, Container]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Применяем rate limiting глобально
    },
    SeedService, // Добавляем SeedService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}