import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
  @ApiProperty({ enum: ['pending', 'reviewed', 'resolved', 'dismissed'], example: 'resolved', required: false })
  @IsOptional()
  @IsEnum(['pending', 'reviewed', 'resolved', 'dismissed'])
  status?: ReportStatus;

  @ApiProperty({ example: 'Жалоба рассмотрена, контент удалён', required: false })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}