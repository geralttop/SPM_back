import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';

@ApiTags('Избранное')
@Controller('favorites')
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':pointId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить в избранное', description: 'Добавляет точку в избранное текущего пользователя.' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Точка добавлена', schema: { example: { message: 'Точка добавлена в избранное' } } })
  async addToFavorites(@CurrentUserId() userId: number, @Param('pointId') pointId: string) {
    await this.favoritesService.addToFavorites(userId, pointId);
    return { message: 'Точка добавлена в избранное' };
  }

  @Delete(':pointId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить из избранного' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Точка удалена из избранного', schema: { example: { message: 'Точка удалена из избранного' } } })
  async removeFromFavorites(@CurrentUserId() userId: number, @Param('pointId') pointId: string) {
    await this.favoritesService.removeFromFavorites(userId, pointId);
    return { message: 'Точка удалена из избранного' };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Моё избранное', description: 'Список точек в избранном текущего пользователя.' })
  @ApiOkResponse({ description: 'Массив точек' })
  async getUserFavorites(@CurrentUserId() userId: number) {
    return this.favoritesService.getUserFavorites(userId);
  }

  @Get('point-ids')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'ID точек в избранном',
    description: 'Компактный список UUID точек в избранном текущего пользователя (для клиентской проверки без N запросов check).',
  })
  @ApiOkResponse({
    description: 'Массив UUID',
    schema: { example: { pointIds: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] } },
  })
  async getFavoritePointIds(@CurrentUserId() userId: number) {
    const pointIds = await this.favoritesService.getFavoritePointIds(userId);
    return { pointIds };
  }

  @Get('check/:pointId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Проверить избранное', description: 'Проверяет, в избранном ли точка у текущего пользователя.' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Флаг в избранном', schema: { example: { isFavorite: true } } })
  async isFavorite(@CurrentUserId() userId: number, @Param('pointId') pointId: string) {
    const isFavorite = await this.favoritesService.isFavorite(userId, pointId);
    return { isFavorite };
  }
}
