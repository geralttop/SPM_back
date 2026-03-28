import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { VinlandAssetEntity } from './entities/vinland-asset.entity';
import { VinlandAssetResponseDto } from './dto/vinland-asset-response.dto';
import { MAX_VINLAND_CAPTION_LENGTH } from './vinland.constants';

@Injectable()
export class VinlandService {
  constructor(
    @InjectRepository(VinlandAssetEntity)
    private readonly assetRepo: Repository<VinlandAssetEntity>,
  ) {}

  private toDto(entity: VinlandAssetEntity): VinlandAssetResponseDto {
    return {
      id: entity.id,
      url: `/uploads/${entity.filePath}`,
      caption: entity.caption,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      uploaderId: entity.uploaderId,
    };
  }

  async findAll(): Promise<VinlandAssetResponseDto[]> {
    const rows = await this.assetRepo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async createAssets(
    uploaderId: number,
    filenames: string[],
  ): Promise<VinlandAssetResponseDto[]> {
    if (!filenames?.length) {
      throw new BadRequestException('Файлы не загружены');
    }

    return this.assetRepo.manager.transaction(async (em) => {
      const raw: { mx: string | null } | undefined = await em
        .createQueryBuilder()
        .select('MAX(a.sortOrder)', 'mx')
        .from(VinlandAssetEntity, 'a')
        .getRawOne();
      const maxOrder = raw?.mx != null ? parseInt(raw.mx, 10) : -1;
      let next = maxOrder + 1;
      const results: VinlandAssetResponseDto[] = [];

      for (const filename of filenames) {
        const filePath = `vinland/${filename}`;
        const entity = em.create(VinlandAssetEntity, {
          filePath,
          uploaderId,
          sortOrder: next,
          caption: null,
        });
        const saved = await em.save(entity);
        results.push(this.toDto(saved));
        next += 1;
      }
      return results;
    });
  }

  async reorder(orderedIds: string[]): Promise<VinlandAssetResponseDto[]> {
    const allRows = await this.assetRepo.find({ select: ['id'] });
    const dbIds = new Set(allRows.map((r) => r.id));

    if (dbIds.size !== orderedIds.length) {
      throw new BadRequestException(
        'Список id должен содержать ровно все изображения и не содержать лишних',
      );
    }

    const seen = new Set<string>();
    for (const id of orderedIds) {
      if (!dbIds.has(id)) {
        throw new BadRequestException(`Неизвестный id: ${id}`);
      }
      if (seen.has(id)) {
        throw new BadRequestException('Повторяющиеся id в списке');
      }
      seen.add(id);
    }

    await this.assetRepo.manager.transaction(async (em) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await em.update(VinlandAssetEntity, { id: orderedIds[i] }, { sortOrder: i });
      }
    });

    return this.findAll();
  }

  async updateCaption(
    id: string,
    caption: string | null | undefined,
  ): Promise<VinlandAssetResponseDto> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Изображение не найдено');
    }

    let next: string | null;
    if (caption === undefined) {
      next = asset.caption;
    } else if (caption === null) {
      next = null;
    } else {
      const t = caption.trim();
      if (t.length > MAX_VINLAND_CAPTION_LENGTH) {
        throw new BadRequestException('Подпись слишком длинная');
      }
      next = t.length ? t : null;
    }

    asset.caption = next;
    await this.assetRepo.save(asset);
    return this.toDto(asset);
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Изображение не найдено');
    }

    await this.assetRepo.remove(asset);
    this.unlinkUploadFile(asset.filePath);
  }

  private unlinkUploadFile(filePath: string): void {
    const full = path.join(process.cwd(), 'uploads', filePath);
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
    }
  }
}
