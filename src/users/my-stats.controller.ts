import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { PointEntity } from '../points/entities/point.entity';
import { Comment } from '../points/entities/comment.entity';
import { Favorite } from '../points/entities/favorite.entity';
import { Category } from '../categories/entities/category.entity';
import { Container } from '../containers/entities/container.entity';
import { MyStatsDto } from './dto/my-stats.dto';

@ApiTags('Статистика')
@Controller('users/me')
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class MyStatsController {
  constructor(
    @InjectRepository(PointEntity)
    private readonly pointsRepository: Repository<PointEntity>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Container)
    private readonly containersRepository: Repository<Container>,
  ) {}

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Моя статистика', description: 'Агрегированные метрики текущего пользователя.' })
  @ApiOkResponse({ type: MyStatsDto })
  async getMyStats(@CurrentUserId() userId: number): Promise<MyStatsDto> {
    const [pointsCreated, commentsCreated, favoritesCount, categoriesCreated, containersCreated] =
      await Promise.all([
        this.pointsRepository.count({ where: { authorId: userId } }),
        this.commentsRepository.count({ where: { authorId: userId } }),
        this.favoritesRepository
          .createQueryBuilder('favorite')
          .where('favorite.userId = :userId', { userId })
          .getCount(),
        this.categoriesRepository.count({ where: { authorId: userId } }),
        this.containersRepository.count({ where: { authorId: userId } }),
      ]);

    return {
      pointsCreated,
      commentsCreated,
      favoritesCount,
      categoriesCreated,
      containersCreated,
    };
  }
}

