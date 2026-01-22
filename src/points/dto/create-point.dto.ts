import { IsNumber, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreatePointDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  lng: number; // Долгота

  @IsNumber()
  lat: number; // Широта
}