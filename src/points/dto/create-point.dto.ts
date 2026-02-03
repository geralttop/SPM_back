import { IsNumber, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreatePointDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  lng: number;

  @IsNumber()
  lat: number;

  @IsUUID() // Контейнеры у нас на UUID
  containerId: string;

  @IsNumber() // Категории на обычном id (autoincrement)
  categoryId: number;
}