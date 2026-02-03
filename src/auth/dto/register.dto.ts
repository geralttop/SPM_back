import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ 
    example: 'geralt', 
    description: 'Уникальное имя пользователя (3-30 символов, только буквы, цифры, подчеркивания)' 
  })
  @IsString({ message: 'Имя пользователя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя пользователя не может быть пустым' })
  @MinLength(3, { message: 'Имя пользователя должно содержать минимум 3 символа' })
  @MaxLength(30, { message: 'Имя пользователя не может быть длиннее 30 символов' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Имя пользователя может содержать только буквы, цифры и подчеркивания' 
  })
  username: string;

  @ApiProperty({ 
    example: 'witcher@kaermorhen.com', 
    description: 'Электронная почта' 
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  @MaxLength(254, { message: 'Email не может быть длиннее 254 символов' })
  email: string;

  @ApiProperty({ 
    example: 'SuperSecret123!', 
    description: 'Пароль (минимум 8 символов, должен содержать буквы, цифры и спецсимволы)' 
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(128, { message: 'Пароль не может быть длиннее 128 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Пароль должен содержать минимум: 1 строчную букву, 1 заглавную букву, 1 цифру и 1 спецсимвол (@$!%*?&)'
  })
  password: string;
}