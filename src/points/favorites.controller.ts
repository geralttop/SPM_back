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
    const userId = req.user.userId || req.user.sub;
    await this.favoritesService.addToFavorites(userId, pointId);
    return { message: 'Точка добавлена в избранное' };
  }

  @Delete(':pointId')
  async removeFromFavorites(@Request() req, @Param('pointId') pointId: string) {
    const userId = req.user.userId || req.user.sub;
    await this.favoritesService.removeFromFavorites(userId, pointId);
    return { message: 'Точка удалена из избранного' };
  }

  @Get()
  async getUserFavorites(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.favoritesService.getUserFavorites(userId);
  }

  @Get('check/:pointId')
  async isFavorite(@Request() req, @Param('pointId') pointId: string) {
    const userId = req.user.userId || req.user.sub;
    const isFavorite = await this.favoritesService.isFavorite(userId, pointId);
    return { isFavorite };
  }
}
