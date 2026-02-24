import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { UserBlock } from '../../users/entities/user-block.entity';

// Расширяем интерфейс Request для типизации req.user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    sub: number;
    userId: number;
    email: string;
    role: string;
    username: string;
  };
}

@Injectable()
export class BlockCheckMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBlock)
    private blockRepository: Repository<UserBlock>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Проверяем только для аутентифицированных пользователей
    if (req.user && req.user.id) {
      const block = await this.blockRepository.findOne({
        where: { userId: req.user.id },
        select: ['isBlocked', 'blockReason'],
      });

      if (block && block.isBlocked) {
        throw new ForbiddenException(`Ваш аккаунт заблокирован. Причина: ${block.blockReason || 'Нарушение правил сервиса'}`);
      }
    }

    next();
  }
}