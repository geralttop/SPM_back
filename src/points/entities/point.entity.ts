import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, OneToMany } from 'typeorm';
import * as GeoJSON from 'geojson';
import { Category } from 'src/categories/entities/category.entity';
import { Container } from 'src/containers/entities/container.entity';
import { Favorite } from './favorite.entity';

@Entity('points')
export class PointEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  // Поле для PostGIS
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  coords: GeoJSON.Point;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.points, { nullable: true })
  category: Category;

  @ManyToOne(() => Container, (container) => container.points, { onDelete: 'CASCADE' })
  container: Container;

  @OneToMany(() => Favorite, (favorite) => favorite.point)
  favorites: Favorite[];
}