import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ZlataAssetTagEntity } from './zlata-asset-tag.entity';

@Entity({ schema: 'metadata', name: 'zlata_asset' })
export class ZlataAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Относительный путь от каталога uploads, например zlata/uuid.jpg */
  @Column({ type: 'varchar', length: 512 })
  filePath: string;

  @CreateDateColumn()
  createdAt: Date;

  /** Без FK на users — только идентификатор */
  @Column({ type: 'int' })
  uploaderId: number;

  @OneToMany(() => ZlataAssetTagEntity, (at) => at.asset)
  assetTags: ZlataAssetTagEntity[];
}
