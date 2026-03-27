import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CookieService {
  constructor(private configService: ConfigService) {}

  /**
   * Устанавливает refresh token в httpOnly cookie.
   * В production при cross-origin (фронт на Vercel, API на другом домене) нужен sameSite: 'none',
   * иначе браузер не отправляет cookie на /refresh и пользователя выкидывает с 401.
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const sameSite = isProduction ? 'none' as const : 'strict'; // cross-site запросы на проде
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      path: '/',
    });
  }

  /**
   * Устанавливает access token в httpOnly cookie (опционально)
   * Обычно access token отправляется в теле ответа для использования в заголовках
   */
  setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const sameSite = isProduction ? 'none' as const : 'strict';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 30 * 60 * 1000, // 30 минут
      path: '/',
    });
  }

  /**
   * Очищает все токены из cookies.
   * В production передаём те же опции, что и при установке (secure, sameSite), иначе cookie не удалится.
   */
  clearTokenCookies(res: Response): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const sameSite: CookieOptions['sameSite'] = isProduction ? 'none' : 'strict';
    const clearOpts: CookieOptions = { httpOnly: true, sameSite, path: '/' };
    res.clearCookie('refreshToken', { ...clearOpts, secure: isProduction });
    res.clearCookie('accessToken', { ...clearOpts, secure: isProduction });
  }

  /**
   * Получает refresh token из cookies
   */
  getRefreshTokenFromCookie(req: any): string | undefined {
    return req.cookies?.refreshToken;
  }

  /**
   * Получает access token из cookies
   */
  getAccessTokenFromCookie(req: any): string | undefined {
    return req.cookies?.accessToken;
  }
}