import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsNumber, ValidateIf } from 'class-validator';
import type { ReportType, ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ enum: ['point', 'comment', 'user'], example: 'point', description: 'Тип объекта жалобы' })
  @IsEnum(['point', 'comment', 'user'])
  type: ReportType;

  @ApiProperty({ enum: ['spam', 'inappropriate', 'harassment', 'fake', 'other'], example: 'spam', description: 'Причина жалобы' })
  @IsEnum(['spam', 'inappropriate', 'harassment', 'fake', 'other'])
  reason: ReportReason;

  @ApiProperty({ example: 'Рекламный пост с ссылкой на сайт', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID точки (обязателен при type=point)', required: false })
  @ValidateIf(o => o.type === 'point')
  @IsUUID()
  pointId?: string;

  @ApiProperty({ example: 42, description: 'ID комментария (обязателен при type=comment)', required: false })
  @ValidateIf(o => o.type === 'comment')
  @IsNumber()
  commentId?: number;

  @ApiProperty({ example: 5, description: 'ID пользователя (обязателен при type=user)', required: false })
  @ValidateIf(o => o.type === 'user')
  @IsNumber()
  reportedUserId?: number;
}