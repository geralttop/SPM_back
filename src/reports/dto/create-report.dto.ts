import { IsEnum, IsOptional, IsString, IsUUID, IsNumber, ValidateIf } from 'class-validator';
import type { ReportType, ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  @IsEnum(['point', 'comment', 'user'])
  type: ReportType;

  @IsEnum(['spam', 'inappropriate', 'harassment', 'fake', 'other'])
  reason: ReportReason;

  @IsOptional()
  @IsString()
  description?: string;

  // Валидация: должен быть указан один из ID в зависимости от типа
  @ValidateIf(o => o.type === 'point')
  @IsUUID()
  pointId?: string;

  @ValidateIf(o => o.type === 'comment')
  @IsNumber()
  commentId?: number;

  @ValidateIf(o => o.type === 'user')
  @IsNumber()
  reportedUserId?: number;
}