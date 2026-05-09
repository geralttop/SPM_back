import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_APP_THROTTLE } from '../common/throttle-skip-app';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdatePointDto } from './dto/update-point.dto';
import { FileUploadService } from '../auth/services/file-upload.service';
import { MAX_PHOTOS_PER_POINT } from './points.constants';
import { PointHistoryService } from './point-history.service';

@ApiTags('Точки на карте')
@Controller('points')
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly pointHistoryService: PointHistoryService,
  ) {}

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('by-category/:categoryId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Точки по категории (для карты)', description: 'Возвращает точки выбранной категории по id. Требуется JWT.' })
  @ApiParam({ name: 'categoryId', required: true, example: '1', description: 'ID категории' })
  @ApiOkResponse({ description: 'Массив точек категории' })
  async findByCategory(
    @Param('categoryId') categoryId: string,
  ) {
    const parsed = parseInt(categoryId);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('Некорректный categoryId');
    }
    return this.pointsService.findByCategoryForMap(parsed);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать точку', description: 'Добавляет новую точку на карту. Требуется контейнер (UUID) и категория (id).' })
  @ApiBody({ type: CreatePointDto })
  @ApiCreatedResponse({ description: 'Точка создана', schema: { example: { id: 'uuid-...', name: 'Кофейня у замка', lat: 55.7558, lng: 37.6173, containerId: '...', categoryId: 1, authorId: 1, createdAt: '2025-01-15T12:00:00.000Z' } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные или контейнер/категория не найдены' })
  async create(@CurrentUserId() userId: number, @Body() createPointDto: CreatePointDto) {
    return this.pointsService.createPoint(createPointDto, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список точек', description: 'Точки текущего пользователя или другого по query userId.' })
  @ApiQuery({ name: 'userId', required: false, example: '1', description: 'ID пользователя (если не передан — текущий)' })
  @ApiOkResponse({ description: 'Массив точек пользователя' })
  async findAll(@CurrentUserId() currentUserId: number, @Query('userId') userId?: string) {
    const targetUserId = userId ? parseInt(userId) : currentUserId;
    return this.pointsService.findByUser(targetUserId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Лента точек', description: 'Лента точек из подписок с пагинацией.' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @ApiOkResponse({ description: 'Объект с массивом точек и метаданными пагинации' })
  async getFeed(@CurrentUserId() userId: number, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.pointsService.getFeed(userId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Одна точка по UUID',
    description:
      'Возвращает точку по UUID (требуется JWT). С query fromContainer — контекст перехода с /map?container=… (UUID контейнера).',
  })
  @ApiParam({ name: 'id', description: 'UUID точки' })
  @ApiQuery({
    name: 'fromContainer',
    required: false,
    description: 'UUID контейнера, если переход с /map?container=…',
  })
  @ApiOkResponse({ description: 'Точка с категорией, контейнером, автором, фото и commentsCount' })
  async findOne(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Query('fromContainer') fromContainer?: string,
  ) {
    return this.pointsService.findOneForViewer(id, userId, {
      fromContainerId: fromContainer,
    });
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @SkipThrottle(SKIP_APP_THROTTLE)
  @Get(':id/history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'История точки',
    description:
      'Возвращает историю точки. Доступ такой же, как к самой точке: вы автор или подписаны на автора.',
  })
  @ApiParam({ name: 'id', description: 'UUID точки' })
  @ApiQuery({
    name: 'fromContainer',
    required: false,
    description: 'UUID контейнера (шаринг карты), см. GET /points/:id',
  })
  @ApiOkResponse({ description: 'Массив записей истории (DESC по createdAt)' })
  async getHistory(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Query('fromContainer') fromContainer?: string,
  ) {
    await this.pointsService.findOneForViewer(id, userId, {
      fromContainerId: fromContainer,
    });
    return this.pointHistoryService.list(id);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Post(':id/history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Добавить запись истории точки',
    description:
      'Создаёт запись истории из текущего состояния точки. Только автор точки.',
  })
  @ApiParam({ name: 'id', description: 'UUID точки' })
  @ApiCreatedResponse({ description: 'Созданная запись истории' })
  async createHistoryEntry(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ) {
    return this.pointHistoryService.createSnapshot(id, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete(':id/history/:historyId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Удалить запись истории точки',
    description: 'Удаляет запись истории. Только автор точки.',
  })
  @ApiParam({ name: 'id', description: 'UUID точки' })
  @ApiParam({ name: 'historyId', description: 'UUID записи истории' })
  @ApiOkResponse({ description: 'Запись истории удалена' })
  async deleteHistoryEntry(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Param('historyId') historyId: string,
  ) {
    await this.pointHistoryService.deleteEntry(id, historyId, userId);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Post(':id/photos')
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('files', MAX_PHOTOS_PER_POINT, {
      storage: FileUploadService.pointStorage,
      fileFilter: FileUploadService.pointFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Загрузить фотографии к точке',
    description:
      'Поле files — файлы изображений. Опционально dimensions — JSON-массив { width, height } в том же порядке.',
  })
  @ApiParam({ name: 'id', description: 'UUID точки' })
  @ApiOkResponse({ description: 'Точка с обновлённым списком фото' })
  async uploadPhotos(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('dimensions') dimensionsRaw?: string,
  ) {
    let dimensions: { width?: number; height?: number }[] = [];
    if (dimensionsRaw) {
      try {
        const parsed = JSON.parse(dimensionsRaw) as unknown;
        if (Array.isArray(parsed)) {
          dimensions = parsed.map((item: { width?: number; height?: number }) => ({
            width: typeof item?.width === 'number' ? item.width : undefined,
            height: typeof item?.height === 'number' ? item.height : undefined,
          }));
        }
      } catch {
        throw new BadRequestException('Некорректный JSON в dimensions');
      }
    }
    return this.pointsService.addPointPhotos(id, userId, files || [], dimensions);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete(':id/photos/:photoId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить фотографию точки', description: 'Только автор точки.' })
  @ApiParam({ name: 'id', description: 'UUID точки' })
  @ApiParam({ name: 'photoId', description: 'UUID фотографии' })
  @ApiOkResponse({ description: 'Точка после удаления фото' })
  async deletePhoto(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.pointsService.deletePointPhoto(id, photoId, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить точку', description: 'Обновляет точку. Только автор может менять.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'UUID точки' })
  @ApiBody({ type: UpdatePointDto })
  @ApiOkResponse({ description: 'Обновлённая точка' })
  @ApiBadRequestResponse({ description: 'Точка не найдена или нет прав' })
  async update(@CurrentUserId() userId: number, @Param('id') id: string, @Body() updatePointDto: UpdatePointDto) {
    return this.pointsService.updatePoint(id, updatePointDto, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить точку', description: 'Удаляет точку. Только автор.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Точка удалена' })
  @ApiBadRequestResponse({ description: 'Точка не найдена или нет прав' })
  async remove(@CurrentUserId() userId: number, @Param('id') id: string) {
    return this.pointsService.removePoint(id, userId);
  }
}
