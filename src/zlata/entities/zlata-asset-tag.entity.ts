import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { ZlataAssetEntity } from './zlata-asset.entity';
import { ZlataTagEntity } from './zlata-tag.entity';

@Entity({ schema: 'metadata', name: 'zlata_asset_tag' })
export class ZlataAssetTagEntity {
  @PrimaryColumn('uuid')
  assetId: string;

  @PrimaryColumn()
  tagId: number;

  @ManyToOne(() => ZlataAssetEntity, (a) => a.assetTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: ZlataAssetEntity;

  @ManyToOne(() => ZlataTagEntity, (t) => t.assetTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: ZlataTagEntity;
}
