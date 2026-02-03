import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh токен для обновления access токена' 
  })
  @IsString({ message: 'Refresh токен должен быть строкой' })
  @IsNotEmpty({ message: 'Refresh токен не может быть пустым' })
  @IsJWT({ message: 'Некорректный формат JWT токена' })
  refreshToken: string;
}