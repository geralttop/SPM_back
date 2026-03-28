import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'metadata', name: 'vinland_asset' })
export class VinlandAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Относительно каталога uploads, например vinland/uuid.jpg */
  @Column({ type: 'varchar', length: 512 })
  filePath: string;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int' })
  uploaderId: number;

  @CreateDateColumn()
  createdAt: Date;
}
