import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointEntity } from './entities/point.entity';
import { CreatePointDto } from './dto/create-point.dto';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
  ) {}

  async create(createPointDto: CreatePointDto) {
    const { lng, lat, ...rest } = createPointDto;

    const newPoint = this.pointsRepository.create({
      ...rest,
      coords: {
        type: 'Point',
        coordinates: [lng, lat], // PostGIS: [Долгота, Широта]
      },
    });

    return await this.pointsRepository.save(newPoint);
  }

  // Метод для получения всех точек (чтобы проверить результат)
  async findAll() {
    return await this.pointsRepository.find();
  }
}