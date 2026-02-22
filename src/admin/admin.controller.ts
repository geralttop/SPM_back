import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
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

  @Get('stats')
  @ApiOperation({ summary: 'Статистика дашборда', description: 'Сводка: пользователи (всего, админы, верифицированные), точки по категориям и авторам, лента по датам, контейнеры. Только для админов.' })
  @ApiOkResponse({ description: 'Объект totals, users, pointsByCategory, pointsByAuthor, pointsTimeline' })
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

  @Get('users')
  @ApiOperation({ summary: 'Список пользователей (пагинация)', description: 'Параметры как в react-admin: _start, _end, _sort, _order.' })
  @ApiQuery({ name: '_start', example: '0' })
  @ApiQuery({ name: '_end', example: '10' })
  @ApiQuery({ name: '_sort', example: 'id' })
  @ApiQuery({ name: '_order', example: 'ASC' })
  @ApiOkResponse({ description: '{ data: User[], total: number }' })
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
  @ApiOperation({ summary: 'Пользователь по ID' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Полные данные пользователя' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Обновить пользователя', description: 'Любые поля (username, email, role, bio, isEmailVerified и т.д.).' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ schema: { example: { username: 'new_name', role: 'user', bio: 'Обновлённая био' } } })
  @ApiOkResponse({ description: 'Обновлённый пользователь' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.usersService.update(id, updateData);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: '{ id }' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { id };
  }

  @Get('points')
  @ApiOperation({ summary: 'Список точек (пагинация)', description: 'С relations: author, category, container.' })
  @ApiQuery({ name: '_start', example: '0' })
  @ApiQuery({ name: '_end', example: '10' })
  @ApiQuery({ name: '_sort', example: 'createdAt' })
  @ApiQuery({ name: '_order', example: 'DESC' })
  @ApiOkResponse({ description: '{ data: Point[], total }' })
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
  @ApiOperation({ summary: 'Точка по ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Данные точки' })
  async getPoint(@Param('id') id: string) {
    return this.pointsService.findOne(id);
  }

  @Put('points/:id')
  @ApiOperation({ summary: 'Обновить точку' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ schema: { example: { name: 'Новое название', lat: 55.76, lng: 37.62, categoryId: 2 } } })
  @ApiOkResponse({ description: 'Обновлённая точка' })
  async updatePoint(@Param('id') id: string, @Body() updateData: any) {
    return this.pointsService.update(id, updateData);
  }

  @Delete('points/:id')
  @ApiOperation({ summary: 'Удалить точку' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: '{ id }' })
  async deletePoint(@Param('id') id: string) {
    await this.pointsService.remove(id);
    return { id };
  }

  @Post('points')
  @ApiOperation({ summary: 'Создать точку (от имени админа)', description: 'Те же поля, что и в обычном CreatePointDto; authorId можно задать или будет от админа.' })
  @ApiBody({ schema: { example: { name: 'Новая точка', lat: 55.7558, lng: 37.6173, containerId: 'uuid-...', categoryId: 1 } } })
  @ApiCreatedResponse({ description: 'Созданная точка' })
  async createPoint(@Body() createData: any) {
    return this.pointsService.create(createData);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Список категорий (пагинация)' })
  @ApiQuery({ name: '_start', example: '0' })
  @ApiQuery({ name: '_end', example: '10' })
  @ApiQuery({ name: '_sort', example: 'id' })
  @ApiQuery({ name: '_order', example: 'ASC' })
  @ApiOkResponse({ description: '{ data: Category[], total }' })
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
  @ApiOperation({ summary: 'Категория по ID' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Данные категории' })
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Обновить категорию' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ schema: { example: { name: 'Новое имя', color: '#00FF00' } } })
  @ApiOkResponse({ description: 'Обновлённая категория' })
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.categoriesService.update(id, updateData);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Удалить категорию' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: '{ id }' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return { id };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Создать категорию' })
  @ApiBody({ schema: { example: { name: 'Кафе', color: '#FF5733' } } })
  @ApiCreatedResponse({ description: 'Созданная категория' })
  async createCategory(@Body() createData: any) {
    return this.categoriesService.create(createData);
  }

  @Get('containers')
  @ApiOperation({ summary: 'Список контейнеров (пагинация)' })
  @ApiQuery({ name: '_start', example: '0' })
  @ApiQuery({ name: '_end', example: '10' })
  @ApiQuery({ name: '_sort', example: 'createdAt' })
  @ApiQuery({ name: '_order', example: 'DESC' })
  @ApiOkResponse({ description: '{ data: Container[], total }' })
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
  @ApiOperation({ summary: 'Контейнер по ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Данные контейнера' })
  async getContainer(@Param('id') id: string) {
    return this.containersService.findOne(id);
  }

  @Put('containers/:id')
  @ApiOperation({ summary: 'Обновить контейнер' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ schema: { example: { title: 'Новое название', description: 'Новое описание' } } })
  @ApiOkResponse({ description: 'Обновлённый контейнер' })
  async updateContainer(@Param('id') id: string, @Body() updateData: any) {
    return this.containersService.update(id, updateData);
  }

  @Delete('containers/:id')
  @ApiOperation({ summary: 'Удалить контейнер' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: '{ id }' })
  async deleteContainer(@Param('id') id: string) {
    await this.containersService.remove(id);
    return { id };
  }

  @Post('containers')
  @ApiOperation({ summary: 'Создать контейнер' })
  @ApiBody({ schema: { example: { title: 'Мои места', description: 'Подборка' } } })
  @ApiCreatedResponse({ description: 'Созданный контейнер' })
  async createContainer(@Body() createData: any) {
    return this.containersService.create(createData);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Список жалоб (пагинация)', description: 'Фильтр по status: pending, reviewed, resolved, dismissed.' })
  @ApiQuery({ name: '_start', example: '0' })
  @ApiQuery({ name: '_end', example: '10' })
  @ApiQuery({ name: '_sort', example: 'createdAt' })
  @ApiQuery({ name: '_order', example: 'DESC' })
  @ApiQuery({ name: 'status', required: false })
  @ApiOkResponse({ description: '{ data: Report[], total }' })
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
  @ApiOperation({ summary: 'Жалоба по ID' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Данные жалобы' })
  async getReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Put('reports/:id')
  @ApiOperation({ summary: 'Обновить жалобу' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ schema: { example: { status: 'resolved', adminNotes: 'Рассмотрено' } } })
  @ApiOkResponse({ description: 'Обновлённая жалоба' })
  async updateReport(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateData: any,
    @Request() req,
  ) {
    return this.reportsService.update(id, updateData, req.user.id);
  }

  @Delete('reports/:id')
  @ApiOperation({ summary: 'Удалить жалобу' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: '{ id }' })
  async deleteReport(@Param('id', ParseIntPipe) id: number) {
    await this.reportsService.remove(id);
    return { id };
  }

  @Post('reports/:id/resolve')
  @ApiOperation({ summary: 'Рассмотреть жалобу', description: 'action: block | dismiss, опционально adminNotes.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ schema: { example: { action: 'block', adminNotes: 'Пользователь заблокирован' } } })
  @ApiOkResponse({ description: 'Результат рассмотрения' })
  async resolveReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { action: 'block' | 'dismiss'; adminNotes?: string },
    @Request() req,
  ) {
    console.log(`Admin resolving report ${id} with action: ${body.action}`);
    console.log('Admin user:', req.user);
    return this.reportsService.resolveReport(id, req.user.id, body.action, body.adminNotes);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Заблокировать пользователя' })
  @ApiParam({ name: 'id', example: '5' })
  @ApiBody({ schema: { example: { reason: 'Нарушение правил' } }, required: false })
  @ApiOkResponse({ description: 'Пользователь заблокирован' })
  async blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    return this.usersService.blockUser(id, body.reason);
  }

  @Post('users/:id/unblock')
  @ApiOperation({ summary: 'Разблокировать пользователя' })
  @ApiParam({ name: 'id', example: '5' })
  @ApiOkResponse({ description: 'Пользователь разблокирован' })
  async unblockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unblockUser(id);
  }

  @Get('users/blocked')
  @ApiOperation({ summary: 'Заблокированные пользователи' })
  @ApiOkResponse({ description: 'Массив заблокированных пользователей' })
  async getBlockedUsers() {
    return this.usersService.getBlockedUsers();
  }
}