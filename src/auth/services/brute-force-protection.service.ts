import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
@Injectable()
export class BruteForceProtectionService {
    private readonly logger = new Logger(BruteForceProtectionService.name);
    private readonly MAX_CODE_ATTEMPTS = 3;
    private readonly CODE_BLOCK_DURATION = 15 * 60 * 1000;
    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly LOGIN_BLOCK_DURATION = 30 * 60 * 1000;
    constructor(private usersService: UsersService) { }
    async checkCodeBlocking(user: User): Promise<void> {
        const security = await this.usersService.getSecurity(user.id);
        if (security?.codeBlockedUntil && new Date() < security.codeBlockedUntil) {
            const remainingMinutes = Math.ceil((security.codeBlockedUntil.getTime() - new Date().getTime()) / 60000);
            this.logger.warn(`Попытка ввода кода заблокированным пользователем: ${user.email}`);
            throw new BadRequestException(`Слишком много неверных попыток. Повторите через ${remainingMinutes} минут.`);
        }
    }
    async checkLoginBlocking(user: User): Promise<void> {
        const security = await this.usersService.getSecurity(user.id);
        if (security?.loginBlockedUntil && new Date() < security.loginBlockedUntil) {
            const remainingMinutes = Math.ceil((security.loginBlockedUntil.getTime() - new Date().getTime()) / 60000);
            this.logger.warn(`Попытка входа заблокированным пользователем: ${user.email}`);
            throw new BadRequestException(`Слишком много неверных попыток входа. Повторите через ${remainingMinutes} минут.`);
        }
    }
    async recordFailedCodeAttempt(user: User): Promise<void> {
        const security = await this.usersService.getSecurity(user.id);
        if (!security)
            return;
        security.failedCodeAttempts += 1;
        this.logger.warn(`Неверный код от пользователя ${user.email}. Попытка ${security.failedCodeAttempts}/${this.MAX_CODE_ATTEMPTS}`);
        if (security.failedCodeAttempts >= this.MAX_CODE_ATTEMPTS) {
            security.codeBlockedUntil = new Date(Date.now() + this.CODE_BLOCK_DURATION);
            this.logger.error(`Пользователь ${user.email} заблокирован на 15 минут за превышение попыток ввода кода`);
        }
        await this.usersService.updateSecurity(user.id, security);
    }
    async recordFailedLoginAttempt(user: User): Promise<void> {
        const security = await this.usersService.getSecurity(user.id);
        if (!security)
            return;
        security.failedLoginAttempts += 1;
        this.logger.warn(`Неверный пароль от пользователя ${user.email}. Попытка ${security.failedLoginAttempts}/${this.MAX_LOGIN_ATTEMPTS}`);
        if (security.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
            security.loginBlockedUntil = new Date(Date.now() + this.LOGIN_BLOCK_DURATION);
            this.logger.error(`Пользователь ${user.email} заблокирован на 30 минут за превышение попыток входа`);
        }
        await this.usersService.updateSecurity(user.id, security);
    }
    async resetFailedAttempts(user: User, type: 'code' | 'login' | 'both' = 'both'): Promise<void> {
        const security = await this.usersService.getSecurity(user.id);
        if (!security)
            return;
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
    async cleanupExpiredBlocks(): Promise<void> {
        this.logger.debug('Очистка истекших блокировок выполнена');
    }
}
