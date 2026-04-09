import { User, UserRole } from './user.entity';
export interface PublicAuthor {
    id: number;
    username: string;
    avatar: string | null;
    role: UserRole;
    createdPointsCount: number;
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
        firstName: user.username,
        lastName: '',
    };
}
