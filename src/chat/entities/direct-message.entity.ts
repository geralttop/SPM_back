import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DirectConversation } from './direct-conversation.entity';
import { User } from '../../users/user.entity';

@Entity('direct_messages')
@Index('IDX_direct_messages_conversation_created', ['conversationId', 'createdAt'])
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'conversationId' })
  conversationId: number;

  @ManyToOne(() => DirectConversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: DirectConversation;

  @Column({ name: 'senderId' })
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'varchar', length: 2000 })
  body: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
