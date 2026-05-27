import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointEntity } from './entities/point.entity';
import { PointPhotoEntity } from './entities/point-photo.entity';
import { Favorite } from './entities/favorite.entity';
import { Comment } from './entities/comment.entity';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { User } from '../users/user.entity';
import { UserBlock } from '../users/entities/user-block.entity';
import { PointHistoryEntity } from './entities/point-history.entity';
import { PointHistoryPhotoEntity } from './entities/point-history-photo.entity';
import { PointHistoryService } from './point-history.service';
import { Report } from '../reports/entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PointEntity,
      PointPhotoEntity,
      Favorite,
      Comment,
      User,
      UserBlock,
      PointHistoryEntity,
      PointHistoryPhotoEntity,
      Report,
    ]),
  ],
  controllers: [PointsController, FavoritesController, CommentsController],
  providers: [PointsService, FavoritesService, CommentsService, PointHistoryService],
  exports: [PointsService, FavoritesService, CommentsService, PointHistoryService, TypeOrmModule],
})
export class PointsModule {}