import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'geralt' })
  username: string;

  @ApiProperty({ example: 'witcher@kaermorhen.com' })
  email: string;

  @ApiProperty({ example: true, description: 'Подтверждена ли почта' })
  isEmailVerified: boolean;
}