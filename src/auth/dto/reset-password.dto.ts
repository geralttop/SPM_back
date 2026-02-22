import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'witcher@kaermorhen.com', description: 'Email аккаунта' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-значный код из письма для сброса пароля' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'NewSecurePass1!', description: 'Новый пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}