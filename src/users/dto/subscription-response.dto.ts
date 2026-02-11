export class SubscriptionResponseDto {
  id: number;
  username: string;
  email: string;
  bio: string | null;
}

export class SubscriptionStatsDto {
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}
