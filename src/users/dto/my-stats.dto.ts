import { ApiProperty } from '@nestjs/swagger';

export class MyStatsDto {
  @ApiProperty({ example: 12 })
  pointsCreated: number;

  @ApiProperty({ example: 34 })
  commentsCreated: number;

  @ApiProperty({ example: 5 })
  favoritesCount: number;

  @ApiProperty({ example: 3 })
  categoriesCreated: number;

  @ApiProperty({ example: 2 })
  containersCreated: number;
}

