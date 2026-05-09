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
import { ChatModule } from './chat/chat.module';
import { VerificationModule } from './verification/verification.module';
import { SeedService } from './common/services/seed.service';
import { Container } from './containers/entities/container.entity';
import { Category } from './categories/entities/category.entity';
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 10,
                },
                {
                    name: 'medium',
                    ttl: 10000,
                    limit: 50,
                },
                {
                    name: 'long',
                    ttl: 60000,
                    limit: 200,
                }
            ])
        ] : [
            ThrottlerModule.forRoot([
                {
                    name: 'dev',
                    ttl: 1000,
                    limit: 1000,
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
        MailerModule.forRoot({
            transport: {
                host: process.env.MAIL_HOST,
                port: parseInt(process.env.MAIL_PORT || '465'),
                secure: true,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            },
            defaults: {
                from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
            },
        }),
        AuthModule,
        UsersModule,
        PointsModule,
        CategoriesModule,
        ContainersModule,
        AdminModule,
        ReportsModule,
        ZlataModule,
        VinlandModule,
        ChatModule,
        VerificationModule,
        TypeOrmModule.forFeature([Category, Container]),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        SeedService,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes('*');
    }
}
