import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Delete, Param, BadRequestException, Patch, Res, Query, ParseIntPipe } from '@nestjs/common';
import type { Response } from 'express';
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
import { CookieService } from './services/cookie.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  // Добавляем usersService в конструктор
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService, // 2. Добавьте это поле сюда
    private readonly cookieService: CookieService,
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
  async getProfile(@Request() req) {
    // Загружаем актуальные данные пользователя из БД
    const user = await this.usersService.findById(req.user.userId);
    
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Возвращаем актуальные данные профиля
    return {
      sub: user.id.toString(),
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      username: user.username,
      bio: user.bio,
      sidebarOrder: user.sidebarOrder,
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 попытки подтверждения в минуту - КРИТИЧНО!
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    console.log('📧 verify-email: Начало проверки для', body.email);
    
    const { user, isValid } = await this.authService.verifyCode(body.email, body.code);
    
    if (!isValid) {
      console.log('❌ verify-email: Код невалиден');
      throw new UnauthorizedException('Неверный код подтверждения');
    }

    console.log('✅ verify-email: Код валиден, вызываем verifyUser');
    
    // Подтверждаем почту (метод verifyUser уже сохраняет изменения)
    const isVerified = await this.usersService.verifyUser(body.email, body.code);
    
    if (isVerified) {
      console.log('✅ verify-email: verifyUser вернул true, получаем обновленного пользователя');
      
      // Получаем обновленного пользователя из БД
      const updatedUser = await this.usersService.findByEmail(body.email);
      
      if (!updatedUser) {
        console.log('❌ verify-email: Обновленный пользователь не найден');
        throw new UnauthorizedException('Пользователь не найден');
      }

      console.log('🔍 verify-email: Обновленный пользователь из БД:', {
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified,
        confirmationCode: updatedUser.confirmationCode,
      });

      // Генерируем токены
      const tokens = await this.authService.getTokens(updatedUser.id, updatedUser.email, updatedUser.role, updatedUser.username);
      await this.authService.updateRefreshToken(updatedUser.id, tokens.refreshToken);

      // Устанавливаем refresh token в httpOnly cookie
      this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);

      console.log('🎉 verify-email: Успешно завершено');

      // Возвращаем только access token в теле ответа
      return { 
        message: 'Почта успешно подтверждена!',
        accessToken: tokens.accessToken,
        // refreshToken больше не отправляется в теле - он в cookie
      };
    }
    
    console.log('❌ verify-email: verifyUser вернул false');
    throw new UnauthorizedException('Неверный код подтверждения');
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 попытки подтверждения входа в минуту - КРИТИЧНО!
  @Post('verify-login')
  async verifyLogin(@Body() body: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    const { user, isValid } = await this.authService.verifyCode(body.email, body.code);

    if (!isValid) {
      throw new UnauthorizedException('Неверный код подтверждения');
    }

    // Очищаем временные данные кода
    await this.usersService.update(user.id, {
      confirmationCode: null,
      codeCreatedAt: null,
    });

    // 3. ГЕНЕРАЦИЯ ДВУХ ТОКЕНОВ (Вызываем метод из AuthService)
    const tokens = await this.authService.getTokens(user.id, user.email, user.role, user.username);
    
    // 4. СОХРАНЕНИЕ ХЕША REFRESH ТОКЕНА В БАЗУ
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);

    // Устанавливаем refresh token в httpOnly cookie
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);

    // Возвращаем только access token
    return {
      accessToken: tokens.accessToken,
      message: 'Вход выполнен успешно'
    };
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
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.userId;
    
    // Получаем refresh token из cookie (приоритет) или из body (для обратной совместимости)
    const refreshToken = this.cookieService.getRefreshTokenFromCookie(req) || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token не найден');
    }

    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    
    // Устанавливаем новый refresh token в cookie
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);

    // Возвращаем только access token
    return {
      accessToken: tokens.accessToken,
      message: 'Токен обновлен успешно'
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 обновлений профиля в минуту
  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    // Используем твой универсальный метод update
    return this.usersService.update(req.user.userId, body);
  }

  @SkipThrottle() // Logout не нуждается в жестком ограничении
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.userId;
    
    // Удаляем refresh token из БД
    await this.usersService.update(userId, { hashedRefreshToken: null });
    
    // Очищаем cookies
    this.cookieService.clearTokenCookies(res);
    
    return { message: 'Выход выполнен успешно' };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 поисковых запросов в минуту
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(@Request() req, @Query('q') query: string) {
    const users = await this.usersService.searchByUsername(query);
    
    // Возвращаем только безопасные данные
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
    }));
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 запросов профиля в минуту
  @UseGuards(JwtAuthGuard)
  @Get('user/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    
    // Возвращаем только безопасные данные
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
    };
  }

    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 обновлений порядка в минуту
    @UseGuards(JwtAuthGuard)
    @Patch('sidebar-order')
    async updateSidebarOrder(@Request() req, @Body() body: { sidebarOrder: string[] }) {
      const userId = req.user.userId;
      await this.usersService.update(userId, { sidebarOrder: body.sidebarOrder });
      return { message: 'Порядок вкладок обновлен', sidebarOrder: body.sidebarOrder };
    }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 запроса в минуту
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 попыток в минуту
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }
}
