import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { PointEntity } from 'src/points/entities/point.entity';
import { Comment } from 'src/points/entities/comment.entity';

export type ReportType = 'point' | 'comment' | 'user';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'other';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['point', 'comment', 'user'],
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ['spam', 'inappropriate', 'harassment', 'fake', 'other'],
  })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Кто подал жалобу
  @Column()
  reporterId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  // На что жалоба
  @Column({ nullable: true })
  pointId: string;

  @ManyToOne(() => PointEntity, { nullable: true })
  @JoinColumn({ name: 'pointId' })
  point: PointEntity;

  @Column({ nullable: true })
  commentId: number;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column({ nullable: true })
  reportedUserId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportedUserId' })
  reportedUser: User;

  // Кто обработал жалобу (админ)
  @Column({ nullable: true })
  reviewedById: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;
}