import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Жалобы')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать жалобу', description: 'Отправить жалобу на точку, комментарий или пользователя. Укажите type и соответствующий id (pointId/commentId/reportedUserId).' })
  @ApiBody({ type: CreateReportDto })
  @ApiCreatedResponse({ description: 'Жалоба создана', schema: { example: { id: 1, type: 'point', reason: 'spam', pointId: 'uuid-...', status: 'pending' } } })
  @ApiBadRequestResponse({ description: 'Невалидные данные или не указан нужный id' })
  create(@Body() createReportDto: CreateReportDto, @Request() req) {
    return this.reportsService.create(createReportDto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список жалоб (админ)', description: 'Все жалобы с пагинацией и фильтром по статусу. Только для админов.' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'reviewed', 'resolved', 'dismissed'] })
  @ApiOkResponse({ description: 'Массив жалоб и total' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.reportsService.findAll(pageNum, limitNum, status);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Жалоба по ID (админ)' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Данные жалобы' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить жалобу (админ)', description: 'Изменить статус и/или adminNotes.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: UpdateReportDto })
  @ApiOkResponse({ description: 'Жалоба обновлена' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req,
  ) {
    return this.reportsService.update(id, updateReportDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить жалобу (админ)' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Жалоба удалена' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.remove(id);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Рассмотреть жалобу (админ)', description: 'action: block — заблокировать контент/пользователя, dismiss — отклонить жалобу.' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ schema: { example: { action: 'block', adminNotes: 'Контент удалён за спам' } } })
  @ApiOkResponse({ description: 'Жалоба рассмотрена' })
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { action: 'block' | 'dismiss'; adminNotes?: string },
    @Request() req,
  ) {
    return this.reportsService.resolveReport(id, req.user.id, body.action, body.adminNotes);
  }
}