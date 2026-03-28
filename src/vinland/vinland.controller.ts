import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { FileUploadService } from '../auth/services/file-upload.service';
import { ReorderVinlandDto } from './dto/reorder-vinland.dto';
import { UpdateVinlandCaptionDto } from './dto/update-vinland-caption.dto';
import { VinlandService } from './vinland.service';
import { MAX_VINLAND_FILES_PER_REQUEST } from './vinland.constants';

@ApiTags('Справочные данные')
@ApiBearerAuth()
@Controller('vinland')
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class VinlandController {
  constructor(private readonly vinlandService: VinlandService) {}

  @Get('assets')
  @ApiOperation({ summary: 'Список изображений (порядок по sortOrder)' })
  async getAssets() {
    return this.vinlandService.findAll();
  }

  @Post('assets')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor('files', MAX_VINLAND_FILES_PER_REQUEST, {
      storage: FileUploadService.vinlandStorage,
      fileFilter: FileUploadService.vinlandFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Загрузить изображения (только админ)',
    description: `Поле files — один или несколько файлов (до ${MAX_VINLAND_FILES_PER_REQUEST} за запрос).`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async uploadAssets(
    @CurrentUserId() userId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('Файлы не загружены');
    }
    return this.vinlandService.createAssets(
      userId,
      files.map((f) => f.filename),
    );
  }

  @Patch('assets/reorder')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Задать порядок изображений (только админ)',
    description: 'Массив orderedIds должен содержать все id без пропусков и дублей',
  })
  @ApiBody({ type: ReorderVinlandDto })
  async reorder(@Body() dto: ReorderVinlandDto) {
    return this.vinlandService.reorder(dto.orderedIds);
  }

  @Patch('assets/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Обновить подпись (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID изображения' })
  @ApiBody({ type: UpdateVinlandCaptionDto })
  async updateCaption(
    @Param('id') id: string,
    @Body() dto: UpdateVinlandCaptionDto,
  ) {
    return this.vinlandService.updateCaption(id, dto.caption);
  }

  @Delete('assets/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Удалить изображение (только админ)' })
  @ApiParam({ name: 'id' })
  async deleteAsset(@Param('id') id: string) {
    await this.vinlandService.deleteAsset(id);
    return { ok: true };
  }
}
