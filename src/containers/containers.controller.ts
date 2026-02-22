import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { ContainersService } from './containers.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateContainerDto } from './dto/update-container.dto';

@ApiTags('Контейнеры')
@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать контейнер', description: 'Контейнер — группа точек (например, «Мои места»).' })
  @ApiBody({ type: CreateContainerDto })
  @ApiCreatedResponse({ description: 'Контейнер создан', schema: { example: { id: 'uuid-...', title: 'Мои любимые места', description: 'Подборка кафе', authorId: 1 } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные' })
  async create(@Request() req, @Body() createContainerDto: CreateContainerDto) {
    // Используем правильное поле из JWT токена
    const userId = req.user.userId || req.user.sub; 
    return this.containersService.createContainer(createContainerDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить контейнер', description: 'Обновляет название и/или описание. Только автор.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: UpdateContainerDto })
  @ApiOkResponse({ description: 'Контейнер обновлён' })
  update(
    @Param('id') id: string, 
    @Body() updateContainerDto: UpdateContainerDto,
    @Request() req
  ) {
    return this.containersService.updateContainer(id, updateContainerDto, req.user.userId || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить контейнер', description: 'Удаляет контейнер. Только автор.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Контейнер удалён' })
  remove(@Param('id') id: string, @Request() req) {
    return this.containersService.removeContainer(id, req.user.userId || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список контейнеров', description: 'Все контейнеры текущего пользователя.' })
  @ApiOkResponse({ description: 'Массив контейнеров' })
  findAll(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.containersService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Контейнер по ID', description: 'Публичный эндпоинт: один контейнер по UUID (без авторизации).' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Данные контейнера с точками' })
  findOne(@Param('id') id: string) {
    return this.containersService.findOne(id);
  }
}