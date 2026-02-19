import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';

@Injectable()
export class BlockedUserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Если пользователь не авторизован, пропускаем проверку
    }

    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });
    
    if (fullUser?.isBlocked) {
      throw new ForbiddenException(`Ваш аккаунт заблокирован. Причина: ${fullUser.blockReason || 'Нарушение правил сервиса'}`);
    }

    return true;
  }
}