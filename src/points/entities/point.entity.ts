import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, OneToMany } from 'typeorm';
import * as GeoJSON from 'geojson';
import { Category } from '../../categories/entities/category.entity';
import { Container } from '../../containers/entities/container.entity';
import { User } from '../../users/user.entity';
import { Favorite } from './favorite.entity';
import { Comment } from './comment.entity';
import { PointPhotoEntity } from './point-photo.entity';
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
    @Column({ type: 'int', nullable: true })
    mediaAspectW: number | null;
    @Column({ type: 'int', nullable: true })
    mediaAspectH: number | null;
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
    @ManyToOne(() => Container, (container) => container.points, { nullable: true, onDelete: 'SET NULL' })
    container: Container;
    @Column()
    authorId: number;
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    author: User;
    @OneToMany(() => Favorite, (favorite) => favorite.point)
    favorites: Favorite[];
    @OneToMany(() => Comment, (comment) => comment.point)
    comments: Comment[];
    @OneToMany(() => PointPhotoEntity, (photo) => photo.point)
    photos: PointPhotoEntity[];
}
