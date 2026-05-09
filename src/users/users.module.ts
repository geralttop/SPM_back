import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Subscription } from './entities/subscription.entity';
import { UserVerification } from './entities/user-verification.entity';
import { UserSecurity } from './entities/user-security.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UserBlock } from './entities/user-block.entity';
import { UserBioHistory } from './entities/user-bio-history.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BioHistoryService } from './bio-history.service';
import { PointsModule } from '../points/points.module';
import { MyStatsController } from './my-stats.controller';
import { PointEntity } from '../points/entities/point.entity';
import { Comment } from '../points/entities/comment.entity';
import { Favorite } from '../points/entities/favorite.entity';
import { Category } from '../categories/entities/category.entity';
import { Container } from '../containers/entities/container.entity';

@Module({
  imports: [
    PointsModule,
    TypeOrmModule.forFeature([
      User,
      Subscription,
      UserVerification,
      UserSecurity,
      UserSettings,
      UserBlock,
      UserBioHistory,
      PointEntity,
      Comment,
      Favorite,
      Category,
      Container,
    ]),
  ],
  providers: [UsersService, SubscriptionsService, BioHistoryService],
  controllers: [SubscriptionsController, MyStatsController],
  exports: [UsersService, SubscriptionsService, BioHistoryService, TypeOrmModule],
})
export class UsersModule {}