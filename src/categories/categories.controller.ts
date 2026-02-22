import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Категории')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать категорию', description: 'Создаёт категорию с названием и опциональным цветом (HEX).' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Категория создана', schema: { example: { id: 1, name: 'Кафе', color: '#FF5733', authorId: 1 } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные' })
  async create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    // Используем правильное поле из JWT токена
    const userId = req.user.userId || req.user.sub; 
    return this.categoriesService.createCategory(createCategoryDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить категорию', description: 'Обновляет название и/или цвет. Только автор.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Категория обновлена' })
  update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto, 
    @Request() req
  ) {
    return this.categoriesService.updateCategory(+id, updateCategoryDto, req.user.userId || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить категорию', description: 'Удаляет категорию. Только автор.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Категория удалена' })
  remove(@Param('id') id: string, @Request() req) {
    return this.categoriesService.removeCategory(+id, req.user.userId || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список категорий', description: 'Все категории текущего пользователя.' })
  @ApiOkResponse({ description: 'Массив категорий', schema: { example: [{ id: 1, name: 'Кафе', color: '#FF5733' }, { id: 2, name: 'Парки', color: '#33FF57' }] } })
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.userId || req.user.sub);
  }
}