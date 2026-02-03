import { IsString, IsOptional, Matches, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  icon?: string; // Например, "coffee", "park-shrub"

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Цвет должен быть в формате HEX (например, #FF5733)',
  })
  color?: string;
}