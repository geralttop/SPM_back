import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { DirectMessage } from './direct-message.entity';
import { DirectConversationRead } from './direct-conversation-read.entity';

@Entity('direct_conversations')
@Unique(['userLowId', 'userHighId'])
@Index('IDX_direct_conversations_user_low', ['userLowId'])
@Index('IDX_direct_conversations_user_high', ['userHighId'])
export class DirectConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userLowId' })
  userLowId: number;

  @Column({ name: 'userHighId' })
  userHighId: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @OneToMany(() => DirectMessage, (m) => m.conversation)
  messages: DirectMessage[];

  @OneToMany(() => DirectConversationRead, (r) => r.conversation)
  reads: DirectConversationRead[];
}
