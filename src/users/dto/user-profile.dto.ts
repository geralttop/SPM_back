import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '1' })
  sub: string;

  @ApiProperty({ example: '1' })
  userId: string;

  @ApiProperty({ example: 'geralt' })
  username: string;

  @ApiProperty({ example: 'witcher@kaermorhen.com' })
  email: string;

  @ApiProperty({ example: 'user' })
  role: string;

  @ApiProperty({ example: false, description: 'Галочка верификации (не связана с почтой).' })
  isVerified: boolean;

  @ApiProperty({ example: 'Ведьмак из Каэр Морхена', required: false })
  bio?: string;

  @ApiProperty({ example: ['map', 'points', 'categories'], required: false, description: 'Порядок вкладок в сайдбаре' })
  sidebarOrder?: string[];
}