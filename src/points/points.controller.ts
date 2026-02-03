import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete } from '@nestjs/common';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Если хочешь защитить создание точек
import { UpdatePointDto } from './dto/update-point.dto';

@Controller('points') // Указываем префикс пути
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Post()
  // @UseGuards(JwtAuthGuard) // Раскомментируй, если точку может создать только залогиненный юзер
  async create(@Body() createPointDto: CreatePointDto) {
    return this.pointsService.create(createPointDto);
  }

  @Get()
  async findAll() {
    return this.pointsService.findAll();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePointDto: UpdatePointDto) {
    return this.pointsService.update(id, updatePointDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard) // Раскомментируй, если хочешь защитить удаление
  async remove(@Param('id') id: string) {
    return this.pointsService.remove(id);
  }
}