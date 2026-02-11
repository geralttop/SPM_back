import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointEntity } from './entities/point.entity';
import { Favorite } from './entities/favorite.entity';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointEntity, Favorite])],
  controllers: [PointsController, FavoritesController],
  providers: [PointsService, FavoritesService],
  exports: [PointsService, FavoritesService, TypeOrmModule],
})
export class PointsModule {}