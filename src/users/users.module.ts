import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Subscription } from './entities/subscription.entity';
import { UserVerification } from './entities/user-verification.entity';
import { UserSecurity } from './entities/user-security.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UserBlock } from './entities/user-block.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Subscription,
      UserVerification,
      UserSecurity,
      UserSettings,
      UserBlock,
    ]),
  ],
  providers: [UsersService, SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [UsersService, SubscriptionsService, TypeOrmModule],
})
export class UsersModule {}