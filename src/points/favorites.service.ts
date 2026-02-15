import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { PointEntity } from './entities/point.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
  ) {}

  async addToFavorites(userId: number, pointId: string): Promise<void> {
    // Проверяем, существует ли точка
    const point = await this.pointsRepository.findOne({ where: { id: pointId } });
    if (!point) {
      throw new NotFoundException('Точка не найдена');
    }

    // Проверяем, не добавлена ли уже в избранное
    const existingFavorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: userId },
        point: { id: pointId },
      },
    });

    if (existingFavorite) {
      throw new BadRequestException('Точка уже добавлена в избранное');
    }

    const favorite = this.favoritesRepository.create({
      user: { id: userId } as User,
      point: { id: pointId } as PointEntity,
    });

    await this.favoritesRepository.save(favorite);
  }

  async removeFromFavorites(userId: number, pointId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: userId },
        point: { id: pointId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Точка не найдена в избранном');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async getUserFavorites(userId: number) {
    const favorites = await this.favoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['point', 'point.category', 'point.container', 'point.author'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map((fav) => ({
      id: fav.point.id,
      name: fav.point.name,
      description: fav.point.description,
      address: fav.point.address,
      coords: fav.point.coords,
      category: fav.point.category,
      container: fav.point.container,
      author: fav.point.author,
      addedAt: fav.createdAt,
    }));
  }

  async isFavorite(userId: number, pointId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: userId },
        point: { id: pointId },
      },
    });

    return !!favorite;
  }
}
