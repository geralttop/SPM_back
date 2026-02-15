import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { PointsService } from '../points/points.service';
import { CategoriesService } from '../categories/categories.service';
import { ContainersService } from '../containers/containers.service';

@ApiTags('Админка')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly pointsService: PointsService,
    private readonly categoriesService: CategoriesService,
    private readonly containersService: ContainersService,
  ) {}

  // Пользователи
  @Get('users')
  async getUsers(
    @Query('_start') start: string = '0',
    @Query('_end') end: string = '10',
    @Query('_sort') sort: string = 'id',
    @Query('_order') order: string = 'ASC',
  ) {
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const limit = endNum - startNum;
    
    const [users, total] = await this.usersService.findAllWithPagination({
      skip: startNum,
      take: limit,
      order: { [sort]: order.toUpperCase() },
    });

    return {
      data: users,
      total,
    };
  }

  @Get('users/:id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Put('users/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.usersService.update(id, updateData);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { id };
  }

  // Точки
  @Get('points')
  async getPoints(
    @Query('_start') start: string = '0',
    @Query('_end') end: string = '10',
    @Query('_sort') sort: string = 'createdAt',
    @Query('_order') order: string = 'DESC',
  ) {
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const limit = endNum - startNum;
    
    const [points, total] = await this.pointsService.findAllWithPagination({
      skip: startNum,
      take: limit,
      order: { [sort]: order.toUpperCase() },
      relations: ['author', 'category', 'container'],
    });

    return {
      data: points,
      total,
    };
  }

  @Get('points/:id')
  async getPoint(@Param('id') id: string) {
    return this.pointsService.findOne(id);
  }

  @Put('points/:id')
  async updatePoint(@Param('id') id: string, @Body() updateData: any) {
    return this.pointsService.update(id, updateData);
  }

  @Delete('points/:id')
  async deletePoint(@Param('id') id: string) {
    await this.pointsService.remove(id);
    return { id };
  }

  @Post('points')
  async createPoint(@Body() createData: any) {
    return this.pointsService.create(createData);
  }

  // Категории
  @Get('categories')
  async getCategories(
    @Query('_start') start: string = '0',
    @Query('_end') end: string = '10',
    @Query('_sort') sort: string = 'id',
    @Query('_order') order: string = 'ASC',
  ) {
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const limit = endNum - startNum;
    
    const [categories, total] = await this.categoriesService.findAllWithPagination({
      skip: startNum,
      take: limit,
      order: { [sort]: order.toUpperCase() },
      relations: ['author'],
    });

    return {
      data: categories,
      total,
    };
  }

  @Get('categories/:id')
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Put('categories/:id')
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.categoriesService.update(id, updateData);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return { id };
  }

  @Post('categories')
  async createCategory(@Body() createData: any) {
    return this.categoriesService.create(createData);
  }

  // Контейнеры
  @Get('containers')
  async getContainers(
    @Query('_start') start: string = '0',
    @Query('_end') end: string = '10',
    @Query('_sort') sort: string = 'createdAt',
    @Query('_order') order: string = 'DESC',
  ) {
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const limit = endNum - startNum;
    
    const [containers, total] = await this.containersService.findAllWithPagination({
      skip: startNum,
      take: limit,
      order: { [sort]: order.toUpperCase() },
      relations: ['author'],
    });

    return {
      data: containers,
      total,
    };
  }

  @Get('containers/:id')
  async getContainer(@Param('id') id: string) {
    return this.containersService.findOne(id);
  }

  @Put('containers/:id')
  async updateContainer(@Param('id') id: string, @Body() updateData: any) {
    return this.containersService.update(id, updateData);
  }

  @Delete('containers/:id')
  async deleteContainer(@Param('id') id: string) {
    await this.containersService.remove(id);
    return { id };
  }

  @Post('containers')
  async createContainer(@Body() createData: any) {
    return this.containersService.create(createData);
  }
}