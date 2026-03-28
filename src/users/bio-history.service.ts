import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBioHistory } from './entities/user-bio-history.entity';

export type BioHistoryItemDto = {
  id: number;
  text: string;
  createdAt: Date;
};

@Injectable()
export class BioHistoryService {
  constructor(
    @InjectRepository(UserBioHistory)
    private readonly repo: Repository<UserBioHistory>,
  ) {}

  async record(userId: number, bioText: string): Promise<UserBioHistory> {
    const row = this.repo.create({
      userId,
      bioText: bioText.slice(0, 500),
    });
    return this.repo.save(row);
  }

  async findByUserId(userId: number): Promise<BioHistoryItemDto[]> {
    const rows = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => ({
      id: r.id,
      text: r.bioText,
      createdAt: r.createdAt,
    }));
  }

  async deleteByIdForUser(entryId: number, userId: number): Promise<void> {
    const row = await this.repo.findOne({ where: { id: entryId } });
    if (!row) {
      throw new NotFoundException('Запись истории не найдена');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('Нельзя удалить чужую запись');
    }
    await this.repo.remove(row);
  }
}
