import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'witcher@kaermorhen.com' })
  email: string;

  @ApiProperty({ example: 'supersecret123' })
  password: string;
}