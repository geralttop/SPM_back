import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subscription])],
  providers: [UsersService, SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [UsersService, SubscriptionsService, TypeOrmModule],
})
export class UsersModule {}