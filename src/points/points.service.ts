import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createPointDto: CreatePointDto) {
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
    });

    return await this.pointsRepository.save(newPoint);
  }

  async update(id: string, updatePointDto: UpdatePointDto) {
  // 1. Ищем точку, если не нашли — 404
    const point = await this.pointsRepository.findOne({ where: { id } });
    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена`);
    }

    const { lng, lat, categoryId, containerId, ...rest } = updatePointDto;

    // 2. Применяем простые поля (имя, описание)
    Object.assign(point, rest);

    // 3. Если переданы новые координаты, обновляем объект coords
    if (lng !== undefined && lat !== undefined) {
      point.coords = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    // 4. Если передана новая категория
    if (categoryId) {
      point.category = { id: categoryId } as any;
    }

    // 5. Если передан новый контейнер
    if (containerId) {
      point.container = { id: containerId } as any;
    }

    return await this.pointsRepository.save(point);
  }

  async remove(id: string) {
    const point = await this.pointsRepository.findOne({ where: { id } });
    
    if (!point) {
      throw new NotFoundException(`Точка с ID ${id} не найдена`);
    }

    await this.pointsRepository.remove(point);
    
    return { message: `Точка ${id} успешно удалена` };
  }
  // Метод для получения всех точек (чтобы проверить результат)
  async findAll() {
    return await this.pointsRepository.find({
      relations: ['category', 'container'], // Подгружаем связанные данные
    });
  }
}