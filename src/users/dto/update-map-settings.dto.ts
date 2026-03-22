import { IsArray, IsString, IsOptional, ArrayMinSize, IsIn } from 'class-validator';

export class UpdateMapSettingsDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one map style must be selected' })
  @IsString({ each: true })
  availableMapStyles?: string[];

  @IsOptional()
  @IsString()
  defaultMapStyle?: string;

  @IsOptional()
  @IsIn(['map', 'photos'])
  pointCardInitialView?: 'map' | 'photos';
}
