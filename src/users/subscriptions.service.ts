import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { User } from './user.entity';
import { SubscriptionResponseDto, SubscriptionStatsDto } from './dto/subscription-response.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async follow(followerId: number, followingId: number): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('Нельзя подписаться на самого себя');
    }

    const following = await this.usersRepository.findOne({ where: { id: followingId } });
    if (!following) {
      throw new NotFoundException('Пользователь не найден');
    }

    const existingSubscription = await this.subscriptionsRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Вы уже подписаны на этого пользователя');
    }

    const subscription = this.subscriptionsRepository.create({
      follower: { id: followerId } as User,
      following: { id: followingId } as User,
    });

    await this.subscriptionsRepository.save(subscription);
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }

    await this.subscriptionsRepository.remove(subscription);
  }

  async getFollowers(userId: number): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.subscriptionsRepository.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });

    return subscriptions.map((sub) => ({
      id: sub.follower.id,
      username: sub.follower.username,
      email: sub.follower.email,
      bio: sub.follower.bio,
      avatar: sub.follower.avatar,
    }));
  }

  async getFollowing(userId: number): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.subscriptionsRepository.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });

    return subscriptions.map((sub) => ({
      id: sub.following.id,
      username: sub.following.username,
      email: sub.following.email,
      bio: sub.following.bio,
      avatar: sub.following.avatar,
    }));
  }

  async getSubscriptionStats(userId: number, currentUserId?: number): Promise<SubscriptionStatsDto> {
    const followersCount = await this.subscriptionsRepository.count({
      where: { following: { id: userId } },
    });

    const followingCount = await this.subscriptionsRepository.count({
      where: { follower: { id: userId } },
    });

    let isFollowing: boolean | undefined;
    if (currentUserId && currentUserId !== userId) {
      const subscription = await this.subscriptionsRepository.findOne({
        where: {
          follower: { id: currentUserId },
          following: { id: userId },
        },
      });
      isFollowing = !!subscription;
    }

    return {
      followersCount,
      followingCount,
      isFollowing,
    };
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    return !!subscription;
  }
}
