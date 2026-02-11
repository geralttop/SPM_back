import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CookieService {
  constructor(private configService: ConfigService) {}

  /**
   * Устанавливает refresh token в httpOnly cookie
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Недоступен для JavaScript (защита от XSS)
      secure: isProduction, // Только HTTPS в продакшене
      sameSite: 'strict', // Защита от CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      path: '/', // Доступен для всех путей
    });
  }

  /**
   * Устанавливает access token в httpOnly cookie (опционально)
   * Обычно access token отправляется в теле ответа для использования в заголовках
   */
  setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 минут
      path: '/',
    });
  }

  /**
   * Очищает все токены из cookies
   */
  clearTokenCookies(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
    
    res.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
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