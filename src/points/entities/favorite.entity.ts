import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { PointEntity } from './point.entity';

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => PointEntity, (point) => point.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pointId' })
  point: PointEntity;

  @CreateDateColumn()
  createdAt: Date;
}
