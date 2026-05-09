import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVerificationRequestDto {
  @ApiProperty({ example: 'Я публичный автор, хочу подтверждение личности.' })
  @IsString()
  @MaxLength(2000)
  reason: string;

  @ApiProperty({ example: 'https://example.com, https://instagram.com/..', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  links?: string;
}

