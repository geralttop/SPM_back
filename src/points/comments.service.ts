import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { PointEntity } from './entities/point.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
  ) {}

  async create(pointId: string, createCommentDto: CreateCommentDto, userId: number) {
    // Проверяем, существует ли точка
    const point = await this.pointsRepository.findOne({ where: { id: pointId } });
    if (!point) {
      throw new NotFoundException(`Точка с ID ${pointId} не найдена`);
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      pointId,
      authorId: userId,
    });

    const savedComment = await this.commentsRepository.save(comment);
    
    // Загружаем комментарий с автором
    return await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author'],
    });
  }

  async findByPoint(pointId: string) {
    return await this.commentsRepository.find({
      where: { pointId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number) {
    return await this.commentsRepository.find({
      where: { authorId: userId },
      relations: ['author', 'point'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number) {
    const comment = await this.commentsRepository.findOne({ 
      where: { id },
      relations: ['author'],
    });
    
    if (!comment) {
      throw new NotFoundException(`Комментарий с ID ${id} не найден`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('У вас нет прав на редактирование этого комментария');
    }

    comment.content = updateCommentDto.content;
    return await this.commentsRepository.save(comment);
  }

  async remove(id: number, userId: number) {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    
    if (!comment) {
      throw new NotFoundException(`Комментарий с ID ${id} не найден`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('У вас нет прав на удаление этого комментария');
    }

    await this.commentsRepository.remove(comment);
    return { message: 'Комментарий успешно удален' };
  }
}
