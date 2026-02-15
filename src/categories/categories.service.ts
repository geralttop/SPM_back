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

  async create(createCategoryDto: CreateCategoryDto, userId: number) {
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

  async update(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
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

  async remove(id: number, userId: number) {
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
}