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
    const favorites = await this.favoritesRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.point', 'point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('favorite.userId = :userId', { userId })
      .orderBy('favorite.createdAt', 'DESC')
      .getMany();

    return favorites.map((fav) => ({
      id: fav.point.id,
      name: fav.point.name,
      description: fav.point.description,
      address: fav.point.address,
      coords: fav.point.coords,
      category: fav.point.category,
      container: fav.point.container,
      author: fav.point.author,
      commentsCount: (fav.point as any).commentsCount,
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
