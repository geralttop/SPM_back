import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectVerificationRequestDto {
  @ApiProperty({ example: 'Недостаточно подтверждений.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}

