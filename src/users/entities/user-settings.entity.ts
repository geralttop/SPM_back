import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, } from 'typeorm';
import { User } from '../user.entity';
@Entity('user_settings')
export class UserSettings {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ unique: true })
    userId: number;
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
    @Column({ type: 'json', nullable: true })
    sidebarOrder: string[] | null;
    @Column({ type: 'json', nullable: true })
    availableMapStyles: string[] | null;
    @Column({ type: 'varchar', nullable: true })
    defaultMapStyle: string | null;
    @Column({ type: 'varchar', length: 16, nullable: true, default: 'map' })
    pointCardInitialView: 'map' | 'photos' | null;
}
