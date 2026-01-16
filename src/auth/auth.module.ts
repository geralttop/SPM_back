import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule, // Импортируем, чтобы AuthService мог использовать UsersService
    PassportModule,
    JwtModule.register({
      secret: 'ACCESS_SECRET', // Должен совпадать с ключом в JWT стратегии
      signOptions: { expiresIn: '15m' }, // Срок должен совпадать с access токеном
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}