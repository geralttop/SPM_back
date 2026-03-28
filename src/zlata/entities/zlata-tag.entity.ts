import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ZlataAssetTagEntity } from './zlata-asset-tag.entity';

@Entity({ schema: 'metadata', name: 'zlata_tag' })
export class ZlataTagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @OneToMany(() => ZlataAssetTagEntity, (at) => at.tag)
  assetTags: ZlataAssetTagEntity[];
}
