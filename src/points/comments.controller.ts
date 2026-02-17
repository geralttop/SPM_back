import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('comments/my')
  findMyComments(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.findByUser(userId);
  }

  @Post('points/:pointId/comments')
  create(
    @Param('pointId') pointId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.create(pointId, createCommentDto, userId);
  }

  @Get('points/:pointId/comments')
  findAll(@Param('pointId') pointId: string) {
    return this.commentsService.findByPoint(pointId);
  }

  @Patch('points/:pointId/comments/:id')
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.update(+id, updateCommentDto, userId);
  }

  @Delete('points/:pointId/comments/:id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.remove(+id, userId);
  }
}
