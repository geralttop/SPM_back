import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Delete, Param, BadRequestException, Patch } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; // Добавь этот импорт
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from 'src/users/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  // Добавляем usersService в конструктор
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService, // 2. Добавьте это поле сюда
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 попыток регистрации в минуту
  @Post('register')
  async register(@Body() body: RegisterDto) {
    // Теперь передаем 3 аргумента: email, password, username
    return this.authService.register(body.email, body.password, body.username);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 попыток входа в минуту
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @SkipThrottle() // Профиль не нуждается в жестком ограничении
  @ApiBearerAuth() // Показывает замок
  @ApiOkResponse({ 
    description: 'Данные профиля успешно получены',
    type: UserProfileDto // Указываем класс ответа
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req): UserProfileDto {
    // Nest автоматически вернет объект пользователя, 
    // но здесь мы помечаем тип для TypeScript и Swagger
    return req.user;
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 попытки подтверждения в минуту - КРИТИЧНО!
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyCodeDto) {
    const { user, isValid } = await this.authService.verifyCode(body.email, body.code);
    
    if (!isValid) {
      throw new UnauthorizedException('Неверный код подтверждения');
    }

    // Подтверждаем почту
    const isVerified = await this.usersService.verifyUser(body.email, body.code);
    
    if (isVerified) {
      // Очищаем временные данные кода
      user.confirmationCode = null;
      user.codeCreatedAt = null;
      await this.usersService.saveUser(user);

      // Генерируем токены
      const tokens = await this.authService.getTokens(user.id, user.email, user.role);
      await this.authService.updateRefreshToken(user.id, tokens.refreshToken);

      return { 
        message: 'Почта успешно подтверждена!',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    }
    
    throw new UnauthorizedException('Неверный код подтверждения');
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 попытки подтверждения входа в минуту - КРИТИЧНО!
  @Post('verify-login')
  async verifyLogin(@Body() body: VerifyCodeDto) {
    const { user, isValid } = await this.authService.verifyCode(body.email, body.code);

    if (!isValid) {
      throw new UnauthorizedException('Неверный код подтверждения');
    }

    // Очищаем временные данные кода
    user.confirmationCode = null;
    user.codeCreatedAt = null;
    await this.usersService.saveUser(user);

    // 3. ГЕНЕРАЦИЯ ДВУХ ТОКЕНОВ (Вызываем метод из AuthService)
    const tokens = await this.authService.getTokens(user.id, user.email, user.role);
    
    // 4. СОХРАНЕНИЕ ХЕША REFRESH ТОКЕНА В БАЗУ
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);

    // Возвращаем оба токена клиенту
    return tokens;
  }

  @Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 удаления аккаунта за 5 минут
  @UseGuards(JwtAuthGuard)
  @Delete('delete-me')
  async deleteMe(@Request() req) {
    // ID пользователя мы берем из токена (поле sub или userId)
    const userId = req.user.userId; 
    await this.usersService.remove(userId);
    return { message: 'Ваш аккаунт успешно удален' };
  }

  // 2. Удаление по ID (например, для админки)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 удалений админом в минуту
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) // Добавляем RolesGuard вторым номером
  @Roles('admin') // Указываем, что только админ может сюда зайти
  @Delete('user/:id')
  async removeUser(@Param('id') id: string) {
    await this.usersService.remove(+id);
    return { message: `Пользователь с ID ${id} удален администратором` };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 обновлений токена в минуту
  @UseGuards(JwtAuthGuard) // Тут нужен отдельный гвард или просто проверка токена в теле
  @Post('refresh')
  async refresh(@Request() req, @Body() refreshTokenDto: RefreshTokenDto) {
    const userId = req.user.userId;
    return this.authService.refreshTokens(userId, refreshTokenDto.refreshToken);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 обновлений профиля в минуту
  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    // Используем твой универсальный метод update
    return this.usersService.update(req.user.userId, body);
  }
}