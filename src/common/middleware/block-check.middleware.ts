import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

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
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Проверяем только для аутентифицированных пользователей
    if (req.user && req.user.id) {
      const user = await this.usersRepository.findOne({
        where: { id: req.user.id },
        select: ['id', 'isBlocked', 'blockReason'],
      });

      if (user && user.isBlocked) {
        throw new ForbiddenException(`Ваш аккаунт заблокирован. Причина: ${user.blockReason || 'Нарушение правил сервиса'}`);
      }
    }

    next();
  }
}