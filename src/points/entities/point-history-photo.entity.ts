import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PointHistoryEntity } from './point-history.entity';

@Entity('point_history_photos')
export class PointHistoryPhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  historyId: string;

  @ManyToOne(() => PointHistoryEntity, (history) => history.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'historyId' })
  history: PointHistoryEntity;

  @Column({ length: 512 })
  url: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @CreateDateColumn()
  createdAt: Date;
}

