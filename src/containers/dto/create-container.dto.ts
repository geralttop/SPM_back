import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateContainerDto {
  @ApiProperty({ example: 'Мои любимые места', description: 'Название контейнера (3–100 символов)' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'Подборка кафе и парков в центре', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: '#3B82F6',
    description: 'Цвет контейнера в HEX-формате',
  })
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, {
    message: 'Цвет должен быть в формате HEX, например #3B82F6',
  })
  color: string;
}