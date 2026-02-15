import { Module } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { ContainersController } from './containers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Container } from './entities/container.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Container])], // ОБЯЗАТЕЛЬНО
  controllers: [ContainersController],
  providers: [ContainersService],
  exports: [ContainersService, TypeOrmModule] // Экспортируем, чтобы другие модули видели репозиторий
})
export class ContainersModule {}
