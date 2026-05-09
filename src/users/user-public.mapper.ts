import { User, UserRole } from './user.entity';
export interface PublicAuthor {
    id: number;
    username: string;
    avatar: string | null;
    role: UserRole;
    createdPointsCount: number;
    isVerified: boolean;
    firstName: string;
    lastName: string;
}
export function toPublicAuthor(user: User, createdPointsCount: number): PublicAuthor {
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        createdPointsCount,
        isVerified: user.isVerified,
        firstName: user.username,
        lastName: '',
    };
}
