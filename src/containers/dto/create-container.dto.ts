import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

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
}