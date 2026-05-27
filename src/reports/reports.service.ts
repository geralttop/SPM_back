import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { User } from 'src/users/user.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { PointEntity } from 'src/points/entities/point.entity';
import { Comment } from 'src/points/entities/comment.entity';
import { PointsService } from '../points/points.service';
import { toPublicAuthor } from '../users/user-public.mapper';
@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
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
    private commentsRepository: Repository<Comment>, private readonly pointsService: PointsService) { }
    private async enrichReportNestedAuthors(reports: Report[]): Promise<void> {
        const authorIds: number[] = [];
        for (const r of reports) {
            if (r.point?.authorId != null)
                authorIds.push(r.point.authorId);
            if (r.comment?.authorId != null)
                authorIds.push(r.comment.authorId);
        }
        const countMap = await this.pointsService.getCreatedPointsCountsByAuthorIds(authorIds);
        for (const r of reports) {
            if (r.point?.author) {
                const cnt = countMap.get(r.point.authorId) ?? 0;
                (r.point as unknown as {
                    author: ReturnType<typeof toPublicAuthor>;
                }).author =
                    toPublicAuthor(r.point.author, cnt);
            }
            if (r.comment?.author) {
                const cnt = countMap.get(r.comment.authorId) ?? 0;
                (r.comment as unknown as {
                    author: ReturnType<typeof toPublicAuthor>;
                }).author =
                    toPublicAuthor(r.comment.author, cnt);
            }
        }
    }
    private async loadReportEntity(id: number): Promise<Report> {
        const report = await this.reportsRepository.findOne({
            where: { id },
            relations: [
                'reporter',
                'point',
                'point.author',
                'comment',
                'comment.author',
                'reportedUser',
                'reviewedBy',
            ],
        });
        if (!report) {
            throw new NotFoundException('Жалоба не найдена');
        }
        return report;
    }
    async create(createReportDto: CreateReportDto, reporterId: number): Promise<Report> {
        await this.validateReportTarget(createReportDto);
        if (createReportDto.type === 'user' && createReportDto.reportedUserId === reporterId) {
            throw new BadRequestException('Нельзя пожаловаться на самого себя');
        }
        const existingReport = await this.findExistingReport(createReportDto, reporterId);
        if (existingReport) {
            if (createReportDto.type === 'user') {
                throw new BadRequestException(`Вы уже подавали жалобу на этого пользователя по причине "${createReportDto.reason}"`);
            }
            else {
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
        await this.enrichReportNestedAuthors(reports);
        return {
            reports,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id: number): Promise<Report> {
        const report = await this.loadReportEntity(id);
        await this.enrichReportNestedAuthors([report]);
        return report;
    }
    async update(id: number, updateReportDto: UpdateReportDto, adminId: number): Promise<Report> {
        const report = await this.loadReportEntity(id);
        Object.assign(report, updateReportDto);
        report.reviewedById = adminId;
        await this.reportsRepository.save(report);
        return this.findOne(id);
    }
    async remove(id: number): Promise<void> {
        const report = await this.loadReportEntity(id);
        await this.reportsRepository.remove(report);
    }
    async resolveReport(id: number, adminId: number, action: 'block' | 'dismiss', adminNotes?: string): Promise<Report> {
        try {
            const report = await this.loadReportEntity(id);
            this.logger.log(`Resolving report ${id} with action: ${action}`);
            this.logger.log(`Report data: ${JSON.stringify({
                type: report.type,
                hasPoint: !!report.point,
                hasComment: !!report.comment,
                reportedUserId: report.reportedUserId
            })}`);
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
            await this.reportsRepository.save(report);
            this.logger.log(`Report ${id} resolved successfully`);
            return this.findOne(id);
        }
        catch (error) {
            this.logger.error(`Error resolving report ${id}`, error?.stack);
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
            status: 'pending'
        };
        switch (createReportDto.type) {
            case 'point':
                where.pointId = createReportDto.pointId;
                return this.reportsRepository.findOne({ where });
            case 'comment':
                where.commentId = createReportDto.commentId;
                return this.reportsRepository.findOne({ where });
            case 'user':
                where.reportedUserId = createReportDto.reportedUserId;
                where.reason = createReportDto.reason;
                return this.reportsRepository.findOne({ where });
        }
    }
    private async deleteReportedContent(report: Report): Promise<void> {
    }
    private async blockReportedUser(report: Report): Promise<void> {
        try {
            let userId: number | undefined;
            switch (report.type) {
                case 'user':
                    userId = report.reportedUserId ?? undefined;
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
                    this.logger.log(`Blocking user with id: ${userId}`);
                    let block = await this.blockRepository.findOne({ where: { userId } });
                    if (!block) {
                        block = this.blockRepository.create({ userId });
                    }
                    block.isBlocked = true;
                    block.blockedAt = new Date();
                    block.blockReason = `Заблокирован по жалобе #${report.id}: ${report.reason}`;
                    await this.blockRepository.save(block);
                }
                else {
                    this.logger.warn('User not found for blocking');
                }
            }
            else {
                this.logger.warn('No user ID found for blocking');
            }
        }
        catch (error) {
            this.logger.error('Error blocking user', error?.stack);
            throw new Error(`Не удалось заблокировать пользователя: ${error.message}`);
        }
    }
}
