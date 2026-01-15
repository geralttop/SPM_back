import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({ example: 'witcher@kaermorhen.com', description: 'Email пользователя' })
  email: string;

  @ApiProperty({ example: '123456', description: '6-значный код из письма' })
  code: string;
}