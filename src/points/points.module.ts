import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointEntity } from './entities/point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PointEntity])], // Добавляем сюда
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}