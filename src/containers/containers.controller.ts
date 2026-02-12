import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete, Patch } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateContainerDto } from './dto/update-container.dto';

@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createContainerDto: CreateContainerDto) {
    // Используем правильное поле из JWT токена
    const userId = req.user.userId || req.user.sub; 
    return this.containersService.create(createContainerDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateContainerDto: UpdateContainerDto,
    @Request() req
  ) {
    return this.containersService.update(id, updateContainerDto, req.user.userId || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.containersService.remove(id, req.user.userId || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.containersService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.containersService.findOne(id);
  }
}