import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Комментарии')
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('comments/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мои комментарии', description: 'Все комментарии текущего пользователя.' })
  @ApiOkResponse({ description: 'Массив комментариев' })
  findMyComments(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.findByUser(userId);
  }

  @Post('points/:pointId/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить комментарий', description: 'Добавляет комментарий к точке.' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ description: 'Комментарий создан', schema: { example: { id: 1, content: 'Отличное место!', pointId: 'uuid-...', authorId: 1, createdAt: '2025-01-15T12:00:00.000Z' } } })
  create(
    @Param('pointId') pointId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.create(pointId, createCommentDto, userId);
  }

  @Get('points/:pointId/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Комментарии к точке', description: 'Список комментариев по pointId.' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Массив комментариев' })
  findAll(@Param('pointId') pointId: string) {
    return this.commentsService.findByPoint(pointId);
  }

  @Patch('points/:pointId/comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактировать комментарий', description: 'Только автор комментария.' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ description: 'Комментарий обновлён' })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.update(+id, updateCommentDto, userId);
  }

  @Delete('points/:pointId/comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить комментарий', description: 'Только автор.' })
  @ApiParam({ name: 'pointId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ description: 'Комментарий удалён' })
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.remove(+id, userId);
  }
}
