import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Delete, Param, BadRequestException, Patch, Res, Query, ParseIntPipe, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; // Добавь этот импорт
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { BlockedUserGuard } from './guards/blocked-user.guard';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CookieService } from './services/cookie.service';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FileUploadService } from './services/file-upload.service';
import { BioHistoryService } from '../users/bio-history.service';
import { UpdateMapSettingsDto } from '../users/dto/update-map-settings.dto';
import {
  DEFAULT_AVAILABLE_MAP_STYLES,
  DEFAULT_MAP_STYLE_KEY,
  ensureDefaultInAvailable,
  filterAllowedMapStyles,
  normalizeStoredMapSettings,
} from '../users/map-styles.util';
import * as fs from 'fs';
import * as path from 'path';
import { PointsService } from '../points/points.service';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService, // 2. Добавьте это поле сюда
    private readonly cookieService: CookieService,
    private readonly bioHistoryService: BioHistoryService,
    private readonly pointsService: PointsService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Регистрация', description: 'Создаёт нового пользователя. На почту отправляется 6-значный код подтверждения. Лимит: 5 попыток в минуту.' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Пользователь создан, на email отправлен код подтверждения', schema: { example: { message: 'Код подтверждения отправлен на witcher@kaermorhen.com' } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные или email/username уже заняты' })
  async register(@Body() body: RegisterDto) {
    // Теперь передаем 3 аргумента: email, password, username
    return this.authService.register(body.email, body.password, body.username);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Вход', description: 'Отправляет 6-значный код на email. После ввода кода используйте POST /auth/verify-login. Лимит: 5 попыток в минуту.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Код отправлен на email', schema: { example: { message: 'Код подтверждения отправлен на вашу почту' } } })
  @ApiUnauthorizedResponse({ description: 'Неверный email или пароль' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @SkipThrottle()
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Профиль', description: 'Возвращает данные текущего пользователя по JWT.' })
  @ApiOkResponse({ description: 'Данные профиля', type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Токен отсутствует или невалиден' })
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  async getProfile(@CurrentUserId() userId: number) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const settings = await this.usersService.getSettings(user.id);
    const countMap = await this.pointsService.getCreatedPointsCountsByAuthorIds([
      user.id,
    ]);
    const createdPointsCount = countMap.get(user.id) ?? 0;

    // Возвращаем актуальные данные профиля
    return {
      sub: user.id.toString(),
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      sidebarOrder: settings?.sidebarOrder || null,
      createdPointsCount,
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('verify-email')
  @ApiOperation({ summary: 'Подтверждение email', description: 'Подтверждает регистрацию по коду из письма. Устанавливает refresh token в httpOnly cookie и возвращает accessToken.' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiOkResponse({ description: 'Почта подтверждена', schema: { example: { message: 'Почта успешно подтверждена!', accessToken: 'eyJhbGciOiJIUzI1NiIs...' } } })
  @ApiUnauthorizedResponse({ description: 'Неверный или истёкший код' })
  async verifyEmail(@Body() body: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    this.logger.log(`verify-email: Начало проверки для ${body.email}`);
    
    const { user, isValid } = await this.authService.verifyCode(body.email, body.code);
    
    if (!isValid) {
      this.logger.warn('verify-email: Код невалиден');
      throw new UnauthorizedException('Неверный код подтверждения');
    }

    this.logger.log('verify-email: Код валиден, вызываем verifyUser');
    
    // Подтверждаем почту (метод verifyUser уже сохраняет изменения)
    const isVerified = await this.usersService.verifyUser(body.email, body.code);
    
    if (isVerified) {
      this.logger.log('verify-email: verifyUser вернул true, получаем обновленного пользователя');
      
      // Получаем обновленного пользователя из БД
      const updatedUser = await this.usersService.findByEmail(body.email);
      
      if (!updatedUser) {
        this.logger.warn('verify-email: Обновленный пользователь не найден');
        throw new UnauthorizedException('Пользователь не найден');
      }

      this.logger.log(`verify-email: Обновленный пользователь из БД: ${JSON.stringify({
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified,
      })}`);

      const accessToken = await this.authService.issueTokensAndSetCookie(updatedUser, res);

      this.logger.log('verify-email: Успешно завершено');

      return { 
        message: 'Почта успешно подтверждена!',
        accessToken,
      };
    }
    
    this.logger.warn('verify-email: verifyUser вернул false');
    throw new UnauthorizedException('Неверный код подтверждения');
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('verify-login')
  @ApiOperation({ summary: 'Подтверждение входа', description: 'Завершает двухфакторный вход по коду из письма. Устанавливает refresh token в cookie, возвращает accessToken.' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiOkResponse({ description: 'Вход выполнен', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', message: 'Вход выполнен успешно' } } })
  @ApiUnauthorizedResponse({ description: 'Неверный код подтверждения' })
  async verifyLogin(@Body() body: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    const { user, isValid } = await this.authService.verifyCode(body.email, body.code);

    if (!isValid) {
      throw new UnauthorizedException('Неверный код подтверждения');
    }

    // Очищаем временные данные кода
    await this.usersService.updateVerification(user.id, {
      confirmationCode: null,
      codeCreatedAt: null,
    });

    const accessToken = await this.authService.issueTokensAndSetCookie(user, res);

    return {
      accessToken,
      message: 'Вход выполнен успешно'
    };
  }

  @Throttle({ default: { limit: 2, ttl: 300000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete('delete-me')
  @ApiOperation({ summary: 'Удалить свой аккаунт', description: 'Безвозвратно удаляет аккаунт текущего пользователя. Лимит: 2 запроса за 5 минут.' })
  @ApiOkResponse({ description: 'Аккаунт удалён', schema: { example: { message: 'Ваш аккаунт успешно удален' } } })
  @ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
  async deleteMe(@CurrentUserId() userId: number) {
    await this.usersService.remove(userId);
    return { message: 'Ваш аккаунт успешно удален' };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard, RolesGuard)
  @Roles('admin')
  @Delete('user/:id')
  @ApiOperation({ summary: 'Удалить пользователя (админ)', description: 'Удаляет пользователя по ID. Доступно только администраторам.' })
  @ApiParam({ name: 'id', example: '5', description: 'ID пользователя' })
  @ApiOkResponse({ description: 'Пользователь удалён', schema: { example: { message: 'Пользователь с ID 5 удален администратором' } } })
  @ApiUnauthorizedResponse({ description: 'Требуется роль admin' })
  async removeUser(@Param('id') id: string) {
    await this.usersService.remove(+id);
    return { message: `Пользователь с ID ${id} удален администратором` };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Обновить токен', description: 'Выдаёт новую пару токенов по refresh token (из cookie или body). Обновлённый refresh записывается в cookie.' })
  @ApiBody({ required: false, schema: { properties: { refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' } } } })
  @ApiOkResponse({ description: 'Новый access token', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', message: 'Токен обновлен успешно' } } })
  @ApiUnauthorizedResponse({ description: 'Refresh token не найден или невалиден' })
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Получаем refresh token из cookie (приоритет) или из body (для обратной совместимости)
    const refreshToken = this.cookieService.getRefreshTokenFromCookie(req) || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token не найден');
    }

    // Декодируем refresh token чтобы получить userId
    const decoded = this.jwtService.decode(refreshToken) as any;
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Невалидный refresh token');
    }

    const tokens = await this.authService.refreshTokens(decoded.sub, refreshToken);
    
    // Устанавливаем новый refresh token в cookie
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);

    // Возвращаем только access token
    return {
      accessToken: tokens.accessToken,
      message: 'Токен обновлен успешно'
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch('update-profile')
  @ApiOperation({ summary: 'Обновить профиль', description: 'Обновляет username и/или bio текущего пользователя.' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ description: 'Профиль обновлён', schema: { example: { id: 1, username: 'geralt_rivia', email: 'witcher@kaermorhen.com', bio: 'Ведьмак из Каэр Морхена', role: 'user' } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные или username занят' })
  async updateProfile(@CurrentUserId() userId: number, @Body() body: UpdateProfileDto) {
    return this.usersService.update(userId, body);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('bio-history')
  @ApiOperation({ summary: 'История биографии (своя)', description: 'Снимки bio при сохранении профиля, новые сверху.' })
  @ApiOkResponse({ description: 'Список записей', schema: { example: [{ id: 1, text: 'Привет', createdAt: '2025-01-01T12:00:00.000Z' }] } })
  async getMyBioHistory(@CurrentUserId() userId: number) {
    return this.bioHistoryService.findByUserId(userId);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete('bio-history/:id')
  @ApiOperation({ summary: 'Удалить запись из истории биографии', description: 'Только своя запись.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ description: 'Удалено', schema: { example: { message: 'Запись удалена' } } })
  async deleteBioHistoryEntry(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.bioHistoryService.deleteByIdForUser(id, userId);
    return { message: 'Запись удалена' };
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('user/username/:username/bio-history')
  @ApiOperation({
    summary: 'История биографии (по username)',
    description: 'Публичный просмотр истории bio пользователя.',
  })
  @ApiParam({ name: 'username', example: 'geralt' })
  @ApiOkResponse({
    description: 'Список записей',
    schema: { example: [{ id: 1, text: 'Привет', createdAt: '2025-01-01T12:00:00.000Z' }] },
  })
  async getBioHistoryByUsername(@Param('username') username: string) {
    const normalized = decodeURIComponent(username.trim());
    const user = await this.usersService.findByUsername(normalized);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    return this.bioHistoryService.findByUserId(user.id);
  }

  @SkipThrottle()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Выход', description: 'Инвалидирует refresh token и очищает cookie.' })
  @ApiOkResponse({ description: 'Выход выполнен', schema: { example: { message: 'Выход выполнен успешно' } } })
  async logout(@CurrentUserId() userId: number, @Res({ passthrough: true }) res: Response) {
    await this.usersService.update(userId, { hashedRefreshToken: null });
    
    // Очищаем cookies
    this.cookieService.clearTokenCookies(res);
    
    return { message: 'Выход выполнен успешно' };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('search')
  @ApiOperation({ summary: 'Поиск пользователей', description: 'Поиск по username. Возвращает id, username, email, bio.' })
  @ApiQuery({ name: 'q', required: true, example: 'geralt', description: 'Строка поиска' })
  @ApiOkResponse({ description: 'Список пользователей', schema: { example: [{ id: 1, username: 'geralt', email: 'witcher@kaermorhen.com', bio: 'Ведьмак' }] } })
  async searchUsers(@Query('q') query: string) {
    const users = await this.usersService.searchByUsername(query);
    const countMap = await this.pointsService.getCreatedPointsCountsByAuthorIds(
      users.map((u) => u.id),
    );

    // Возвращаем только безопасные данные
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      role: user.role,
      createdPointsCount: countMap.get(user.id) ?? 0,
    }));
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('user/username/:username')
  @ApiOperation({
    summary: 'Профиль по username',
    description: 'Возвращает публичные данные пользователя по имени пользователя (для URL вида /user/:username).',
  })
  @ApiParam({ name: 'username', example: 'geralt', description: 'Имя пользователя' })
  @ApiOkResponse({
    description: 'Данные пользователя',
    schema: { example: { id: 1, username: 'geralt', email: 'witcher@kaermorhen.com', bio: 'Ведьмак', avatar: '/uploads/...' } },
  })
  @ApiBadRequestResponse({ description: 'Пользователь не найден' })
  async getUserByUsername(@Param('username') username: string) {
    const normalized = decodeURIComponent(username.trim());
    const user = await this.usersService.findByUsername(normalized);

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const countMap = await this.pointsService.getCreatedPointsCountsByAuthorIds([
      user.id,
    ]);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
      createdPointsCount: countMap.get(user.id) ?? 0,
    };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('user/:id')
  @ApiOperation({ summary: 'Профиль по ID', description: 'Возвращает публичные данные пользователя по ID (устаревший вариант; предпочтительно user/username/:username).' })
  @ApiParam({ name: 'id', example: '1', description: 'ID пользователя' })
  @ApiOkResponse({ description: 'Данные пользователя', schema: { example: { id: 1, username: 'geralt', email: 'witcher@kaermorhen.com', bio: 'Ведьмак' } } })
  @ApiBadRequestResponse({ description: 'Пользователь не найден' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const countMap = await this.pointsService.getCreatedPointsCountsByAuthorIds([
      user.id,
    ]);

    // Возвращаем только безопасные данные
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
      createdPointsCount: countMap.get(user.id) ?? 0,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch('sidebar-order')
  @ApiOperation({ summary: 'Порядок вкладок', description: 'Сохраняет порядок элементов в сайдбаре (массив ID в нужном порядке).' })
  @ApiBody({ schema: { example: { sidebarOrder: ['map', 'points', 'categories', 'containers'] } } })
  @ApiOkResponse({ description: 'Порядок сохранён', schema: { example: { message: 'Порядок вкладок обновлен', sidebarOrder: ['map', 'points', 'categories'] } } })
  async updateSidebarOrder(@CurrentUserId() userId: number, @Body() body: { sidebarOrder: string[] }) {
      await this.usersService.updateSettings(userId, { sidebarOrder: body.sidebarOrder });
      return { message: 'Порядок вкладок обновлен', sidebarOrder: body.sidebarOrder };
    }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('map-settings')
  @ApiOperation({ summary: 'Получить настройки карт', description: 'Возвращает настройки карт пользователя (доступные стили и стиль по умолчанию).' })
  @ApiOkResponse({ 
    description: 'Настройки карт', 
    schema: { 
      example: { 
        availableMapStyles: DEFAULT_AVAILABLE_MAP_STYLES,
        defaultMapStyle: DEFAULT_MAP_STYLE_KEY,
      } 
    } 
  })
  async getMapSettings(@CurrentUserId() userId: number) {
    const settings = await this.usersService.getSettings(userId);

    const { availableMapStyles, defaultMapStyle } = normalizeStoredMapSettings(
      settings?.availableMapStyles,
      settings?.defaultMapStyle,
    );

    const rawAv = settings?.availableMapStyles ?? null;
    const rawDef = settings?.defaultMapStyle ?? null;
    const dirty =
      JSON.stringify(availableMapStyles) !== JSON.stringify(rawAv) ||
      defaultMapStyle !== rawDef;

    if (dirty) {
      await this.usersService.updateSettings(userId, {
        availableMapStyles,
        defaultMapStyle,
      });
    }

    return {
      availableMapStyles,
      defaultMapStyle,
      pointCardInitialView: (settings?.pointCardInitialView as 'map' | 'photos') || 'map',
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch('map-settings')
  @ApiOperation({ summary: 'Обновить настройки карт', description: 'Сохраняет настройки карт пользователя (доступные стили и стиль по умолчанию).' })
  @ApiBody({ 
    schema: { 
      example: { 
        availableMapStyles: DEFAULT_AVAILABLE_MAP_STYLES,
        defaultMapStyle: DEFAULT_MAP_STYLE_KEY,
      } 
    } 
  })
  @ApiOkResponse({ 
    description: 'Настройки сохранены', 
    schema: { 
      example: { 
        message: 'Настройки карт обновлены',
        availableMapStyles: DEFAULT_AVAILABLE_MAP_STYLES,
        defaultMapStyle: DEFAULT_MAP_STYLE_KEY,
      } 
    } 
  })
  async updateMapSettings(
    @CurrentUserId() userId: number,
    @Body() body: UpdateMapSettingsDto,
  ) {
    if (body.availableMapStyles && body.availableMapStyles.length === 0) {
      throw new BadRequestException('At least one map style must be selected');
    }

    const raw = await this.usersService.getSettings(userId);
    const patch: Record<string, unknown> = {};

    if (body.pointCardInitialView !== undefined) {
      patch.pointCardInitialView = body.pointCardInitialView;
    }

    if (body.availableMapStyles !== undefined || body.defaultMapStyle !== undefined) {
      const nextAvailable =
        body.availableMapStyles !== undefined
          ? filterAllowedMapStyles(body.availableMapStyles)
          : filterAllowedMapStyles(raw?.availableMapStyles);
      let nextDefault =
        body.defaultMapStyle !== undefined
          ? body.defaultMapStyle
          : raw?.defaultMapStyle ?? DEFAULT_MAP_STYLE_KEY;
      nextDefault = ensureDefaultInAvailable(nextDefault, nextAvailable);
      patch.availableMapStyles = nextAvailable;
      patch.defaultMapStyle = nextDefault;
    }

    if (Object.keys(patch).length > 0) {
      await this.usersService.updateSettings(userId, patch as any);
    }

    const settings = await this.usersService.getSettings(userId);
    const { availableMapStyles, defaultMapStyle } = normalizeStoredMapSettings(
      settings?.availableMapStyles,
      settings?.defaultMapStyle,
    );

    return {
      message: 'Настройки карт обновлены',
      availableMapStyles,
      defaultMapStyle,
      pointCardInitialView: (settings?.pointCardInitialView as 'map' | 'photos') || 'map',
    };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Забыли пароль', description: 'Отправляет на email код для сброса пароля. Лимит: 3 запроса в минуту.' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ description: 'Код отправлен', schema: { example: { message: 'Если email зарегистрирован, на него отправлен код для сброса пароля' } } })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Сброс пароля', description: 'Устанавливает новый пароль по коду из письма (после forgot-password).' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ description: 'Пароль изменён', schema: { example: { message: 'Пароль успешно изменён' } } })
  @ApiBadRequestResponse({ description: 'Неверный или истёкший код' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }

  @Post('upload-avatar')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: FileUploadService.avatarStorage,
      fileFilter: FileUploadService.avatarFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Загрузить аватарку', description: 'Загружает изображение аватарки пользователя (макс. 5MB).' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Аватарка загружена', schema: { example: { message: 'Аватарка успешно загружена', avatarUrl: '/uploads/avatars/uuid.jpg' } } })
  async uploadAvatar(@CurrentUserId() userId: number, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Удаляем старую аватарку, если есть
    if (user.avatar) {
      const oldPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.update(userId, { avatar: avatarUrl });

    return {
      message: 'Аватарка успешно загружена',
      avatarUrl,
    };
  }

  @Delete('delete-avatar')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @ApiOperation({ summary: 'Удалить аватарку', description: 'Удаляет аватарку пользователя.' })
  @ApiOkResponse({ description: 'Аватарка удалена', schema: { example: { message: 'Аватарка успешно удалена' } } })
  async deleteAvatar(@CurrentUserId() userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (user.avatar) {
      const avatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      await this.usersService.update(userId, { avatar: null });
    }

    return { message: 'Аватарка успешно удалена' };
  }
}
