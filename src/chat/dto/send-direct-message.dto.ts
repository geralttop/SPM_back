import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SendDirectMessageDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  peerUserId: number;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text: string;
}
