import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class CookieService {
    constructor(private configService: ConfigService) { }
    setRefreshTokenCookie(res: Response, refreshToken: string): void {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const sameSite = isProduction ? 'none' as const : 'strict';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
        });
    }
    setAccessTokenCookie(res: Response, accessToken: string): void {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const sameSite = isProduction ? 'none' as const : 'strict';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite,
            maxAge: 30 * 60 * 1000,
            path: '/',
        });
    }
    clearTokenCookies(res: Response): void {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const sameSite: CookieOptions['sameSite'] = isProduction ? 'none' : 'strict';
        const clearOpts: CookieOptions = { httpOnly: true, sameSite, path: '/' };
        res.clearCookie('refreshToken', { ...clearOpts, secure: isProduction });
        res.clearCookie('accessToken', { ...clearOpts, secure: isProduction });
    }
    getRefreshTokenFromCookie(req: any): string | undefined {
        return req.cookies?.refreshToken;
    }
    getAccessTokenFromCookie(req: any): string | undefined {
        return req.cookies?.accessToken;
    }
}
