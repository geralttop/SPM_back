export class SubscriptionResponseDto {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  role: 'user' | 'admin';
  createdPointsCount: number;
}

export class SubscriptionStatsDto {
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}
