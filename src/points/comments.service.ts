import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { PointEntity } from './entities/point.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PointsService } from './points.service';
import { toPublicAuthor } from '../users/user-public.mapper';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
    private readonly pointsService: PointsService,
  ) {}

  private async enrichCommentAuthors(comments: Comment[]): Promise<void> {
    const ids = comments.map((c) => c.authorId).filter((id) => id != null);
    const countMap = await this.pointsService.getCreatedPointsCountsByAuthorIds(ids);
    for (const c of comments) {
      if (c.author) {
        const cnt = countMap.get(c.author.id) ?? 0;
        (c as unknown as { author: ReturnType<typeof toPublicAuthor> }).author =
          toPublicAuthor(c.author, cnt);
      }
    }
  }

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
    const withAuthor = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author'],
    });
    if (withAuthor) await this.enrichCommentAuthors([withAuthor]);
    return withAuthor;
  }

  async findByPoint(pointId: string) {
    const comments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoin('user_blocks', 'block', 'block.userId = author.id')
      .where('comment.pointId = :pointId', { pointId })
      .andWhere('(block.isBlocked IS NULL OR block.isBlocked = :isBlocked)', {
        isBlocked: false,
      })
      .orderBy('comment.createdAt', 'DESC')
      .getMany();
    await this.enrichCommentAuthors(comments);
    return comments;
  }

  async findByUser(userId: number) {
    const comments = await this.commentsRepository.find({
      where: { authorId: userId },
      relations: ['author', 'point'],
      order: { createdAt: 'DESC' },
    });
    await this.enrichCommentAuthors(comments);
    return comments;
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
    const saved = await this.commentsRepository.save(comment);
    const withAuthor = await this.commentsRepository.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
    if (withAuthor) await this.enrichCommentAuthors([withAuthor]);
    return withAuthor;
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
