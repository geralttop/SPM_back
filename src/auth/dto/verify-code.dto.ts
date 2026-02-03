import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({ 
    example: 'witcher@kaermorhen.com', 
    description: 'Email пользователя' 
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;

  @ApiProperty({ 
    example: '123456', 
    description: '6-значный код подтверждения из письма' 
  })
  @IsString({ message: 'Код должен быть строкой' })
  @IsNotEmpty({ message: 'Код не может быть пустым' })
  @Length(6, 6, { message: 'Код должен содержать ровно 6 символов' })
  @Matches(/^\d{6}$/, { message: 'Код должен содержать только цифры' })
  code: string;
}