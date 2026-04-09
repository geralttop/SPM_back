import { Injectable, NotFoundException, BadRequestException, ForbiddenException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Container } from './entities/container.entity';
import { CreateContainerDto } from './dto/create-container.dto';
import { User } from 'src/users/user.entity';
import { UpdateContainerDto } from './dto/update-container.dto';
import { PointsService } from '../points/points.service';
@Injectable()
export class ContainersService {
    constructor(
    @InjectRepository(Container)
    private readonly containerRepository: Repository<Container>, private readonly pointsService: PointsService) { }
    async createContainer(createContainerDto: CreateContainerDto, userId: number) {
        const container = this.containerRepository.create({
            title: createContainerDto.title,
            description: createContainerDto.description,
            color: createContainerDto.color,
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
            where: { id, authorId: userId },
            relations: ['points']
        });
        if (!container) {
            throw new NotFoundException('Контейнер не найден или у вас нет прав на удаление');
        }
        const pointsCount = container.points?.length || 0;
        await this.containerRepository.remove(container);
        return {
            message: pointsCount > 0
                ? `Контейнер успешно удален. ${pointsCount} точек теперь без контейнера`
                : 'Контейнер успешно удален'
        };
    }
    async findAll(userId: number) {
        return await this.containerRepository.find({
            where: [
                { authorId: userId },
                { authorId: IsNull() }
            ],
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id: string) {
        const container = await this.containerRepository.findOne({
            where: { id },
            relations: ['author', 'points', 'points.category'],
        });
        if (!container)
            throw new NotFoundException('Контейнер не найден');
        return container;
    }
    async findForShareMap(id: string) {
        const container = await this.containerRepository.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!container) {
            throw new NotFoundException('Контейнер не найден');
        }
        if (container.authorId == null) {
            throw new ForbiddenException('Системный контейнер нельзя открыть по ссылке');
        }
        const points = await this.pointsService.findByContainerForMap(id);
        return { ...container, points };
    }
    async findAllWithPagination(options: {
        skip?: number;
        take?: number;
        order?: any;
        relations?: string[];
    }): Promise<[
        Container[],
        number
    ]> {
        return this.containerRepository.findAndCount({
            skip: options.skip || 0,
            take: options.take || 10,
            order: options.order || { createdAt: 'DESC' },
            relations: options.relations || ['author'],
        });
    }
    async update(id: string, updateData: any): Promise<Container> {
        const container = await this.findOne(id);
        Object.assign(container, updateData);
        return this.containerRepository.save(container);
    }
    async create(createData: any): Promise<Container> {
        const newContainer = this.containerRepository.create(createData);
        return await this.containerRepository.save(newContainer) as unknown as Container;
    }
    async remove(id: string): Promise<void> {
        const container = await this.findOne(id);
        await this.containerRepository.remove(container);
    }
}
