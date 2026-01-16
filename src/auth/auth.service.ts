import { Injectable, ConflictException, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer'; // Импортируем почту
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { User } from 'src/users/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    this.logger.log(`Попытка регистрации нового пользователя: ${email}`); // Лог старта
    const candidate = await this.usersService.findByEmail(email);
    if (candidate) {
      this.logger.warn(`Ошибка регистрации: email ${email} уже занят`); // Лог предупреждения
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass, salt);

    const user = await this.usersService.create(email, hashedPassword, username, confirmationCode);
    
    user.codeCreatedAt = new Date(); // При первой регистрации ставим время сразу
    await this.usersService.saveUser(user);

    await this.sendMail(email, confirmationCode, username);
    this.logger.log(`Пользователь ${username} успешно зарегистрирован. Код отправлен на ${email}`);
    return { message: 'Код подтверждения отправлен на почту' };
  }

  async login(email: string, pass: string) {
    this.logger.log(`Попытка входа: ${email}`);    
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      this.logger.debug(`Генерация 2FA кода для ${email}`);
      // ВОТ ЗДЕСЬ ПРОВЕРЯЕМ ЛИМИТ 1 МИНУТЫ
      this.checkCodeLimits(user);

      const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.confirmationCode = loginCode;
      user.codeCreatedAt = new Date();
      await this.usersService.saveUser(user);

      await this.sendMail(user.email, loginCode, user.username);

      this.logger.log(`Код 2FA успешно отправлен пользователю ${email}`);
      return { 
        message: 'Код подтверждения отправлен на почту',
        email: user.email 
      };
    }
    this.logger.error(`Неудачная попытка входа для email: ${email}`); // Лог ошибки
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

  async getTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m', // Короткий срок
        secret: 'ACCESS_SECRET', // В идеале брать из .env
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d', // Длинный срок
        secret: 'REFRESH_SECRET',
      }),
    ]);

    return { accessToken, refreshToken };
  }

// Метод для обновления хеша в базе
  async updateRefreshToken(userId: number, refreshToken: string) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(refreshToken, salt);
      await this.usersService.update(userId, { hashedRefreshToken: hash });
    }

    async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    
    return tokens;
  }
}