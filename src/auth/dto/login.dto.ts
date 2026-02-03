import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    example: 'witcher@kaermorhen.com',
    description: 'Электронная почта пользователя'
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  @MaxLength(254, { message: 'Email не может быть длиннее 254 символов' })
  email: string;

  @ApiProperty({ 
    example: 'supersecret123',
    description: 'Пароль пользователя (минимум 8 символов)'
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(128, { message: 'Пароль не может быть длиннее 128 символов' })
  password: string;
}