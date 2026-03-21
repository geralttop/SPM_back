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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';

@ApiTags('Подписки')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('follow/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подписаться', description: 'Подписаться на пользователя по ID.' })
  @ApiParam({ name: 'userId', example: '2' })
  @ApiOkResponse({ description: 'Подписка оформлена', schema: { example: { message: 'Подписка успешно оформлена' } } })
  async follow(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    await this.subscriptionsService.follow(req.user.id, userId);
    return { message: 'Подписка успешно оформлена' };
  }

  @Delete('unfollow/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отписаться' })
  @ApiParam({ name: 'userId', example: '2' })
  @ApiOkResponse({ description: 'Подписка отменена', schema: { example: { message: 'Подписка успешно отменена' } } })
  async unfollow(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    await this.subscriptionsService.unfollow(req.user.id, userId);
    return { message: 'Подписка успешно отменена' };
  }

  @Get('followers/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подписчики', description: 'Список подписчиков пользователя.' })
  @ApiParam({ name: 'userId', example: '1' })
  @ApiOkResponse({ description: 'Массив пользователей-подписчиков' })
  async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.getFollowers(userId);
  }

  @Get('following/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подписки пользователя', description: 'Список пользователей, на которых подписан указанный пользователь.' })
  @ApiParam({ name: 'userId', example: '1' })
  @ApiOkResponse({ description: 'Массив пользователей' })
  async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.getFollowing(userId);
  }

  @Get('stats/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика подписок', description: 'Количество подписчиков и подписок, флаг isFollowing для текущего пользователя.' })
  @ApiParam({ name: 'userId', example: '1' })
  @ApiOkResponse({ description: 'Объект с followersCount, followingCount, isFollowing' })
  async getStats(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.getSubscriptionStats(userId, req.user.id);
  }

  @Get('is-following/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Проверить подписку', description: 'Проверяет, подписан ли текущий пользователь на указанного.' })
  @ApiParam({ name: 'userId', example: '2' })
  @ApiOkResponse({ description: 'Флаг подписки', schema: { example: { isFollowing: true } } })
  async isFollowing(@Request() req, @Param('userId', ParseIntPipe) userId: number) {
    const isFollowing = await this.subscriptionsService.isFollowing(req.user.id, userId);
    return { isFollowing };
  }
}
