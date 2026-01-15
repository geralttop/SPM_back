import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'geralt', description: 'Уникальное имя пользователя' })
  username: string;

  @ApiProperty({ example: 'witcher@kaermorhen.com', description: 'Электронная почта' })
  email: string;

  @ApiProperty({ example: 'supersecret123', description: 'Пароль' })
  password: string;
}