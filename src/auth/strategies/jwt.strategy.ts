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
      secretOrKey: 'MY_SUPER_SECRET_KEY_2026', // Должен совпадать с ключом в AuthModule
    });
  }

  // Сюда мы попадаем, если токен валиден
  async validate(payload: any) {
    // То, что мы вернем здесь, будет лежать в req.user
    return { userId: payload.sub, email: payload.email };
  }
}