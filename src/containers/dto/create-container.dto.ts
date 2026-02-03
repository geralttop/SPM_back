import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';

export class CreateContainerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}