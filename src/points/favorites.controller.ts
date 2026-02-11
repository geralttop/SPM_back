import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':pointId')
  async addToFavorites(@Request() req, @Param('pointId') pointId: string) {
    await this.favoritesService.addToFavorites(req.user.id, pointId);
    return { message: 'Точка добавлена в избранное' };
  }

  @Delete(':pointId')
  async removeFromFavorites(@Request() req, @Param('pointId') pointId: string) {
    await this.favoritesService.removeFromFavorites(req.user.id, pointId);
    return { message: 'Точка удалена из избранного' };
  }

  @Get()
  async getUserFavorites(@Request() req) {
    return this.favoritesService.getUserFavorites(req.user.id);
  }

  @Get('check/:pointId')
  async isFavorite(@Request() req, @Param('pointId') pointId: string) {
    const isFavorite = await this.favoritesService.isFavorite(req.user.id, pointId);
    return { isFavorite };
  }

  @Get('stats/:pointId')
  async getFavoriteStats(@Param('pointId') pointId: string) {
    const count = await this.favoritesService.getFavoriteCount(pointId);
    return { favoritesCount: count };
  }
}
