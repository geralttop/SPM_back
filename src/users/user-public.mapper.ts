import { User, UserRole } from './user.entity';

/** Публичные поля автора для API (без password и пр.). */
export interface PublicAuthor {
  id: number;
  username: string;
  avatar: string | null;
  role: UserRole;
  createdPointsCount: number;
  /** Совместимость с фронтом (в БД нет отдельных имён) */
  firstName: string;
  lastName: string;
}

export function toPublicAuthor(
  user: User,
  createdPointsCount: number,
): PublicAuthor {
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
