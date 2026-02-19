import { IsString, IsOptional } from 'class-validator';

export class BlockUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}