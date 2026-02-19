import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { PointEntity } from '../../points/entities/point.entity';
import { User } from '../../users/user.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: '#000000' })
  color: string; // Цвет метки на карте

  @OneToMany(() => PointEntity, (point) => point.category)
  points: PointEntity[];

  @Column({ nullable: true })
  authorId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
  author: User; // Если null — категория общая (системная), если есть ID — приватная
}