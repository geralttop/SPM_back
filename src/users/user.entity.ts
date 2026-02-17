import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Favorite } from '../points/entities/favorite.entity';

export type UserRole = 'user' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  // Явно указываем type: 'varchar', чтобы TypeORM не путался в null
  @Column({ type: 'varchar', nullable: true })
  confirmationCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  codeCreatedAt: Date | null;

  @Column({
    type: 'varchar', // Используем обычную строку в БД
    default: 'user', // Значение по умолчанию
  })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  hashedRefreshToken: string | null;

  // В user.entity.ts добавь:
  @Column({ type: 'text', nullable: true })
  bio: string | null;

  // Поля для защиты от brute-force атак
  @Column({ type: 'int', default: 0 })
  failedCodeAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  codeBlockedUntil: Date | null;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  loginBlockedUntil: Date | null;

  @OneToMany(() => Subscription, (subscription) => subscription.follower)
  subscriptions: Subscription[];

  @OneToMany(() => Subscription, (subscription) => subscription.following)
  subscribers: Subscription[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  // Порядок вкладок в sidebar (массив ID вкладок)
  @Column({ type: 'json', nullable: true })
  sidebarOrder: string[] | null;
}