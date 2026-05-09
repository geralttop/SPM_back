import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_APP_THROTTLE } from '../common/throttle-skip-app';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { ChatService } from './chat.service';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';

@ApiTags('Чаты')
@Controller('chats')
@SkipThrottle(SKIP_APP_THROTTLE)
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список диалогов' })
  list(@Request() req: { user: { id: number } }) {
    return this.chatService.listConversations(req.user.id);
  }

  @Get('unread-count')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Суммарное число непрочитанных входящих сообщений' })
  unread(@Request() req: { user: { id: number } }) {
    return this.chatService.getUnreadTotal(req.user.id);
  }

  @Get('peer/:peerUserId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ID диалога с пользователем или отсутствие' })
  @ApiParam({ name: 'peerUserId' })
  async byPeer(
    @Request() req: { user: { id: number } },
    @Param('peerUserId', ParseIntPipe) peerUserId: number,
  ) {
    const conversationId = await this.chatService.findConversationIdByPeer(
      req.user.id,
      peerUserId,
    );
    return { conversationId };
  }

  @Get(':conversationId/meta')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Собеседник и id диалога' })
  @ApiParam({ name: 'conversationId' })
  meta(
    @Request() req: { user: { id: number } },
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.getConversationMeta(req.user.id, conversationId);
  }

  @Get(':conversationId/messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Сообщения диалога (пагинация назад)' })
  @ApiParam({ name: 'conversationId' })
  @ApiQuery({ name: 'before', required: false })
  messages(
    @Request() req: { user: { id: number } },
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('before') before?: string,
  ) {
    const beforeId =
      before !== undefined && before !== '' ? parseInt(before, 10) : undefined;
    return this.chatService.getMessages(
      req.user.id,
      conversationId,
      Number.isFinite(beforeId) ? beforeId : undefined,
    );
  }

  @Patch(':conversationId/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить диалог прочитанным' })
  @ApiParam({ name: 'conversationId' })
  markRead(
    @Request() req: { user: { id: number } },
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.markRead(req.user.id, conversationId);
  }

  @Post('messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить сообщение (создаёт диалог при необходимости)' })
  send(
    @Request() req: { user: { id: number } },
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, dto);
  }
}
