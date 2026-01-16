import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}