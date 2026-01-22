import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PointEntity } from '../../points/entities/point.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  icon: string; // Название иконки для фронтенда (например, 'park', 'cafe')

  @Column({ default: '#000000' })
  color: string; // Цвет метки на карте

  @OneToMany(() => PointEntity, (point) => point.category)
  points: PointEntity[];
}