import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, IsOptional, MaxLength, ValidateIf, } from 'class-validator';

export class UpdatePointDto {
  @ApiProperty({ example: 'Кофейня у замка (обновлено)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'Новое описание', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 37.62, required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ example: 55.76, required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
    nullable: true,
    description: 'Передайте null, чтобы убрать контейнер у точки',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsUUID()
  containerId?: string | null;

  @ApiProperty({
    example: 2,
    required: false,
    nullable: true,
    description: 'Передайте null, чтобы убрать категорию у точки',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsNumber()
  categoryId?: number | null;
}