import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdatePointDto } from './dto/update-point.dto';

@ApiTags('Точки на карте')
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

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
