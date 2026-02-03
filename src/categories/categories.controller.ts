import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    // Проверь в консоли: console.log(req.user)
    // Обычно в JWT поле называется 'sub'
    const userId = req.user.sub || req.user.id; 
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto, 
    @Request() req
  ) {
    return this.categoriesService.update(+id, updateCategoryDto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.categoriesService.remove(+id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.sub);
  }
}