import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Если хочешь защитить создание точек

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
}