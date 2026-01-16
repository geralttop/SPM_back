import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/user.entity';
 // проверь путь до сущности

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);