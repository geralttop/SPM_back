import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserVerificationRequest } from './entities/user-verification-request.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(UserVerificationRequest)
    private readonly requestsRepository: Repository<UserVerificationRequest>,
    private readonly usersService: UsersService,
  ) {}

  async getMyRequest(userId: number): Promise<UserVerificationRequest | null> {
    return this.requestsRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async requestVerification(userId: number, payload: { reason: string; links?: string }): Promise<UserVerificationRequest> {
    const existingPending = await this.requestsRepository.findOne({ where: { userId, status: 'pending' } });
    if (existingPending) {
      existingPending.reason = payload.reason;
      existingPending.links = payload.links ?? null;
      return this.requestsRepository.save(existingPending);
    }

    const entity = this.requestsRepository.create({
      userId,
      reason: payload.reason,
      links: payload.links ?? null,
      status: 'pending',
      adminId: null,
      adminNote: null,
      decidedAt: null,
    });
    return this.requestsRepository.save(entity);
  }

  async revokeMyPending(userId: number): Promise<void> {
    const pending = await this.requestsRepository.findOne({ where: { userId, status: 'pending' } });
    if (!pending) return;
    await this.requestsRepository.remove(pending);
  }

  async adminList(options: {
    skip: number;
    take: number;
    status?: string;
  }): Promise<[UserVerificationRequest[], number]> {
    const qb = this.requestsRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.admin', 'admin')
      .orderBy('r.createdAt', 'DESC')
      .skip(options.skip)
      .take(options.take);

    if (options.status) {
      qb.andWhere('r.status = :status', { status: options.status });
    }

    return qb.getManyAndCount();
  }

  async adminGetOne(id: number): Promise<UserVerificationRequest> {
    const req = await this.requestsRepository.findOne({
      where: { id },
      relations: ['user', 'admin'],
    });
    if (!req) throw new NotFoundException('Заявка не найдена');
    return req;
  }

  async adminApprove(id: number, adminId: number): Promise<UserVerificationRequest> {
    const req = await this.adminGetOne(id);
    if (req.status !== 'pending') {
      throw new BadRequestException('Заявка уже обработана');
    }
    await this.usersService.update(req.userId, { isVerified: true });
    req.status = 'approved';
    req.adminId = adminId;
    req.decidedAt = new Date();
    return this.requestsRepository.save(req);
  }

  async adminReject(id: number, adminId: number, adminNote?: string): Promise<UserVerificationRequest> {
    const req = await this.adminGetOne(id);
    if (req.status !== 'pending') {
      throw new BadRequestException('Заявка уже обработана');
    }
    req.status = 'rejected';
    req.adminId = adminId;
    req.adminNote = adminNote ?? null;
    req.decidedAt = new Date();
    return this.requestsRepository.save(req);
  }
}

