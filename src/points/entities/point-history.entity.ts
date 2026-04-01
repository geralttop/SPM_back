import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PointEntity } from './point.entity';
import { User } from '../../users/user.entity';
import { PointHistoryPhotoEntity } from './point-history-photo.entity';

@Entity('point_history')
@Index('IDX_point_history_pointId_createdAt', ['pointId', 'createdAt'])
export class PointHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pointId: string;

  @ManyToOne(() => PointEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pointId' })
  point: PointEntity;

  @Column({ type: 'int' })
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PointHistoryPhotoEntity, (photo) => photo.history)
  photos: PointHistoryPhotoEntity[];
}

