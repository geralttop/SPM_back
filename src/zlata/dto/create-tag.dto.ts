import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'pepe', description: 'Имя тега' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;
}
