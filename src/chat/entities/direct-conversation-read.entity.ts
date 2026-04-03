import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { DirectConversation } from './direct-conversation.entity';
import { User } from '../../users/user.entity';

@Entity('direct_conversation_reads')
export class DirectConversationRead {
  @PrimaryColumn({ name: 'conversationId' })
  conversationId: number;

  @ManyToOne(() => DirectConversation, (c) => c.reads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: DirectConversation;

  @PrimaryColumn({ name: 'userId' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'lastReadAt', type: 'timestamptz' })
  lastReadAt: Date;
}
