import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { User } from 'src/users/user.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { PointEntity } from 'src/points/entities/point.entity';
import { Comment } from 'src/points/entities/comment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBlock)
    private blockRepository: Repository<UserBlock>,
    @InjectRepository(PointEntity)
    private pointsRepository: Repository<PointEntity>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(createReportDto: CreateReportDto, reporterId: number): Promise<Report> {
    // Проверяем, что объект жалобы существует
    await this.validateReportTarget(createReportDto);

    // Проверяем, что пользователь не жалуется сам на себя
    if (createReportDto.type === 'user' && createReportDto.reportedUserId === reporterId) {
      throw new BadRequestException('Нельзя пожаловаться на самого себя');
    }

    // Проверяем, что пользователь еще не жаловался на этот объект
    const existingReport = await this.findExistingReport(createReportDto, reporterId);
    if (existingReport) {
      if (createReportDto.type === 'user') {
        throw new BadRequestException(`Вы уже подавали жалобу на этого пользователя по причине "${createReportDto.reason}"`);
      } else {
        throw new BadRequestException('Вы уже подавали жалобу на этот объект');
      }
    }

    const report = this.reportsRepository.create({
      ...createReportDto,
      reporterId,
    });

    return this.reportsRepository.save(report);
  }

  async findAll(page: number = 1, limit: number = 20, status?: string) {
    const queryBuilder = this.reportsRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.point', 'point')
      .leftJoinAndSelect('point.author', 'pointAuthor')
      .leftJoinAndSelect('report.comment', 'comment')
      .leftJoinAndSelect('comment.author', 'commentAuthor')
      .leftJoinAndSelect('report.reportedUser', 'reportedUser')
      .leftJoinAndSelect('report.reviewedBy', 'reviewedBy')
      .orderBy('report.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('report.status = :status', { status });
    }

    const [reports, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: [
        'reporter', 
        'point', 
        'point.author',
        'comment', 
        'comment.author',
        'reportedUser', 
        'reviewedBy'
      ],
    });

    if (!report) {
      throw new NotFoundException('Жалоба не найдена');
    }

    return report;
  }

  async update(id: number, updateReportDto: UpdateReportDto, adminId: number): Promise<Report> {
    const report = await this.findOne(id);

    Object.assign(report, updateReportDto);
    report.reviewedById = adminId;

    return this.reportsRepository.save(report);
  }

  async remove(id: number): Promise<void> {
    const report = await this.findOne(id);
    await this.reportsRepository.remove(report);
  }

  // Действия админа по жалобам
  async resolveReport(id: number, adminId: number, action: 'block' | 'dismiss', adminNotes?: string): Promise<Report> {
    try {
      const report = await this.findOne(id);

      console.log(`Resolving report ${id} with action: ${action}`);
      console.log('Report data:', {
        type: report.type,
        hasPoint: !!report.point,
        hasComment: !!report.comment,
        reportedUserId: report.reportedUserId
      });

      switch (action) {
        case 'block':
          await this.blockReportedUser(report);
          report.status = 'resolved';
          break;
        case 'dismiss':
          report.status = 'dismissed';
          break;
      }

      report.reviewedById = adminId;
      if (adminNotes) {
        report.adminNotes = adminNotes;
      }

      const savedReport = await this.reportsRepository.save(report);
      console.log(`Report ${id} resolved successfully`);
      
      return savedReport;
    } catch (error) {
      console.error(`Error resolving report ${id}:`, error);
      throw error;
    }
  }

  private async validateReportTarget(createReportDto: CreateReportDto): Promise<void> {
    switch (createReportDto.type) {
      case 'point':
        const point = await this.pointsRepository.findOne({ where: { id: createReportDto.pointId } });
        if (!point) {
          throw new NotFoundException('Точка не найдена');
        }
        break;
      case 'comment':
        const comment = await this.commentsRepository.findOne({ where: { id: createReportDto.commentId } });
        if (!comment) {
          throw new NotFoundException('Комментарий не найден');
        }
        break;
      case 'user':
        const user = await this.usersRepository.findOne({ where: { id: createReportDto.reportedUserId } });
        if (!user) {
          throw new NotFoundException('Пользователь не найден');
        }
        break;
    }
  }

  private async findExistingReport(createReportDto: CreateReportDto, reporterId: number): Promise<Report | null> {
      const where: any = { 
        reporterId,
        // Проверяем только активные жалобы (не resolved и не dismissed)
        status: 'pending'
      };

      switch (createReportDto.type) {
        case 'point':
          where.pointId = createReportDto.pointId;
          // Для точек и комментариев - одна жалоба на объект
          return this.reportsRepository.findOne({ where });
        case 'comment':
          where.commentId = createReportDto.commentId;
          // Для точек и комментариев - одна жалоба на объект
          return this.reportsRepository.findOne({ where });
        case 'user':
          where.reportedUserId = createReportDto.reportedUserId;
          where.reason = createReportDto.reason;
          // Для пользователей - можно подавать разные жалобы с разными причинами
          return this.reportsRepository.findOne({ where });
      }
    }

  private async deleteReportedContent(report: Report): Promise<void> {
    // Удалено - функциональность удаления больше не используется
  }

  private async blockReportedUser(report: Report): Promise<void> {
    try {
      let userId: number;

      switch (report.type) {
        case 'user':
          userId = report.reportedUserId;
          break;
        case 'point':
          userId = report.point?.authorId;
          break;
        case 'comment':
          userId = report.comment?.authorId;
          break;
      }

      if (userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (user) {
          console.log(`Blocking user with id: ${userId}`);
          
          let block = await this.blockRepository.findOne({ where: { userId } });
          if (!block) {
            block = this.blockRepository.create({ userId });
          }
          
          block.isBlocked = true;
          block.blockedAt = new Date();
          block.blockReason = `Заблокирован по жалобе #${report.id}: ${report.reason}`;
          await this.blockRepository.save(block);
        } else {
          console.log('User not found for blocking');
        }
      } else {
        console.log('No user ID found for blocking');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new Error(`Не удалось заблокировать пользователя: ${error.message}`);
    }
  }
}