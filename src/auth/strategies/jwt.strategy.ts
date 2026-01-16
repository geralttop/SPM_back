import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Извлекаем токен из заголовка Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'ACCESS_SECRET', // Должен совпадать с ключом подписи access токена
    });
  }

  // Сюда мы попадаем, если токен валиден
  async validate(payload: any) {
    // То, что мы вернем здесь, будет лежать в req.user
    return { 
      sub: payload.sub, 
      userId: payload.sub,
      email: payload.email,
      role: payload.role // Убедись, что роль попадает в req.user
    };
  }
}