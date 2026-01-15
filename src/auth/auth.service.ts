import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer'; // Импортируем почту
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { User } from 'src/users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // Вспомогательный метод для проверки "1 минуты" и "5 минут"
  private checkCodeLimits(user: User) {
    if (user.codeCreatedAt) {
      const now = new Date();
      const createdAt = new Date(user.codeCreatedAt); // Важно обернуть в new Date()
      const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;

      // Ограничение на повторную отправку (60 секунд)
      if (diffInSeconds < 60) {
        throw new BadRequestException(
          `Повторная отправка возможна через ${Math.ceil(60 - diffInSeconds)} сек.`,
        );
      }
    }
  }

  async register(email: string, pass: string, username: string) {
    const candidate = await this.usersService.findByEmail(email);
    if (candidate) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass, salt);

    const user = await this.usersService.create(email, hashedPassword, username, confirmationCode);
    
    user.codeCreatedAt = new Date(); // При первой регистрации ставим время сразу
    await this.usersService.saveUser(user);

    await this.sendMail(email, confirmationCode, username);
    return { message: 'Код подтверждения отправлен на почту' };
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      
      // ВОТ ЗДЕСЬ ПРОВЕРЯЕМ ЛИМИТ 1 МИНУТЫ
      this.checkCodeLimits(user);

      const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.confirmationCode = loginCode;
      user.codeCreatedAt = new Date();
      await this.usersService.saveUser(user);

      await this.sendMail(user.email, loginCode, user.username);

      return { 
        message: 'Код подтверждения отправлен на почту',
        email: user.email 
      };
    }
    throw new UnauthorizedException('Неверный логин или пароль');
  }

  // Общий метод для отправки почты (чтобы не дублировать код)
  private async sendMail(email: string, code: string, username?: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Код подтверждения',
      html: `<h1>Ваш код: ${code}</h1>`,
    });
  }
}