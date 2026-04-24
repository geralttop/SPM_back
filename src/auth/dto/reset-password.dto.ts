import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, Matches, MinLength } from 'class-validator';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])[^\s]+$/;

export class ResetPasswordDto {
  @ApiProperty({ example: 'witcher@kaermorhen.com', description: 'Email аккаунта' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-значный код из письма для сброса пароля' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'NewSecurePass1!',
    description:
      'Новый пароль (минимум 8 символов, должен содержать буквы, цифры и спецсимволы)',
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(128, { message: 'Пароль не может быть длиннее 128 символов' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Пароль должен содержать минимум: 1 строчную букву, 1 заглавную букву, 1 цифру и 1 спецсимвол (любой символ, кроме пробелов)',
  })
  newPassword: string;
}