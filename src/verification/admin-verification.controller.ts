import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { VerificationService } from './verification.service';
import { RejectVerificationRequestDto } from './dto/reject-verification-request.dto';

@ApiTags('Админка')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, BlockedUserGuard)
@Roles('admin')
@Controller('admin/verification-requests')
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  @ApiOperation({ summary: 'Список заявок', description: 'Пагинация как в react-admin (_start/_end).' })
  @ApiQuery({ name: '_start', required: false, example: '0' })
  @ApiQuery({ name: '_end', required: false, example: '10' })
  @ApiQuery({ name: 'status', required: false, example: 'pending' })
  @ApiOkResponse({ description: '{ data: items, total }' })
  async list(
    @Query('_start') start: string = '0',
    @Query('_end') end: string = '10',
    @Query('status') status?: string,
  ) {
    const skip = Math.max(0, Number(start) || 0);
    const take = Math.max(1, (Number(end) || 10) - skip);
    const [items, total] = await this.verificationService.adminList({ skip, take, status });
    return { data: items, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Заявка по ID' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse()
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.verificationService.adminGetOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Одобрить' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse()
  async approve(@Param('id', ParseIntPipe) id: number, @CurrentUserId() adminId: number) {
    return this.verificationService.adminApprove(id, adminId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Отклонить' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: RejectVerificationRequestDto })
  @ApiOkResponse()
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() adminId: number,
    @Body() dto: RejectVerificationRequestDto,
  ) {
    return this.verificationService.adminReject(id, adminId, dto.adminNote);
  }
}

