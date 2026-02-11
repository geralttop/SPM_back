import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('follow/:userId')
  async follow(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    await this.subscriptionsService.follow(req.user.id, userId);
    return { message: 'Подписка успешно оформлена' };
  }

  @Delete('unfollow/:userId')
  async unfollow(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    await this.subscriptionsService.unfollow(req.user.id, userId);
    return { message: 'Подписка успешно отменена' };
  }

  @Get('followers/:userId')
  async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.getFollowers(userId);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.getFollowing(userId);
  }

  @Get('stats/:userId')
  async getStats(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.getSubscriptionStats(userId, req.user.id);
  }

  @Get('is-following/:userId')
  async isFollowing(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    const isFollowing = await this.subscriptionsService.isFollowing(req.user.id, userId);
    return { isFollowing };
  }
}
