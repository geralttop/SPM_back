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
    private categoryRepository: Repository<Category>) { }
    async createCategory(createCategoryDto: CreateCategoryDto, userId: number) {
        const category = this.categoryRepository.create({
            name: createCategoryDto.name,
            color: createCategoryDto.color,
            author: { id: userId } as any,
            authorId: userId,
        });
        return await this.categoryRepository.save(category);
    }
    async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
        const category = await this.categoryRepository.findOne({
            where: { id, authorId: userId }
        });
        if (!category) {
            throw new NotFoundException('Категория не найдена или это системная категория, которую нельзя менять');
        }
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
            where: { id, authorId: userId },
            relations: ['points']
        });
        if (!category) {
            throw new NotFoundException('Вы не можете удалить эту категорию');
        }
        const pointsCount = category.points?.length || 0;
        await this.categoryRepository.remove(category);
        return {
            message: pointsCount > 0
                ? `Категория успешно удалена. ${pointsCount} точек теперь без категории`
                : 'Категория успешно удалена'
        };
    }
    async findAll(userId: number) {
        return await this.categoryRepository.find({
            where: [
                { authorId: userId },
                { authorId: IsNull() }
            ],
            order: { name: 'ASC' }
        });
    }
    async findAllWithPagination(options: {
        skip?: number;
        take?: number;
        order?: any;
        relations?: string[];
    }): Promise<[
        Category[],
        number
    ]> {
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
    async update(id: number, updateData: any): Promise<Category> {
        const category = await this.findOne(id);
        Object.assign(category, updateData);
        return this.categoryRepository.save(category);
    }
    async create(createData: any): Promise<Category> {
        const newCategory = this.categoryRepository.create(createData);
        return await this.categoryRepository.save(newCategory) as unknown as Category;
    }
    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);
        await this.categoryRepository.remove(category);
    }
}
