import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { CookieService } from './services/cookie.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';

@Module({
  imports: [
    UsersModule, // Импортируем, чтобы AuthService мог использовать UsersService
    PassportModule,
    ConfigModule, // Добавляем ConfigModule для работы с .env
    TypeOrmModule.forFeature([User, UserBlock]), // Добавляем для BlockedUserGuard
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '30m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, BruteForceProtectionService, CookieService],
  controllers: [AuthController],
})
export class AuthModule {}