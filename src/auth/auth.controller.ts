import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Delete, Param, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; // Добавь этот импорт
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';

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
    const isVerified = await this.usersService.verifyUser(body.email, body.code);
    if (isVerified) {
      return { message: 'Почта успешно подтверждена!' };
    }
    throw new UnauthorizedException('Неверный код подтверждения');
  }

  @Post('verify-login')
  async verifyLogin(@Body() body: VerifyCodeDto) {
    const user = await this.usersService.findByEmail(body.email);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // ПРОВЕРКА ВРЕМЕНИ (5 минут)
    if (user.codeCreatedAt) {
      const now = new Date();
      const diffInMinutes = (now.getTime() - user.codeCreatedAt.getTime()) / 1000 / 60;

      if (diffInMinutes > 5) {
        throw new BadRequestException('Срок действия кода истек (5 минут). Запросите новый.');
      }
    }

    // Дальше твоя обычная проверка кода
    if (user.confirmationCode === body.code && body.code !== null) {
      user.confirmationCode = null;
      user.codeCreatedAt = null; // Очищаем и время тоже
      await this.usersService.saveUser(user);

      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
      };
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
  @UseGuards(JwtAuthGuard)
  @Delete('user/:id')
  async removeUser(@Param('id') id: string) {
    await this.usersService.remove(+id); // + превращает строку в число
    return { message: `Пользователь с ID ${id} удален` };
  }

}