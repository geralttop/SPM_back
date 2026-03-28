import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BlockedUserGuard } from '../auth/guards/blocked-user.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { FileUploadService } from '../auth/services/file-upload.service';
import { AttachTagDto } from './dto/attach-tag.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { ZlataService } from './zlata.service';
import { MAX_ZLATA_FILES_PER_REQUEST } from './zlata.constants';

@ApiTags('Справочные данные')
@ApiBearerAuth()
@Controller('zlata')
@UseGuards(JwtAuthGuard, BlockedUserGuard)
export class ZlataController {
  constructor(private readonly zlataService: ZlataService) {}

  @Get('assets')
  @ApiOperation({
    summary: 'Список изображений',
    description: 'Опционально фильтр tags — перечисление через запятую (логика AND).',
  })
  @ApiQuery({ name: 'tags', required: false, example: 'foo,bar' })
  async getAssets(@Query('tags') tags?: string) {
    return this.zlataService.findAssetsWithTags(tags);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Все теги' })
  async listTags() {
    return this.zlataService.findAllTags();
  }

  @Post('tags')
  @ApiOperation({ summary: 'Создать тег' })
  @ApiBody({ type: CreateTagDto })
  async createTag(@Body() dto: CreateTagDto) {
    return this.zlataService.createTag(dto.name);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Удалить тег' })
  @ApiParam({ name: 'id', type: Number })
  async deleteTag(@Param('id') id: string) {
    const tagId = parseInt(id, 10);
    if (Number.isNaN(tagId)) {
      throw new BadRequestException('Некорректный id');
    }
    await this.zlataService.deleteTag(tagId);
    return { ok: true };
  }

  @Post('assets')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor('files', MAX_ZLATA_FILES_PER_REQUEST, {
      storage: FileUploadService.zlataStorage,
      fileFilter: FileUploadService.zlataFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Загрузить изображения (только админ)',
    description: `Поле files — один или несколько файлов (до ${MAX_ZLATA_FILES_PER_REQUEST} за запрос).`,
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
    return this.zlataService.createAssets(
      userId,
      files.map((f) => f.filename),
    );
  }

  @Post('assets/:assetId/tags')
  @ApiOperation({ summary: 'Прикрепить тег к изображению' })
  @ApiParam({ name: 'assetId' })
  @ApiBody({ type: AttachTagDto })
  async attachTag(@Param('assetId') assetId: string, @Body() dto: AttachTagDto) {
    return this.zlataService.attachTag(assetId, dto);
  }

  @Delete('assets/:assetId/tags/:tagId')
  @ApiOperation({ summary: 'Снять тег с изображения' })
  @ApiParam({ name: 'assetId' })
  @ApiParam({ name: 'tagId', type: Number })
  async detachTag(@Param('assetId') assetId: string, @Param('tagId') tagId: string) {
    const tid = parseInt(tagId, 10);
    if (Number.isNaN(tid)) {
      throw new BadRequestException('Некорректный tagId');
    }
    await this.zlataService.detachTag(assetId, tid);
    return { ok: true };
  }

  @Delete('assets/:assetId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Удалить изображение (только админ)' })
  @ApiParam({ name: 'assetId' })
  async deleteAsset(@Param('assetId') assetId: string) {
    await this.zlataService.deleteAsset(assetId);
    return { ok: true };
  }
}
