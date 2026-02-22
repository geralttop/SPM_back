import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreatePointDto {
  @ApiProperty({ example: 'Кофейня у замка', description: 'Название точки' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Уютное место с видом на крепость', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 37.6173, description: 'Долгота (longitude)' })
  @IsNumber()
  lng: number;

  @ApiProperty({ example: 55.7558, description: 'Широта (latitude)' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'UUID контейнера' })
  @IsUUID()
  containerId: string;

  @ApiProperty({ example: 1, description: 'ID категории' })
  @IsNumber()
  categoryId: number;
}