import { IsNumber, IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class UpdatePointDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsUUID()
  containerId?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}