import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Обновлённый текст комментария' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
