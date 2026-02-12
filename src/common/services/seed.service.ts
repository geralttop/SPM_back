import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Container } from '../../containers/entities/container.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Container)
    private containerRepository: Repository<Container>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultData();
  }

  private async seedDefaultData() {
    // Создаем системную категорию "Без категории"
    const defaultCategory = await this.categoryRepository.findOne({
      where: { name: 'Без категории', author: null }
    });

    if (!defaultCategory) {
      await this.categoryRepository.save({
        name: 'Без категории',
        icon: 'help-circle',
        color: '#6B7280',
        author: null, // Системная категория
      });
      console.log('✅ Создана системная категория "Без категории"');
    }

    // Создаем системный контейнер "Общее"
    const defaultContainer = await this.containerRepository.findOne({
      where: { title: 'Общее', author: null }
    });

    if (!defaultContainer) {
      await this.containerRepository.save({
        title: 'Общее',
        description: 'Общий контейнер для точек без специальной категоризации',
        author: null, // Системный контейнер
      });
      console.log('✅ Создан системный контейнер "Общее"');
    }
  }
}