import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Delete, Param, BadRequestException, Patch } from '@nestjs/common';
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

  @Post('register')
  async register(@Body() body: RegisterDto) {
    // Теперь передаем 3 аргумента: email, password, username
    return this.authService.register(body.email, body.password, body.username);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

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

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyCodeDto) {
    const user = await this.usersService.findByEmail(body.email);
    
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Проверка времени (5 минут)
    if (user.codeCreatedAt) {
      const now = new Date();
      const diffInMinutes = (now.getTime() - new Date(user.codeCreatedAt).getTime()) / 1000 / 60;

      if (diffInMinutes > 5) {
        throw new BadRequestException('Срок действия кода истек (5 минут). Зарегистрируйтесь заново.');
      }
    }

    // Проверка кода
    if (user.confirmationCode === body.code && body.code !== null) {
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
    }
    
    throw new UnauthorizedException('Неверный код подтверждения');
  }

  @Post('verify-login')
  async verifyLogin(@Body() body: VerifyCodeDto) {
    const user = await this.usersService.findByEmail(body.email);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // 1. ПРОВЕРКА ВРЕМЕНИ (5 минут)
    if (user.codeCreatedAt) {
      const now = new Date();
      const diffInMinutes = (now.getTime() - new Date(user.codeCreatedAt).getTime()) / 1000 / 60;

      if (diffInMinutes > 5) {
        throw new BadRequestException('Срок действия кода истек (5 минут). Запросите новый.');
      }
    }

    // 2. ПРОВЕРКА КОДА
    if (user.confirmationCode === body.code && body.code !== null) {
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

    throw new UnauthorizedException('Неверный код подтверждения');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-me')
  async deleteMe(@Request() req) {
    // ID пользователя мы берем из токена (поле sub или userId)
    const userId = req.user.userId; 
    await this.usersService.remove(userId);
    return { message: 'Ваш аккаунт успешно удален' };
  }

  // 2. Удаление по ID (например, для админки)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) // Добавляем RolesGuard вторым номером
  @Roles('admin') // Указываем, что только админ может сюда зайти
  @Delete('user/:id')
  async removeUser(@Param('id') id: string) {
    await this.usersService.remove(+id);
    return { message: `Пользователь с ID ${id} удален администратором` };
  }

  @UseGuards(JwtAuthGuard) // Тут нужен отдельный гвард или просто проверка токена в теле
  @Post('refresh')
  async refresh(@Request() req, @Body() refreshTokenDto: RefreshTokenDto) {
    const userId = req.user.userId;
    return this.authService.refreshTokens(userId, refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    // Используем твой универсальный метод update
    return this.usersService.update(req.user.userId, body);
  }
}