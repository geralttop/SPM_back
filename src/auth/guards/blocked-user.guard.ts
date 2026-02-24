import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';

@Injectable()
export class BlockedUserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBlock)
    private blockRepository: Repository<UserBlock>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Если пользователь не авторизован, пропускаем проверку
    }

    const block = await this.blockRepository.findOne({ where: { userId: user.id } });
    
    if (block?.isBlocked) {
      throw new ForbiddenException(`Ваш аккаунт заблокирован. Причина: ${block.blockReason || 'Нарушение правил сервиса'}`);
    }

    return true;
  }
}