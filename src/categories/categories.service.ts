import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User } from 'src/users/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto, userId: number) {
  // Создаем объект строго из DTO и привязываем ID пользователя
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      icon: createCategoryDto.icon,
      color: createCategoryDto.color,
      author: { id: userId } as any, // Передаем только ID как объект
      authorId: userId,
    });

    return await this.categoryRepository.save(category);
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
    const category = await this.categoryRepository.findOne({ 
      where: { id, authorId: userId } // Ищем только среди тех, где автор — текущий юзер
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена или это системная категория, которую нельзя менять');
    }

    // Проверка на уникальность имени среди своих категорий
    if (updateCategoryDto.name) {
      const existing = await this.categoryRepository.findOne({ 
        where: { name: updateCategoryDto.name, authorId: userId } 
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('У вас уже есть категория с таким названием');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async removeCategory(id: number, userId: number) {
    const category = await this.categoryRepository.findOne({ 
      where: { id, authorId: userId } 
    });

    if (!category) {
      throw new NotFoundException('Вы не можете удалить эту категорию');
    }

    return await this.categoryRepository.remove(category);
  }

  async findAll(userId: number) {
    return await this.categoryRepository.find({
      where: [
        { authorId: userId }, // Личные категории пользователя
        { authorId: IsNull() }        // + Системные категории (если они нужны)
      ],
      order: { name: 'ASC' }
    });
  }

  // Методы для админки
  async findAllWithPagination(options: {
    skip?: number;
    take?: number;
    order?: any;
    relations?: string[];
  }): Promise<[Category[], number]> {
    return this.categoryRepository.findAndCount({
      skip: options.skip || 0,
      take: options.take || 10,
      order: options.order || { id: 'ASC' },
      relations: options.relations || ['author'],
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    
    if (!category) {
      throw new NotFoundException(`Категория с ID ${id} не найдена`);
    }
    
    return category;
  }

  // Админские методы (без проверки владельца)
  async update(id: number, updateData: any): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateData);
    return this.categoryRepository.save(category);
  }

  // Админский метод создания
  async create(createData: any): Promise<Category> {
    const newCategory = this.categoryRepository.create(createData);
    return await this.categoryRepository.save(newCategory) as unknown as Category;
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}