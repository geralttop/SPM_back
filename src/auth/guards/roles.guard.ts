import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/users/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // Если роли не указаны, доступ разрешен всем авторизованным
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('У вас недостаточно прав (нужна роль Admin)');
    }
    
    return true;
  }
}