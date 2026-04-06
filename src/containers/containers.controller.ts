import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ContainersService } from './containers.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateContainerDto } from './dto/update-container.dto';

@ApiTags('Контейнеры')
@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать контейнер', description: 'Контейнер — группа точек (например, «Мои места»).' })
  @ApiBody({ type: CreateContainerDto })
  @ApiCreatedResponse({ description: 'Контейнер создан', schema: { example: { id: 'uuid-...', title: 'Мои любимые места', description: 'Подборка кафе', color: '#3B82F6', authorId: 1 } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные' })
  async create(@CurrentUserId() userId: number, @Body() createContainerDto: CreateContainerDto) {
    return this.containersService.createContainer(createContainerDto, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить контейнер', description: 'Обновляет название, описание и/или цвет. Только автор.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: UpdateContainerDto })
  @ApiOkResponse({ description: 'Контейнер обновлён' })
  update(
    @Param('id') id: string, 
    @Body() updateContainerDto: UpdateContainerDto,
    @CurrentUserId() userId: number,
  ) {
    return this.containersService.updateContainer(id, updateContainerDto, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить контейнер', description: 'Удаляет контейнер. Только автор.' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Контейнер удалён' })
  remove(@Param('id') id: string, @CurrentUserId() userId: number) {
    return this.containersService.removeContainer(id, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список контейнеров', description: 'Все контейнеры текущего пользователя.' })
  @ApiOkResponse({ description: 'Массив контейнеров' })
  findAll(@CurrentUserId() userId: number) {
    return this.containersService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Контейнер по ID (карта шаринга)',
    description:
      'Контейнер с полными точками для отображения на карте. Требуется JWT. Системные контейнеры (authorId = null) — 403.',
  })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Контейнер с точками (author, category, photos, commentsCount)' })
  @ApiUnauthorizedResponse({ description: 'Нет или недействителен JWT' })
  @ApiForbiddenResponse({ description: 'Системный контейнер (шаринг запрещён)' })
  @ApiNotFoundResponse({ description: 'Контейнер не найден' })
  findOne(@Param('id') id: string) {
    return this.containersService.findForShareMap(id);
  }
}