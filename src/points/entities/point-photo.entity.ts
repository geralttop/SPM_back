import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PointEntity } from './point.entity';

@Entity('point_photos')
export class PointPhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pointId: string;

  @ManyToOne(() => PointEntity, (point) => point.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pointId' })
  point: PointEntity;

  @Column({ length: 512 })
  url: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;
}
