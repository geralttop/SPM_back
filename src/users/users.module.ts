import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Регистрируем репозиторий User
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Экспортируем, чтобы AuthModule видел User
})
export class UsersModule {}