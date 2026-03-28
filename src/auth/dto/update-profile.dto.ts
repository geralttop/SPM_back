import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'geralt_rivia', description: 'Новое имя пользователя (3–30 символов)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @ApiProperty({ example: 'Ведьмак из Каэр Морхена', description: 'Краткая информация о себе (до 500 символов)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}