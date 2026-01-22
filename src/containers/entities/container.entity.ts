import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from 'src/users/user.entity';
import { PointEntity } from '../../points/entities/point.entity';

@Entity('containers')
export class Container {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  author: User;

  @OneToMany(() => PointEntity, (point) => point.container)
  points: PointEntity[];
}