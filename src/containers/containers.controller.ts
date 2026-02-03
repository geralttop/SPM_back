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
    // Проверь в консоли, как называется поле id в твоем токене (sub или id)
    const userId = req.user.sub || req.user.userId; 
    return this.containersService.create(createContainerDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateContainerDto: UpdateContainerDto,
    @Request() req
  ) {
    return this.containersService.update(id, updateContainerDto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.containersService.remove(id, req.user.sub);
  }

  @Get()
  findAll() {
    return this.containersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.containersService.findOne(id);
  }
}