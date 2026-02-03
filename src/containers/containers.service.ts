import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Container } from './entities/container.entity';
import { CreateContainerDto } from './dto/create-container.dto';
import { User } from 'src/users/user.entity';
import { UpdateContainerDto } from './dto/update-container.dto';

@Injectable()
export class ContainersService {
  constructor(
    @InjectRepository(Container)
    private readonly containerRepository: Repository<Container>,
  ) {}

  async create(createContainerDto: CreateContainerDto, userId: number) {
    // Создаем экземпляр контейнера
    const container = this.containerRepository.create({
      title: createContainerDto.title,
      description: createContainerDto.description,
      // Мы передаем объект с ID, чтобы TypeORM понял связь ManyToOne
      author: { id: userId } as any, 
    });

    return await this.containerRepository.save(container);
  }

  async update(id: string, updateContainerDto: UpdateContainerDto, userId: number) {
    const container = await this.containerRepository.findOne({ 
      where: { id, author: { id: userId } } 
    });

    if (!container) {
      throw new NotFoundException('Контейнер не найден или у вас нет прав на его редактирование');
    }

    Object.assign(container, updateContainerDto);
    return await this.containerRepository.save(container);
  }

  async remove(id: string, userId: number) {
    const container = await this.containerRepository.findOne({ 
      where: { id, author: { id: userId } } 
    });

    if (!container) {
      throw new NotFoundException('Контейнер не найден или у вас нет прав на удаление');
    }

    // ТАК КАК В PointEntity стоит onDelete: 'CASCADE', 
    // база данных сама удалит все связанные точки при удалении контейнера.
    await this.containerRepository.remove(container);
    
    return { message: 'Контейнер и все связанные точки успешно удалены' };
  }

  async findAll() {
    return await this.containerRepository.find({
      relations: ['author', 'points'], // Чтобы видеть, кто создал и какие точки внутри
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const container = await this.containerRepository.findOne({
      where: { id },
      relations: ['author', 'points', 'points.category'], // Глубокая загрузка со связями
    });
    if (!container) throw new NotFoundException('Контейнер не найден');
    return container;
  }
}