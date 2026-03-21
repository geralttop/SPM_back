import { Injectable, ConflictException, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer'; // Импортируем почту
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import type { Response } from 'express';
import { CookieService } from './services/cookie.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
    private bruteForceProtection: BruteForceProtectionService,
    private cookieService: CookieService,
  ) {}

  // Вспомогательный метод для проверки "1 минуты" и "5 минут"
  private async checkCodeLimits(user: User) {
    const verification = await this.usersService.getVerification(user.id);
    if (verification?.codeCreatedAt) {
      const now = new Date();
      const createdAt = new Date(verification.codeCreatedAt);
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
    
    // Проверяем уникальность email
    const candidateByEmail = await this.usersService.findByEmail(email);
    if (candidateByEmail) {
      this.logger.warn(`Ошибка регистрации: email ${email} уже занят`); // Лог предупреждения
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Проверяем уникальность username
    const candidateByUsername = await this.usersService.findByUsername(username);
    if (candidateByUsername) {
      this.logger.warn(`Ошибка регистрации: username ${username} уже занят`);
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass, salt);

    const user = await this.usersService.create(email, hashedPassword, username, confirmationCode);

    await this.sendMail(email, confirmationCode, username);
    this.logger.log(`Пользователь ${username} успешно зарегистрирован. Код отправлен на ${email}`);
    return { message: 'Код подтверждения отправлен на почту' };
  }

  async login(email: string, pass: string) {
    this.logger.log(`Попытка входа: ${email}`);    
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.error(`Неудачная попытка входа для несуществующего email: ${email}`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверяем блокировку входа
    await this.bruteForceProtection.checkLoginBlocking(user);

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    
    if (!isPasswordValid) {
      // Регистрируем неудачную попытку входа
      await this.bruteForceProtection.recordFailedLoginAttempt(user);
      this.logger.error(`Неудачная попытка входа для email: ${email}`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Сбрасываем счетчик неудачных попыток входа при успешном входе
    await this.bruteForceProtection.resetFailedAttempts(user, 'login');

    this.logger.debug(`Генерация 2FA кода для ${email}`);
    // ВОТ ЗДЕСЬ ПРОВЕРЯЕМ ЛИМИТ 1 МИНУТЫ
    await this.checkCodeLimits(user);

    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.updateVerification(user.id, {
      confirmationCode: loginCode,
      codeCreatedAt: new Date(),
    });

    await this.sendMail(user.email, loginCode, user.username);

    this.logger.log(`Код 2FA успешно отправлен пользователю ${email}`);
    return { 
      message: 'Код подтверждения отправлен на почту',
      email: user.email 
    };
  }

  // Общий метод для отправки почты (чтобы не дублировать код)
  private async sendMail(email: string, code: string, username?: string) {
    const subject = 'Код подтверждения';
    const preview = `Ваш код подтверждения: ${code}. Код действует 5 минут.`;
    const greeting = `Здравствуйте${username ? `, ${username}` : ''}!`;
    const html = `
      <div style="background:#f6f7fb;padding:24px 12px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e9f3;border-radius:16px;overflow:hidden;">
          <div style="padding:20px 22px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;">
            <div style="font-size:14px;opacity:.9;letter-spacing:.2px;">SharePlacesMap</div>
            <div style="font-size:20px;font-weight:700;margin-top:6px;">Код подтверждения</div>
          </div>
          <div style="padding:22px;">
            <div style="font-size:15px;color:#111827;line-height:1.5;margin-bottom:14px;">${greeting}</div>
            <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:14px;">
              Введите этот код в приложении, чтобы продолжить. Код действителен <b>5 минут</b>.
            </div>
            <div style="text-align:center;margin:18px 0;">
              <div style="display:inline-block;background:#f3f4ff;border:1px solid #e5e7ff;border-radius:14px;padding:14px 18px;">
                <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#111827;">${code}</div>
              </div>
            </div>
            <div style="font-size:12.5px;color:#6b7280;line-height:1.6;">
              Если вы не запрашивали код, просто проигнорируйте это письмо.
            </div>
          </div>
          <div style="padding:14px 22px;border-top:1px solid #eef0f7;font-size:12px;color:#9ca3af;">
            Это автоматическое письмо, отвечать на него не нужно.
          </div>
        </div>
      </div>
    `;
    const text = `${subject}\n\n${greeting}\n\nВаш код: ${code}\nКод действителен 5 минут.\n\nЕсли вы не запрашивали код, проигнорируйте это письмо.`;
    await this.mailerService.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Проверяет код подтверждения с защитой от brute-force
   */
  async verifyCode(email: string, code: string): Promise<{ user: User; isValid: boolean }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Проверяем блокировку кодов
    await this.bruteForceProtection.checkCodeBlocking(user);

    const verification = await this.usersService.getVerification(user.id);
    if (!verification) {
      return { user, isValid: false };
    }

    // Проверка времени (5 минут)
    if (verification.codeCreatedAt) {
      const now = new Date();
      const diffInMinutes = (now.getTime() - new Date(verification.codeCreatedAt).getTime()) / 1000 / 60;

      if (diffInMinutes > 5) {
        throw new BadRequestException('Срок действия кода истек (5 минут). Запросите новый код.');
      }
    }

    // Проверка кода
    const isCodeValid = verification.confirmationCode === code && code !== null;
    
    if (!isCodeValid) {
      // Регистрируем неудачную попытку
      await this.bruteForceProtection.recordFailedCodeAttempt(user);
      return { user, isValid: false };
    }

    // Сбрасываем счетчики при успешной проверке
    await this.bruteForceProtection.resetFailedAttempts(user, 'code');
    
    return { user, isValid: true };
  }

  async getTokens(userId: number, email: string, role: string, username?: string) {
    const payload = { sub: userId, email, role, username };
    
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    
    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not defined in environment variables');
    }
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m', // Короткий срок
        secret: accessSecret,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d', // Длинный срок
        secret: refreshSecret,
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

  async issueTokensAndSetCookie(user: User, res: Response): Promise<string> {
    const tokens = await this.getTokens(user.id, user.email, user.role, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);
    return tokens.accessToken;
  }

    async refreshTokens(userId: number, refreshToken: string) {
    // Сначала проверяем валидность JWT refresh токена
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
    } catch (error) {
      throw new ForbiddenException('Невалидный или истёкший refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    
    return tokens;
  }
    async forgotPassword(email: string) {
      this.logger.log(`Запрос на восстановление пароля для: ${email}`);

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Не раскрываем информацию о том, существует ли пользователь
        this.logger.warn(`Попытка восстановления пароля для несуществующего email: ${email}`);
        return { message: 'Если пользователь с таким email существует, код восстановления отправлен на почту' };
      }

      // Проверяем лимит времени
      await this.checkCodeLimits(user);

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await this.usersService.updateVerification(user.id, {
        confirmationCode: resetCode,
        codeCreatedAt: new Date(),
      });

      await this.sendResetPasswordMail(user.email, resetCode, user.username);

      this.logger.log(`Код восстановления пароля отправлен для ${email}`);
      return { message: 'Если пользователь с таким email существует, код восстановления отправлен на почту' };
    }

    async resetPassword(email: string, code: string, newPassword: string) {
      this.logger.log(`Попытка сброса пароля для: ${email}`);

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Неверный код или email');
      }

      // Проверяем блокировку кодов
      await this.bruteForceProtection.checkCodeBlocking(user);

      const verification = await this.usersService.getVerification(user.id);
      if (!verification) {
        throw new UnauthorizedException('Неверный код или email');
      }

      // Проверка времени (5 минут)
      if (verification.codeCreatedAt) {
        const now = new Date();
        const diffInMinutes = (now.getTime() - new Date(verification.codeCreatedAt).getTime()) / 1000 / 60;

        if (diffInMinutes > 5) {
          throw new BadRequestException('Срок действия кода истек (5 минут). Запросите новый код.');
        }
      }

      // Проверка кода
      const isCodeValid = verification.confirmationCode === code && code !== null;

      if (!isCodeValid) {
        // Регистрируем неудачную попытку
        await this.bruteForceProtection.recordFailedCodeAttempt(user);
        throw new UnauthorizedException('Неверный код или email');
      }

      // Сбрасываем счетчики при успешной проверке
      await this.bruteForceProtection.resetFailedAttempts(user, 'code');

      // Хешируем новый пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Обновляем пароль и очищаем код
      user.password = hashedPassword;
      await this.usersService.saveUser(user);
      await this.usersService.updateVerification(user.id, {
        confirmationCode: null,
        codeCreatedAt: null,
      });

      this.logger.log(`Пароль успешно изменен для ${email}`);
      return { message: 'Пароль успешно изменен' };
    }

    // Отдельный метод для отправки письма с кодом восстановления
    private async sendResetPasswordMail(email: string, code: string, username?: string) {
      const subject = 'Восстановление пароля';
      const greeting = `Здравствуйте${username ? `, ${username}` : ''}!`;
      const html = `
        <div style="background:#f6f7fb;padding:24px 12px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e9f3;border-radius:16px;overflow:hidden;">
            <div style="padding:20px 22px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#ffffff;">
              <div style="font-size:14px;opacity:.9;letter-spacing:.2px;">SharePlacesMap</div>
              <div style="font-size:20px;font-weight:700;margin-top:6px;">Восстановление пароля</div>
            </div>
            <div style="padding:22px;">
              <div style="font-size:15px;color:#111827;line-height:1.5;margin-bottom:14px;">${greeting}</div>
              <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:14px;">
                Мы получили запрос на сброс пароля. Введите код ниже, чтобы задать новый пароль. Код действителен <b>5 минут</b>.
              </div>
              <div style="text-align:center;margin:18px 0;">
                <div style="display:inline-block;background:#eff6ff;border:1px solid #dbeafe;border-radius:14px;padding:14px 18px;">
                  <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#111827;">${code}</div>
                </div>
              </div>
              <div style="font-size:12.5px;color:#6b7280;line-height:1.6;">
                Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
              </div>
            </div>
            <div style="padding:14px 22px;border-top:1px solid #eef0f7;font-size:12px;color:#9ca3af;">
              Это автоматическое письмо, отвечать на него не нужно.
            </div>
          </div>
        </div>
      `;
      const text = `${subject}\n\n${greeting}\n\nКод для сброса пароля: ${code}\nКод действителен 5 минут.\n\nЕсли вы не запрашивали восстановление пароля, проигнорируйте это письмо.`;
      await this.mailerService.sendMail({
        to: email,
        subject,
        text,
        html,
      });
    }
}
