import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class AttachTagDto {
  @ApiPropertyOptional({ example: 1 })
  @ValidateIf((o) => o.name == null || o.name === '')
  @IsInt()
  tagId?: number;

  @ApiPropertyOptional({ example: 'newtag' })
  @ValidateIf((o) => o.tagId == null)
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string;
}
