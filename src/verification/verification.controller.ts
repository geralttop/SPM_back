import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { VerificationService } from './verification.service';

@ApiTags('Верификация')
@Controller('verification')
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Моя заявка', description: 'Последняя заявка текущего пользователя.' })
  @ApiOkResponse()
  async getMy(@CurrentUserId() userId: number) {
    return this.verificationService.getMyRequest(userId);
  }

  @Post('request')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подать заявку', description: 'Создаёт или обновляет pending-заявку.' })
  @ApiOkResponse()
  async request(@CurrentUserId() userId: number, @Body() dto: CreateVerificationRequestDto) {
    return this.verificationService.requestVerification(userId, dto);
  }

  @Delete('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отозвать заявку', description: 'Удаляет pending-заявку текущего пользователя.' })
  @ApiOkResponse()
  async revoke(@CurrentUserId() userId: number) {
    await this.verificationService.revokeMyPending(userId);
    return { ok: true };
  }
}

