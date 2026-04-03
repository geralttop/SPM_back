import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { DirectConversation } from './entities/direct-conversation.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { DirectConversationRead } from './entities/direct-conversation-read.entity';
import { User } from '../users/user.entity';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { ChatGateway } from './chat.gateway';

const MESSAGE_PAGE = 40;

function orderedPair(a: number, b: number): { low: number; high: number } {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

function peerId(conv: DirectConversation, userId: number): number {
  return conv.userLowId === userId ? conv.userHighId : conv.userLowId;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(DirectConversation)
    private readonly convRepo: Repository<DirectConversation>,
    @InjectRepository(DirectMessage)
    private readonly msgRepo: Repository<DirectMessage>,
    @InjectRepository(DirectConversationRead)
    private readonly readRepo: Repository<DirectConversationRead>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getConversationMeta(userId: number, conversationId: number) {
    await this.assertMember(userId, conversationId);
    const c = await this.convRepo.findOneOrFail({ where: { id: conversationId } });
    const p = peerId(c, userId);
    const peer = await this.userRepo.findOne({
      where: { id: p },
      select: ['id', 'username', 'avatar'],
    });
    if (!peer) {
      throw new NotFoundException('Peer not found');
    }
    return {
      conversationId,
      peer: {
        id: peer.id,
        username: peer.username,
        avatar: peer.avatar,
      },
    };
  }

  async findConversationIdByPeer(
    userId: number,
    peerUserId: number,
  ): Promise<number | null> {
    if (peerUserId === userId) {
      throw new BadRequestException('Cannot chat with yourself');
    }
    const { low, high } = orderedPair(userId, peerUserId);
    const c = await this.convRepo.findOne({
      where: { userLowId: low, userHighId: high },
      select: ['id'],
    });
    return c?.id ?? null;
  }

  async listConversations(userId: number) {
    const convs = await this.convRepo
      .createQueryBuilder('c')
      .where('c.userLowId = :uid OR c.userHighId = :uid', { uid: userId })
      .orderBy(
        `(SELECT MAX(m."createdAt") FROM direct_messages m WHERE m."conversationId" = c.id)`,
        'DESC',
      )
      .addOrderBy('c.id', 'DESC')
      .getMany();

    if (convs.length === 0) {
      return [];
    }

    const convIds = convs.map((c) => c.id);
    const latestByConv = await this.msgRepo
      .createQueryBuilder('m')
      .distinctOn(['m.conversationId'])
      .where('m.conversationId IN (:...ids)', { ids: convIds })
      .orderBy('m.conversationId', 'ASC')
      .addOrderBy('m.createdAt', 'DESC')
      .getMany();

    const latestMap = new Map(latestByConv.map((m) => [m.conversationId, m]));
    const peerIds = convs.map((c) => peerId(c, userId));
    const peers = await this.userRepo.find({
      where: { id: In(peerIds) },
      select: ['id', 'username', 'avatar'],
    });
    const peerMap = new Map(peers.map((p) => [p.id, p]));

    const reads = await this.readRepo.find({
      where: convIds.map((id) => ({ conversationId: id, userId })),
    });
    const readMap = new Map(reads.map((r) => [r.conversationId, r.lastReadAt]));

    const unreadCounts = await Promise.all(
      convs.map((c) => this.countUnreadInConversation(userId, c.id, readMap.get(c.id))),
    );

    return convs.map((c, i) => {
      const p = peerId(c, userId);
      const peer = peerMap.get(p);
      const last = latestMap.get(c.id);
      return {
        conversationId: c.id,
        peer: peer
          ? { id: peer.id, username: peer.username, avatar: peer.avatar }
          : { id: p, username: '', avatar: null as string | null },
        lastMessage: last
          ? {
              id: last.id,
              body: last.body,
              senderId: last.senderId,
              createdAt: last.createdAt.toISOString(),
            }
          : null,
        unreadCount: unreadCounts[i],
      };
    });
  }

  private async countUnreadInConversation(
    userId: number,
    conversationId: number,
    lastReadAt?: Date,
  ): Promise<number> {
    const qb = this.msgRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :cid', { cid: conversationId })
      .andWhere('m.senderId != :uid', { uid: userId });
    if (lastReadAt) {
      qb.andWhere('m.createdAt > :lr', { lr: lastReadAt });
    }
    return qb.getCount();
  }

  async getUnreadTotal(userId: number): Promise<{ count: number }> {
    const raw = await this.msgRepo
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .leftJoin(
        'direct_conversation_reads',
        'r',
        'r."conversationId" = m."conversationId" AND r."userId" = :uid',
      )
      .where('(c.userLowId = :uid OR c.userHighId = :uid)', { uid: userId })
      .andWhere('m.senderId != :uid', { uid: userId })
      .andWhere('(r."lastReadAt" IS NULL OR m."createdAt" > r."lastReadAt")')
      .getCount();
    return { count: raw };
  }

  async getMessages(
    userId: number,
    conversationId: number,
    before?: number,
  ) {
    await this.assertMember(userId, conversationId);

    let beforeMsg: DirectMessage | null = null;
    if (before !== undefined && !Number.isNaN(Number(before))) {
      beforeMsg = await this.msgRepo.findOne({
        where: { id: before, conversationId },
      });
      if (!beforeMsg) {
        throw new BadRequestException('Invalid cursor');
      }
    }

    const qb = this.msgRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :cid', { cid: conversationId })
      .orderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .take(MESSAGE_PAGE + 1);

    if (beforeMsg) {
      qb.andWhere(
        '(m.createdAt < :t OR (m.createdAt = :t AND m.id < :bid))',
        {
          t: beforeMsg.createdAt,
          bid: beforeMsg.id,
        },
      );
    }

    const rows = await qb.getMany();
    const hasMore = rows.length > MESSAGE_PAGE;
    const page = hasMore ? rows.slice(0, MESSAGE_PAGE) : rows;
    const chronological = [...page].reverse();
    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      messages: chronological.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
      hasMore,
      nextCursor,
    };
  }

  async sendMessage(userId: number, dto: SendDirectMessageDto) {
    const text = dto.text.trim();
    if (!text) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (dto.peerUserId === userId) {
      throw new BadRequestException('Cannot message yourself');
    }

    const peer = await this.userRepo.findOne({ where: { id: dto.peerUserId } });
    if (!peer) {
      throw new NotFoundException('User not found');
    }

    const { low, high } = orderedPair(userId, dto.peerUserId);
    const saved = await this.dataSource.transaction(async (manager) => {
      const conv = await this.findOrCreateConversation(manager, low, high);
      const msg = manager.create(DirectMessage, {
        conversationId: conv.id,
        senderId: userId,
        body: text,
      });
      const inserted = await manager.save(msg);

      await this.upsertRead(manager, conv.id, userId, inserted.createdAt);

      return { conversation: conv, message: inserted };
    });

    const payload = {
      conversationId: saved.conversation.id,
      message: {
        id: saved.message.id,
        senderId: saved.message.senderId,
        body: saved.message.body,
        createdAt: saved.message.createdAt.toISOString(),
      },
    };

    this.chatGateway.emitToUser(dto.peerUserId, 'message:new', payload);

    return payload;
  }

  private async findOrCreateConversation(
    manager: EntityManager,
    low: number,
    high: number,
  ): Promise<DirectConversation> {
    const existing = await manager.findOne(DirectConversation, {
      where: { userLowId: low, userHighId: high },
    });
    if (existing) {
      return existing;
    }
    const created = manager.create(DirectConversation, {
      userLowId: low,
      userHighId: high,
    });
    try {
      return await manager.save(created);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : '';
      if (code === '23505') {
        const again = await manager.findOneOrFail(DirectConversation, {
          where: { userLowId: low, userHighId: high },
        });
        return again;
      }
      throw err;
    }
  }

  private async upsertRead(
    manager: EntityManager,
    conversationId: number,
    userId: number,
    lastReadAt: Date,
  ) {
    const row = await manager.findOne(DirectConversationRead, {
      where: { conversationId, userId },
    });
    if (!row) {
      await manager.save(
        manager.create(DirectConversationRead, {
          conversationId,
          userId,
          lastReadAt,
        }),
      );
    } else if (lastReadAt > row.lastReadAt) {
      row.lastReadAt = lastReadAt;
      await manager.save(row);
    }
  }

  async markRead(userId: number, conversationId: number) {
    await this.assertMember(userId, conversationId);
    const now = new Date();
    const row = await this.readRepo.findOne({
      where: { conversationId, userId },
    });
    if (!row) {
      await this.readRepo.save(
        this.readRepo.create({
          conversationId,
          userId,
          lastReadAt: now,
        }),
      );
    } else {
      row.lastReadAt = now;
      await this.readRepo.save(row);
    }
    return { ok: true };
  }

  private async assertMember(userId: number, conversationId: number) {
    const c = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!c) {
      throw new NotFoundException('Conversation not found');
    }
    if (c.userLowId !== userId && c.userHighId !== userId) {
      throw new ForbiddenException('Not a participant');
    }
  }
}
