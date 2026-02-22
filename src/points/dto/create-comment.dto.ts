import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Отличное место, рекомендую!', description: 'Текст комментария (до 1000 символов)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
