import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { PointEntity } from './entities/point.entity';
import { PointPhotoEntity } from './entities/point-photo.entity';
import { CreatePointDto } from './dto/create-point.dto';
import { UpdatePointDto } from './dto/update-point.dto';
import {
  MAX_PHOTOS_PER_POINT,
  POINT_MEDIA_ASPECT_W,
  POINT_MEDIA_ASPECT_H,
} from './points.constants';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
    @InjectRepository(PointPhotoEntity)
    private pointPhotoRepository: Repository<PointPhotoEntity>,
  ) {}

  private sortPhotos(point: PointEntity): void {
    if (point.photos?.length) {
      point.photos.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  private sortPhotosMany(points: PointEntity[]): void {
    for (const p of points) {
      this.sortPhotos(p);
    }
  }

  async createPoint(createPointDto: CreatePointDto, userId: number) {
    const { lng, lat, containerId, categoryId, ...rest } = createPointDto;

    const newPoint = this.pointsRepository.create({
      ...rest,
      coords: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      container: { id: containerId },
      category: { id: categoryId },
      author: { id: userId },
      authorId: userId,
    });

    const savedPoint = await this.pointsRepository.save(newPoint);

    const point = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id: savedPoint.id })
      .getOne();

    if (point) this.sortPhotos(point);
    return point;
  }

  async findByUser(userId: number) {
    const points = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.authorId = :userId', { userId })
      .orderBy('point.createdAt', 'DESC')
      .getMany();

    this.sortPhotosMany(points);
    return points;
  }

  async updatePoint(id: string, updatePointDto: UpdatePointDto, userId: number) {
    const point = await this.pointsRepository.findOne({
      where: { id, authorId: userId },
      relations: ['author', 'category', 'container'],
    });

    if (!point) {
      throw new NotFoundException(
        `Точка с ID ${id} не найдена или у вас нет прав на её редактирование`,
      );
    }

    const { lng, lat, categoryId, containerId, ...rest } = updatePointDto;

    Object.assign(point, rest);

    if (lng !== undefined && lat !== undefined) {
      point.coords = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    if (categoryId) {
      point.category = { id: categoryId } as any;
    }

    if (containerId) {
      point.container = { id: containerId } as any;
    }

    const savedPoint = await this.pointsRepository.save(point);

    const updatedPoint = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id: savedPoint.id })
      .getOne();

    if (updatedPoint) this.sortPhotos(updatedPoint);
    return updatedPoint;
  }

  async removePoint(id: string, userId: number) {
    const point = await this.pointsRepository.findOne({
      where: { id, authorId: userId },
      relations: ['author', 'photos'],
    });

    if (!point) {
      throw new NotFoundException(
        `Точка с ID ${id} не найдена или у вас нет прав на её удаление`,
      );
    }

    if (point.photos?.length) {
      for (const ph of point.photos) {
        this.unlinkPhotoFile(ph.url);
      }
    }

    await this.pointsRepository.remove(point);

    return { message: `Точка ${id} успешно удалена` };
  }

  async findAll() {
    const points = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .orderBy('point.createdAt', 'DESC')
      .getMany();

    this.sortPhotosMany(points);
    return points;
  }

  async getFeed(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .leftJoin(
        'subscriptions',
        'subscription',
        'subscription.followingId = point.authorId AND subscription.followerId = :userId',
        { userId },
      )
      .where('point.authorId = :userId OR subscription.id IS NOT NULL', {
        userId,
      })
      .orderBy('point.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [points, total] = await queryBuilder.getManyAndCount();

    this.sortPhotosMany(points);

    return {
      points,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  /** Все точки контейнера с теми же связями, что и в ленте (карта «шаринга»). */
  async findByContainerForMap(containerId: string): Promise<PointEntity[]> {
    const points = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.containerId = :containerId', { containerId })
      .orderBy('point.createdAt', 'DESC')
      .getMany();

    this.sortPhotosMany(points);
    return points;
  }

  private async viewerHasSubscription(
    viewerId: number,
    authorId: number,
  ): Promise<boolean> {
    const row = await this.pointsRepository
      .createQueryBuilder()
      .select('s.id')
      .from('subscriptions', 's')
      .where('s.followerId = :viewerId AND s.followingId = :authorId', {
        viewerId,
        authorId,
      })
      .limit(1)
      .getRawOne();
    return row != null;
  }

  /**
   * Одна точка по id: своя / подписка / (опционально) открыта из шареной карты контейнера через fromContainerId.
   */
  async findOneForViewer(
    id: string,
    viewerId: number,
    opts?: { fromContainerId?: string },
  ): Promise<PointEntity> {
    const point = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id })
      .getOne();

    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена`);
    }

    const fromContainerId = opts?.fromContainerId?.trim() || undefined;

    if (point.authorId === viewerId) {
      this.sortPhotos(point);
      return point;
    }

    if (
      fromContainerId &&
      point.container?.id === fromContainerId &&
      point.container.authorId != null
    ) {
      this.sortPhotos(point);
      return point;
    }

    const hasSub = await this.viewerHasSubscription(viewerId, point.authorId);
    if (hasSub) {
      this.sortPhotos(point);
      return point;
    }

    throw new NotFoundException(`Точка с ID ${id} не найдена`);
  }

  async findAllWithPagination(options: {
    skip?: number;
    take?: number;
    order?: any;
    relations?: string[];
  }): Promise<[PointEntity[], number]> {
    const rels = options.relations || [
      'category',
      'container',
      'author',
      'photos',
    ];
    return this.pointsRepository.findAndCount({
      skip: options.skip || 0,
      take: options.take || 10,
      order: options.order || { createdAt: 'DESC' },
      relations: rels,
    });
  }

  async findOne(id: string): Promise<PointEntity> {
    const point = await this.pointsRepository
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.category', 'category')
      .leftJoinAndSelect('point.container', 'container')
      .leftJoinAndSelect('point.author', 'author')
      .leftJoinAndSelect('point.photos', 'photos')
      .loadRelationCountAndMap('point.commentsCount', 'point.comments')
      .where('point.id = :id', { id })
      .getOne();

    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена`);
    }

    this.sortPhotos(point);
    return point;
  }

  async update(id: string, updateData: any): Promise<PointEntity> {
    const point = await this.findOne(id);
    Object.assign(point, updateData);
    return this.pointsRepository.save(point);
  }

  async create(createData: any): Promise<PointEntity> {
    const newPoint = this.pointsRepository.create(createData);
    return (await this.pointsRepository.save(
      newPoint,
    )) as unknown as PointEntity;
  }

  async remove(id: string): Promise<void> {
    const point = await this.findOne(id);
    if (point.photos?.length) {
      for (const ph of point.photos) {
        this.unlinkPhotoFile(ph.url);
      }
    }
    await this.pointsRepository.remove(point);
  }

  private unlinkPhotoFile(url: string): void {
    const relative = url.startsWith('/') ? url.slice(1) : url;
    const full = path.join(process.cwd(), relative);
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
    }
  }

  private validateDimensionPair(w?: number, h?: number): { w: number; h: number } | null {
    if (
      w != null &&
      h != null &&
      Number.isInteger(w) &&
      Number.isInteger(h) &&
      w >= 1 &&
      w <= 8192 &&
      h >= 1 &&
      h <= 8192
    ) {
      return { w, h };
    }
    return null;
  }

  /**
   * Загрузка фото к точке (multipart). Только автор точки.
   */
  async addPointPhotos(
    pointId: string,
    userId: number,
    files: Express.Multer.File[],
    dimensions: { width?: number; height?: number }[],
  ): Promise<PointEntity> {
    if (!files?.length) {
      throw new BadRequestException('Файлы не переданы');
    }

    const point = await this.pointsRepository.findOne({
      where: { id: pointId, authorId: userId },
      relations: ['photos'],
    });

    if (!point) {
      throw new NotFoundException(
        'Точка не найдена или нет прав на загрузку фотографий',
      );
    }

    const existingCount = point.photos?.length ?? 0;
    if (existingCount + files.length > MAX_PHOTOS_PER_POINT) {
      throw new BadRequestException(
        `Не более ${MAX_PHOTOS_PER_POINT} фотографий на точку`,
      );
    }

    let maxOrder = 0;
    if (point.photos?.length) {
      maxOrder = Math.max(...point.photos.map((p) => p.sortOrder));
    }

    const needAspect = point.mediaAspectW == null || point.mediaAspectH == null;

    if (needAspect) {
      point.mediaAspectW = POINT_MEDIA_ASPECT_W;
      point.mediaAspectH = POINT_MEDIA_ASPECT_H;
      await this.pointsRepository.save(point);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = `/uploads/points/${file.filename}`;
      const dim = this.validateDimensionPair(
        dimensions[i]?.width,
        dimensions[i]?.height,
      );
      const row = this.pointPhotoRepository.create({
        pointId: point.id,
        url,
        sortOrder: maxOrder + 1 + i,
        width: dim?.w ?? null,
        height: dim?.h ?? null,
      });
      await this.pointPhotoRepository.save(row);
    }

    return this.findOne(pointId);
  }

  async deletePointPhoto(
    pointId: string,
    photoId: string,
    userId: number,
  ): Promise<PointEntity> {
    const owned = await this.pointsRepository.findOne({
      where: { id: pointId, authorId: userId },
    });
    if (!owned) {
      throw new ForbiddenException('Нет прав на удаление фотографии этой точки');
    }

    const photo = await this.pointPhotoRepository.findOne({
      where: { id: photoId, pointId },
    });

    if (!photo) {
      throw new NotFoundException('Фотография не найдена');
    }

    this.unlinkPhotoFile(photo.url);
    await this.pointPhotoRepository.remove(photo);

    const remaining = await this.pointPhotoRepository.count({
      where: { pointId },
    });

    if (remaining === 0) {
      await this.pointsRepository.update(pointId, {
        mediaAspectW: null,
        mediaAspectH: null,
      });
    }

    return this.findOne(pointId);
  }
}
