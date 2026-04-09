import { Injectable, ForbiddenException, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PointEntity } from './entities/point.entity';
import { PointHistoryEntity } from './entities/point-history.entity';
import { PointHistoryPhotoEntity } from './entities/point-history-photo.entity';
export type PointHistoryPhotoDto = {
    id: string;
    url: string;
    sortOrder: number;
    width: number | null;
    height: number | null;
    createdAt: Date;
};
export type PointHistoryEntryDto = {
    id: string;
    pointId: string;
    description: string | null;
    createdAt: Date;
    photos: PointHistoryPhotoDto[];
};
@Injectable()
export class PointHistoryService {
    private static readonly HISTORY_UPLOAD_DIR = './uploads/point-history';
    constructor(
    @InjectRepository(PointEntity)
    private readonly pointsRepo: Repository<PointEntity>, 
    @InjectRepository(PointHistoryEntity)
    private readonly historyRepo: Repository<PointHistoryEntity>, 
    @InjectRepository(PointHistoryPhotoEntity)
    private readonly historyPhotosRepo: Repository<PointHistoryPhotoEntity>) { }
    private mapEntry(row: PointHistoryEntity): PointHistoryEntryDto {
        const photos = [...(row.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
        return {
            id: row.id,
            pointId: row.pointId,
            description: row.description ?? null,
            createdAt: row.createdAt,
            photos: photos.map((p) => ({
                id: p.id,
                url: p.url,
                sortOrder: p.sortOrder,
                width: p.width ?? null,
                height: p.height ?? null,
                createdAt: p.createdAt,
            })),
        };
    }
    async list(pointId: string): Promise<PointHistoryEntryDto[]> {
        const rows = await this.historyRepo.find({
            where: { pointId },
            relations: ['photos'],
            order: { createdAt: 'DESC' },
        });
        return rows.map((r) => this.mapEntry(r));
    }
    private resolveUrlToFilePath(url: string): string {
        const relative = url.startsWith('/') ? url.slice(1) : url;
        return path.join(process.cwd(), relative);
    }
    private ensureHistoryUploadDir(): void {
        fs.mkdirSync(PointHistoryService.HISTORY_UPLOAD_DIR, { recursive: true });
    }
    private copyPointPhotoToHistory(sourceUrl: string): string {
        const sourcePath = this.resolveUrlToFilePath(sourceUrl);
        if (!fs.existsSync(sourcePath)) {
            throw new NotFoundException('Файл фотографии не найден');
        }
        this.ensureHistoryUploadDir();
        const ext = path.extname(sourcePath) || path.extname(sourceUrl) || '.jpg';
        const destName = `${uuidv4()}${ext}`;
        const destPath = path.join(process.cwd(), PointHistoryService.HISTORY_UPLOAD_DIR, destName);
        fs.copyFileSync(sourcePath, destPath);
        return `/uploads/point-history/${destName}`;
    }
    private unlinkHistoryPhotoFile(url: string): void {
        const full = this.resolveUrlToFilePath(url);
        if (fs.existsSync(full)) {
            fs.unlinkSync(full);
        }
    }
    async createSnapshot(pointId: string, userId: number): Promise<PointHistoryEntity> {
        const point = await this.pointsRepo.findOne({
            where: { id: pointId },
            relations: ['photos'],
        });
        if (!point) {
            throw new NotFoundException('Точка не найдена');
        }
        if (point.authorId !== userId) {
            throw new ForbiddenException('Нет прав на добавление записи истории');
        }
        const history = this.historyRepo.create({
            pointId: point.id,
            authorId: userId,
            description: point.description ?? null,
        });
        const saved = await this.historyRepo.save(history);
        const sourcePhotos = [...(point.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
        if (sourcePhotos.length) {
            const rows = sourcePhotos.map((ph) => {
                const copiedUrl = this.copyPointPhotoToHistory(ph.url);
                return this.historyPhotosRepo.create({
                    historyId: saved.id,
                    url: copiedUrl,
                    sortOrder: ph.sortOrder,
                    width: ph.width ?? null,
                    height: ph.height ?? null,
                });
            });
            await this.historyPhotosRepo.save(rows);
        }
        return this.historyRepo.findOneOrFail({
            where: { id: saved.id },
            relations: ['photos'],
        });
    }
    async deleteEntry(pointId: string, historyId: string, userId: number): Promise<void> {
        const row = await this.historyRepo.findOne({
            where: { id: historyId, pointId },
            relations: ['photos'],
        });
        if (!row) {
            throw new NotFoundException('Запись истории не найдена');
        }
        if (row.authorId !== userId) {
            throw new ForbiddenException('Нельзя удалить чужую запись');
        }
        if (row.photos?.length) {
            for (const ph of row.photos) {
                this.unlinkHistoryPhotoFile(ph.url);
            }
        }
        await this.historyRepo.remove(row);
    }
}
