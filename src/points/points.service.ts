import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointEntity } from './entities/point.entity';
import { CreatePointDto } from './dto/create-point.dto';
import { UpdatePointDto } from './dto/update-point.dto';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
  ) {}

  async create(createPointDto: CreatePointDto, userId: number) {
    const { lng, lat, containerId, categoryId, ...rest } = createPointDto;

    const newPoint = this.pointsRepository.create({
      ...rest,
      coords: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      // Передаем объекты с ID, TypeORM сам свяжет их в БД
      container: { id: containerId },
      category: { id: categoryId },
      author: { id: userId },
      authorId: userId,
    });

    const savedPoint = await this.pointsRepository.save(newPoint);
    
    // Возвращаем точку с загруженными relations
    return await this.pointsRepository.findOne({
      where: { id: savedPoint.id },
      relations: ['category', 'container', 'author'],
    });
  }

  async findByUser(userId: number) {
    return await this.pointsRepository.find({
      where: { authorId: userId },
      relations: ['category', 'container', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updatePointDto: UpdatePointDto, userId: number) {
    // Ищем точку и проверяем, что она принадлежит пользователю
    const point = await this.pointsRepository.findOne({ 
      where: { id, authorId: userId },
      relations: ['author', 'category', 'container']
    });
    
    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена или у вас нет прав на её редактирование`);
    }

    const { lng, lat, categoryId, containerId, ...rest } = updatePointDto;

    // Применяем простые поля (имя, описание)
    Object.assign(point, rest);

    // Если переданы новые координаты, обновляем объект coords
    if (lng !== undefined && lat !== undefined) {
      point.coords = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    // Если передана новая категория
    if (categoryId) {
      point.category = { id: categoryId } as any;
    }

    // Если передан новый контейнер
    if (containerId) {
      point.container = { id: containerId } as any;
    }

    const savedPoint = await this.pointsRepository.save(point);
    
    // Возвращаем обновленную точку с загруженными relations
    return await this.pointsRepository.findOne({
      where: { id: savedPoint.id },
      relations: ['category', 'container', 'author'],
    });
  }

  async remove(id: string, userId: number) {
    const point = await this.pointsRepository.findOne({ 
      where: { id, authorId: userId },
      relations: ['author']
    });
    
    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена или у вас нет прав на её удаление`);
    }

    await this.pointsRepository.remove(point);
    
    return { message: `Точка ${id} успешно удалена` };
  }

  // Метод для получения всех точек (для админки или карты)
  async findAll() {
    return await this.pointsRepository.find({
      relations: ['category', 'container', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  // Метод для получения ленты точек с пагинацией (только свои точки и точки подписок)
  async getFeed(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Используем QueryBuilder для более сложного запроса
    const queryBuilder = this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoin('subscriptions', 'subscription', 'subscription.followingId = point.authorId AND subscription.followerId = :userId', { userId })
      .where('point.authorId = :userId OR subscription.id IS NOT NULL', { userId })
      .orderBy('point.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [points, total] = await queryBuilder.getManyAndCount();

    return {
      points,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }
}
