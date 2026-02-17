import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointEntity } from './entities/point.entity';
import { Favorite } from './entities/favorite.entity';
import { Comment } from './entities/comment.entity';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointEntity, Favorite, Comment])],
  controllers: [PointsController, FavoritesController, CommentsController],
  providers: [PointsService, FavoritesService, CommentsService],
  exports: [PointsService, FavoritesService, CommentsService, TypeOrmModule],
})
export class PointsModule {}