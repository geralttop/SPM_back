import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';

@Injectable()
export class BruteForceProtectionService {
  private readonly logger = new Logger(BruteForceProtectionService.name);

  // Настройки защиты
  private readonly MAX_CODE_ATTEMPTS = 3; // Максимум попыток ввода кода
  private readonly CODE_BLOCK_DURATION = 15 * 60 * 1000; // 15 минут блокировки
  private readonly MAX_LOGIN_ATTEMPTS = 5; // Максимум попыток входа
  private readonly LOGIN_BLOCK_DURATION = 30 * 60 * 1000; // 30 минут блокировки

  constructor(private usersService: UsersService) {}

  /**
   * Проверяет, заблокирован ли пользователь для ввода кодов
   */
  async checkCodeBlocking(user: User): Promise<void> {
    const security = await this.usersService.getSecurity(user.id);
    if (security?.codeBlockedUntil && new Date() < security.codeBlockedUntil) {
      const remainingMinutes = Math.ceil(
        (security.codeBlockedUntil.getTime() - new Date().getTime()) / 60000
      );
      this.logger.warn(`Попытка ввода кода заблокированным пользователем: ${user.email}`);
      throw new BadRequestException(
        `Слишком много неверных попыток. Повторите через ${remainingMinutes} минут.`
      );
    }
  }

  /**
   * Проверяет, заблокирован ли пользователь для входа
   */
  async checkLoginBlocking(user: User): Promise<void> {
    const security = await this.usersService.getSecurity(user.id);
    if (security?.loginBlockedUntil && new Date() < security.loginBlockedUntil) {
      const remainingMinutes = Math.ceil(
        (security.loginBlockedUntil.getTime() - new Date().getTime()) / 60000
      );
      this.logger.warn(`Попытка входа заблокированным пользователем: ${user.email}`);
      throw new BadRequestException(
        `Слишком много неверных попыток входа. Повторите через ${remainingMinutes} минут.`
      );
    }
  }

  /**
   * Регистрирует неудачную попытку ввода кода
   */
  async recordFailedCodeAttempt(user: User): Promise<void> {
    const security = await this.usersService.getSecurity(user.id);
    if (!security) return;

    security.failedCodeAttempts += 1;
    
    this.logger.warn(
      `Неверный код от пользователя ${user.email}. Попытка ${security.failedCodeAttempts}/${this.MAX_CODE_ATTEMPTS}`
    );

    if (security.failedCodeAttempts >= this.MAX_CODE_ATTEMPTS) {
      security.codeBlockedUntil = new Date(Date.now() + this.CODE_BLOCK_DURATION);
      this.logger.error(
        `Пользователь ${user.email} заблокирован на 15 минут за превышение попыток ввода кода`
      );
    }

    await this.usersService.updateSecurity(user.id, security);
  }

  /**
   * Регистрирует неудачную попытку входа
   */
  async recordFailedLoginAttempt(user: User): Promise<void> {
    const security = await this.usersService.getSecurity(user.id);
    if (!security) return;

    security.failedLoginAttempts += 1;
    
    this.logger.warn(
      `Неверный пароль от пользователя ${user.email}. Попытка ${security.failedLoginAttempts}/${this.MAX_LOGIN_ATTEMPTS}`
    );

    if (security.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      security.loginBlockedUntil = new Date(Date.now() + this.LOGIN_BLOCK_DURATION);
      this.logger.error(
        `Пользователь ${user.email} заблокирован на 30 минут за превышение попыток входа`
      );
    }

    await this.usersService.updateSecurity(user.id, security);
  }

  /**
   * Сбрасывает счетчики неудачных попыток при успешном действии
   */
  async resetFailedAttempts(user: User, type: 'code' | 'login' | 'both' = 'both'): Promise<void> {
    const security = await this.usersService.getSecurity(user.id);
    if (!security) return;

    if (type === 'code' || type === 'both') {
      security.failedCodeAttempts = 0;
      security.codeBlockedUntil = null;
    }
    
    if (type === 'login' || type === 'both') {
      security.failedLoginAttempts = 0;
      security.loginBlockedUntil = null;
    }

    await this.usersService.updateSecurity(user.id, security);
    this.logger.log(`Сброшены счетчики неудачных попыток для пользователя ${user.email}`);
  }

  /**
   * Очищает старые блокировки (можно вызывать периодически)
   */
  async cleanupExpiredBlocks(): Promise<void> {
    // Эта функция может быть вызвана через cron job
    // Пока оставим пустой, так как блокировки проверяются при каждом запросе
    this.logger.debug('Очистка истекших блокировок выполнена');
  }
}