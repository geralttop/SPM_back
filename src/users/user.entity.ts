import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Favorite } from '../points/entities/favorite.entity';
import { UserVerification } from './entities/user-verification.entity';
import { UserSecurity } from './entities/user-security.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UserBlock } from './entities/user-block.entity';
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
    @Column({
        type: 'varchar',
        default: 'user',
    })
    role: UserRole;
    @Column({ type: 'varchar', nullable: true })
    hashedRefreshToken: string | null;
    @Column({ type: 'text', nullable: true })
    bio: string | null;
    @Column({ type: 'varchar', nullable: true })
    avatar: string | null;
    @OneToMany(() => Subscription, (subscription) => subscription.follower)
    subscriptions: Subscription[];
    @OneToMany(() => Subscription, (subscription) => subscription.following)
    subscribers: Subscription[];
    @OneToMany(() => Favorite, (favorite) => favorite.user)
    favorites: Favorite[];
    @OneToOne(() => UserVerification, (verification) => verification.user)
    verification: UserVerification;
    @OneToOne(() => UserSecurity, (security) => security.user)
    security: UserSecurity;
    @OneToOne(() => UserSettings, (settings) => settings.user)
    settings: UserSettings;
    @OneToOne(() => UserBlock, (block) => block.user)
    block: UserBlock;
}
