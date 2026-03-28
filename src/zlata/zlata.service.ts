import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { In, Repository } from 'typeorm';
import { ZlataAssetEntity } from './entities/zlata-asset.entity';
import { ZlataAssetTagEntity } from './entities/zlata-asset-tag.entity';
import { ZlataTagEntity } from './entities/zlata-tag.entity';
import { AttachTagDto } from './dto/attach-tag.dto';
import { ZlataAssetResponseDto, ZlataTagBriefDto } from './dto/zlata-asset-response.dto';

@Injectable()
export class ZlataService {
  constructor(
    @InjectRepository(ZlataAssetEntity)
    private readonly assetRepo: Repository<ZlataAssetEntity>,
    @InjectRepository(ZlataTagEntity)
    private readonly tagRepo: Repository<ZlataTagEntity>,
    @InjectRepository(ZlataAssetTagEntity)
    private readonly assetTagRepo: Repository<ZlataAssetTagEntity>,
  ) {}

  private normalizeTagName(raw: string): string {
    return raw.trim().toLowerCase();
  }

  private parseTagsQuery(tagsParam?: string): string[] {
    if (!tagsParam?.trim()) {
      return [];
    }
    const parts = tagsParam.split(',').map((t) => this.normalizeTagName(t)).filter(Boolean);
    return [...new Set(parts)];
  }

  private toAssetDto(asset: ZlataAssetEntity): ZlataAssetResponseDto {
    const tags: ZlataTagBriefDto[] = (asset.assetTags ?? [])
      .map((at) => at.tag)
      .filter(Boolean)
      .map((t) => ({ id: t.id, name: t.name }));

    return {
      id: asset.id,
      url: `/uploads/${asset.filePath}`,
      createdAt: asset.createdAt,
      uploaderId: asset.uploaderId,
      tags,
    };
  }

  async findAssetsWithTags(tagsQuery?: string): Promise<ZlataAssetResponseDto[]> {
    const tagNames = this.parseTagsQuery(tagsQuery);

    let where: { id: ReturnType<typeof In> } | undefined;
    if (tagNames.length > 0) {
      const rows: Array<{ id: string }> = await this.assetRepo.manager.query(
        `
        SELECT j."assetId" AS id
        FROM "metadata"."zlata_asset_tag" j
        INNER JOIN "metadata"."zlata_tag" t ON t.id = j."tagId"
        WHERE LOWER(t.name) = ANY($1::text[])
        GROUP BY j."assetId"
        HAVING COUNT(DISTINCT t.id) = $2
        `,
        [tagNames, tagNames.length],
      );
      const ids = rows.map((r) => r.id);
      if (ids.length === 0) {
        return [];
      }
      where = { id: In(ids) };
    }

    const assets = await this.assetRepo.find({
      where,
      relations: ['assetTags', 'assetTags.tag'],
      order: { createdAt: 'DESC' },
    });
    return assets.map((a) => this.toAssetDto(a));
  }

  async findAllTags(): Promise<Array<{ id: number; name: string }>> {
    const rows = await this.tagRepo.find({ order: { name: 'ASC' } });
    return rows.map((t) => ({ id: t.id, name: t.name }));
  }

  async createTag(name: string): Promise<{ id: number; name: string }> {
    const normalized = this.normalizeTagName(name);
    if (!normalized) {
      throw new BadRequestException('Пустое имя тега');
    }

    const existing = await this.tagRepo
      .createQueryBuilder('t')
      .where('LOWER(t.name) = :n', { n: normalized })
      .getOne();

    if (existing) {
      return { id: existing.id, name: existing.name };
    }

    const tag = this.tagRepo.create({ name: normalized });
    const saved = await this.tagRepo.save(tag);
    return { id: saved.id, name: saved.name };
  }

  async deleteTag(tagId: number): Promise<void> {
    const res = await this.tagRepo.delete({ id: tagId });
    if (!res.affected) {
      throw new NotFoundException('Тег не найден');
    }
  }

  async createAssets(
    uploaderId: number,
    filenames: string[],
  ): Promise<ZlataAssetResponseDto[]> {
    if (!filenames?.length) {
      throw new BadRequestException('Файлы не загружены');
    }

    const results: ZlataAssetResponseDto[] = [];
    for (const filename of filenames) {
      const filePath = `zlata/${filename}`;
      const asset = this.assetRepo.create({
        filePath,
        uploaderId,
      });
      const saved = await this.assetRepo.save(asset);
      const full = await this.assetRepo.findOne({
        where: { id: saved.id },
        relations: ['assetTags', 'assetTags.tag'],
      });
      results.push(this.toAssetDto(full!));
    }
    return results;
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('Файл не найден');
    }

    await this.assetRepo.remove(asset);
    this.unlinkUploadFile(asset.filePath);
  }

  private unlinkUploadFile(filePath: string): void {
    const relative = path.join('uploads', filePath);
    const full = path.join(process.cwd(), relative);
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
    }
  }

  async attachTag(assetId: string, dto: AttachTagDto): Promise<ZlataAssetResponseDto> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('Файл не найден');
    }

    let tagId = dto.tagId;
    if (tagId != null && dto.name != null && String(dto.name).trim() !== '') {
      throw new BadRequestException('Укажите только tagId или только name');
    }
    if (tagId == null && dto.name != null && String(dto.name).trim() !== '') {
      const created = await this.createTag(dto.name);
      tagId = created.id;
    }

    if (tagId == null) {
      throw new BadRequestException('Укажите tagId или name');
    }

    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException('Тег не найден');
    }

    const existing = await this.assetTagRepo.findOne({
      where: { assetId, tagId: tag.id },
    });
    if (!existing) {
      const link = this.assetTagRepo.create({ assetId, tagId: tag.id });
      await this.assetTagRepo.save(link);
    }

    const full = await this.assetRepo.findOne({
      where: { id: assetId },
      relations: ['assetTags', 'assetTags.tag'],
    });
    return this.toAssetDto(full!);
  }

  async detachTag(assetId: string, tagId: number): Promise<void> {
    const res = await this.assetTagRepo.delete({ assetId, tagId });
    if (!res.affected) {
      throw new NotFoundException('Связь не найдена');
    }
  }
}
