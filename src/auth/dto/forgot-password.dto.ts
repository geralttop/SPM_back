import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'witcher@kaermorhen.com', description: 'Email аккаунта для сброса пароля' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}