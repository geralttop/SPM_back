import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatePointDto } from './dto/update-point.dto';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createPointDto: CreatePointDto) {
    const userId = req.user.userId || req.user.sub;
    return this.pointsService.create(createPointDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req, @Query('userId') userId?: string) {
    const currentUserId = req.user.userId || req.user.sub;
    
    // Если передан userId в query, возвращаем точки этого пользователя
    // Иначе возвращаем точки текущего пользователя
    const targetUserId = userId ? parseInt(userId) : currentUserId;
    
    return this.pointsService.findByUser(targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getFeed(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user.userId || req.user.sub;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.pointsService.getFeed(userId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() updatePointDto: UpdatePointDto) {
    const userId = req.user.userId || req.user.sub;
    return this.pointsService.update(id, updatePointDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId || req.user.sub;
    return this.pointsService.remove(id, userId);
  }
}
