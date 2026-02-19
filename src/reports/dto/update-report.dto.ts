import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(['pending', 'reviewed', 'resolved', 'dismissed'])
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}