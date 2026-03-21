import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from 'src/auth/guards/blocked-user.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@ApiTags('Категории')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать категорию', description: 'Создаёт категорию с названием и опциональным цветом (HEX).' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Категория создана', schema: { example: { id: 1, name: 'Кафе', color: '#FF5733', authorId: 1 } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные' })
  async create(@CurrentUserId() userId: number, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить категорию', description: 'Обновляет название и/или цвет. Только автор.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Категория обновлена' })
  update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto, 
    @CurrentUserId() userId: number,
  ) {
    return this.categoriesService.updateCategory(+id, updateCategoryDto, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить категорию', description: 'Удаляет категорию. Только автор.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Категория удалена' })
  remove(@Param('id') id: string, @CurrentUserId() userId: number) {
    return this.categoriesService.removeCategory(+id, userId);
  }

  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список категорий', description: 'Все категории текущего пользователя.' })
  @ApiOkResponse({ description: 'Массив категорий', schema: { example: [{ id: 1, name: 'Кафе', color: '#FF5733' }, { id: 2, name: 'Парки', color: '#33FF57' }] } })
  findAll(@CurrentUserId() userId: number) {
    return this.categoriesService.findAll(userId);
  }
}