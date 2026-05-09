import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity('user_verification_requests')
export class UserVerificationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  links: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: VerificationRequestStatus;

  @Column({ nullable: true })
  adminId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin: User | null;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ type: 'timestamp', nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

