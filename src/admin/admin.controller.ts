import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { PointsService } from '../points/points.service';
import { CategoriesService } from '../categories/categories.service';
import { ContainersService } from '../containers/containers.service';
import { ReportsService } from '../reports/reports.service';

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
    private readonly reportsService: ReportsService,
  ) {}

  // Статистика для дашборда
  @Get('stats')
  async getStats() {
    const [users] = await this.usersService.findAllWithPagination({ skip: 0, take: 1000 });
    const [points] = await this.pointsService.findAllWithPagination({ 
      skip: 0, 
      take: 1000,
      relations: ['author', 'category']
    });
    const [categories] = await this.categoriesService.findAllWithPagination({ skip: 0, take: 1000 });
    const [containers] = await this.containersService.findAllWithPagination({ skip: 0, take: 1000 });

    // Статистика по пользователям
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;
    const verifiedCount = users.filter(u => u.isEmailVerified).length;

    // Статистика по точкам по категориям
    const pointsByCategory = categories.map(cat => ({
      name: cat.name,
      count: points.filter(p => p.category?.id === cat.id).length,
      color: cat.color,
    }));

    // Статистика по точкам по авторам (топ 10)
    const pointsByAuthor = users
      .map(user => ({
        username: user.username,
        count: points.filter(p => p.authorId === user.id).length,
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Статистика по датам создания точек (последние 30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pointsByDate = points
      .filter(p => new Date(p.createdAt) >= thirtyDaysAgo)
      .reduce((acc, point) => {
        const date = new Date(point.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const pointsTimeline = Object.entries(pointsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totals: {
        users: users.length,
        points: points.length,
        categories: categories.length,
        containers: containers.length,
      },
      users: {
        admins: adminCount,
        regularUsers: userCount,
        verified: verifiedCount,
        unverified: users.length - verifiedCount,
      },
      pointsByCategory,
      pointsByAuthor,
      pointsTimeline,
    };
  }

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

  // Жалобы
  @Get('reports')
  async getReports(
    @Query('_start') start: string = '0',
    @Query('_end') end: string = '10',
    @Query('_sort') sort: string = 'createdAt',
    @Query('_order') order: string = 'DESC',
    @Query('status') status?: string,
  ) {
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const limit = endNum - startNum;
    const page = Math.floor(startNum / limit) + 1;
    
    const result = await this.reportsService.findAll(page, limit, status);
    
    return {
      data: result.reports,
      total: result.total,
    };
  }

  @Get('reports/:id')
  async getReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Put('reports/:id')
  async updateReport(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateData: any,
    @Request() req,
  ) {
    return this.reportsService.update(id, updateData, req.user.id);
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id', ParseIntPipe) id: number) {
    await this.reportsService.remove(id);
    return { id };
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { action: 'block' | 'dismiss'; adminNotes?: string },
    @Request() req,
  ) {
    console.log(`Admin resolving report ${id} with action: ${body.action}`);
    console.log('Admin user:', req.user);
    return this.reportsService.resolveReport(id, req.user.id, body.action, body.adminNotes);
  }

  // Блокировка пользователей
  @Post('users/:id/block')
  async blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    return this.usersService.blockUser(id, body.reason);
  }

  @Post('users/:id/unblock')
  async unblockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unblockUser(id);
  }

  @Get('users/blocked')
  async getBlockedUsers() {
    return this.usersService.getBlockedUsers();
  }
}