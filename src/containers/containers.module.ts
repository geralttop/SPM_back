import { Module } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { ContainersController } from './containers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Container } from './entities/container.entity';
import { User } from '../users/user.entity';
import { UserBlock } from '../users/entities/user-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Container, User, UserBlock])],
  controllers: [ContainersController],
  providers: [ContainersService],
  exports: [ContainersService, TypeOrmModule] // Экспортируем, чтобы другие модули видели репозиторий
})
export class ContainersModule {}
