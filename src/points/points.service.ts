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

  async createPoint(createPointDto: CreatePointDto, userId: number) {
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
    
    // Возвращаем точку с загруженными relations и количеством комментариев
    const point = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id: savedPoint.id })
      .getOne();
    
    return point;
  }

  async findByUser(userId: number) {
    const points = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.authorId = :userId', { userId })
      .orderBy('point.createdAt', 'DESC')
      .getMany();
    
    return points;
  }

  async updatePoint(id: string, updatePointDto: UpdatePointDto, userId: number) {
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
    
    // Возвращаем обновленную точку с загруженными relations и количеством комментариев
    const updatedPoint = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id: savedPoint.id })
      .getOne();
    
    return updatedPoint;
  }

  async removePoint(id: string, userId: number) {
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
    const points = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .orderBy('point.createdAt', 'DESC')
      .getMany();
    
    return points;
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
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
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

  // Методы для админки
  async findAllWithPagination(options: {
    skip?: number;
    take?: number;
    order?: any;
    relations?: string[];
  }): Promise<[PointEntity[], number]> {
    return this.pointsRepository.findAndCount({
      skip: options.skip || 0,
      take: options.take || 10,
      order: options.order || { createdAt: 'DESC' },
      relations: options.relations || ['category', 'container', 'author'],
    });
  }

  async findOne(id: string): Promise<PointEntity> {
    const point = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id })
      .getOne();
    
    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена`);
    }
    
    return point;
  }

  // Админский метод обновления (без проверки владельца)
  async update(id: string, updateData: any): Promise<PointEntity> {
    const point = await this.findOne(id);
    Object.assign(point, updateData);
    return this.pointsRepository.save(point);
  }

  // Админский метод создания
  async create(createData: any): Promise<PointEntity> {
    const newPoint = this.pointsRepository.create(createData);
    return await this.pointsRepository.save(newPoint) as unknown as PointEntity;
  }

  // Админский метод удаления
  async remove(id: string): Promise<void> {
    const point = await this.findOne(id);
    await this.pointsRepository.remove(point);
  }
}
