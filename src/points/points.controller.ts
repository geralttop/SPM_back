import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatePointDto } from './dto/update-point.dto';

@ApiTags('Точки на карте')
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать точку', description: 'Добавляет новую точку на карту. Требуется контейнер (UUID) и категория (id).' })
  @ApiBody({ type: CreatePointDto })
  @ApiCreatedResponse({ description: 'Точка создана', schema: { example: { id: 'uuid-...', name: 'Кофейня у замка', lat: 55.7558, lng: 37.6173, containerId: '...', categoryId: 1, authorId: 1, createdAt: '2025-01-15T12:00:00.000Z' } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные или контейнер/категория не найдены' })
  async create(@Request() req, @Body() createPointDto: CreatePointDto) {
    const userId = req.user.userId || req.user.sub;
    return this.pointsService.createPoint(createPointDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список точек', description: 'Точки текущего пользователя или другого по query userId.' })
  @ApiQuery({ name: 'userId', required: false, example: '1', description: 'ID пользователя (если не передан — текущий)' })
  @ApiOkResponse({ description: 'Массив точек пользователя' })
  async findAll(@Request() req, @Query('userId') userId?: string) {
    const currentUserId = req.user.userId || req.user.sub;
    
    // Если передан userId в query, возвращаем точки этого пользователя
    // Иначе возвращаем точки текущего пользователя
    const targetUserId = userId ? parseInt(userId) : currentUserId;
    
    return this.pointsService.findByUser(targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Лента точек', description: 'Лента точек из подписок с пагинацией.' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @ApiOkResponse({ description: 'Объект с массивом точек и метаданными пагинации' })
  async getFeed(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user.userId || req.user.sub;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.pointsService.getFeed(userId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить точку', description: 'Обновляет точку. Только автор может менять.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'UUID точки' })
  @ApiBody({ type: UpdatePointDto })
  @ApiOkResponse({ description: 'Обновлённая точка' })
  @ApiBadRequestResponse({ description: 'Точка не найдена или нет прав' })
  async update(@Request() req, @Param('id') id: string, @Body() updatePointDto: UpdatePointDto) {
    const userId = req.user.userId || req.user.sub;
    return this.pointsService.updatePoint(id, updatePointDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить точку', description: 'Удаляет точку. Только автор.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Точка удалена' })
  @ApiBadRequestResponse({ description: 'Точка не найдена или нет прав' })
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId || req.user.sub;
    return this.pointsService.removePoint(id, userId);
  }
}
