import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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

  async createContainer(createContainerDto: CreateContainerDto, userId: number) {
    // Создаем экземпляр контейнера
    const container = this.containerRepository.create({
      title: createContainerDto.title,
      description: createContainerDto.description,
      // Мы передаем объект с ID, чтобы TypeORM понял связь ManyToOne
      author: { id: userId } as any,
      authorId: userId,
    });

    return await this.containerRepository.save(container);
  }

  async updateContainer(id: string, updateContainerDto: UpdateContainerDto, userId: number) {
    const container = await this.containerRepository.findOne({ 
      where: { id, authorId: userId } 
    });

    if (!container) {
      throw new NotFoundException('Контейнер не найден или у вас нет прав на его редактирование');
    }

    Object.assign(container, updateContainerDto);
    return await this.containerRepository.save(container);
  }

  async removeContainer(id: string, userId: number) {
    const container = await this.containerRepository.findOne({ 
      where: { id, authorId: userId } 
    });

    if (!container) {
      throw new NotFoundException('Контейнер не найден или у вас нет прав на удаление');
    }

    // ТАК КАК В PointEntity стоит onDelete: 'CASCADE', 
    // база данных сама удалит все связанные точки при удалении контейнера.
    await this.containerRepository.remove(container);
    
    return { message: 'Контейнер и все связанные точки успешно удалены' };
  }

  async findAll(userId: number) {
    return await this.containerRepository.find({
      where: [
        { authorId: userId }, // Личные контейнеры пользователя
        { authorId: IsNull() }        // + Системные контейнеры (общие)
      ],
      relations: ['author'],
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

  // Методы для админки
  async findAllWithPagination(options: {
    skip?: number;
    take?: number;
    order?: any;
    relations?: string[];
  }): Promise<[Container[], number]> {
    return this.containerRepository.findAndCount({
      skip: options.skip || 0,
      take: options.take || 10,
      order: options.order || { createdAt: 'DESC' },
      relations: options.relations || ['author'],
    });
  }

  // Админские методы (без проверки владельца)
  async update(id: string, updateData: any): Promise<Container> {
    const container = await this.findOne(id);
    Object.assign(container, updateData);
    return this.containerRepository.save(container);
  }

  // Админский метод создания
  // Админский метод создания
  async create(createData: any): Promise<Container> {
    const newContainer = this.containerRepository.create(createData);
    return await this.containerRepository.save(newContainer) as unknown as Container;
  }

  async remove(id: string): Promise<void> {
    const container = await this.findOne(id);
    await this.containerRepository.remove(container);
  }
}