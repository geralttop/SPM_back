import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { MAX_VINLAND_CAPTION_LENGTH } from '../vinland.constants';

export class UpdateVinlandCaptionDto {
  @ApiPropertyOptional({ nullable: true, description: 'null — очистить подпись' })
  @IsOptional()
  @ValidateIf((o) => o.caption !== null && o.caption !== undefined)
  @IsString()
  @MaxLength(MAX_VINLAND_CAPTION_LENGTH)
  caption?: string | null;
}
