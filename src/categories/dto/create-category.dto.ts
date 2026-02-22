import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Кафе', description: 'Название категории (минимум 2 символа)' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '#FF5733', description: 'Цвет в формате HEX (например #FF5733 или #F53)', required: false })

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Цвет должен быть в формате HEX (например, #FF5733)',
  })
  color?: string;
}