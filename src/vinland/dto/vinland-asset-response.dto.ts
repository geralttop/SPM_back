import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VinlandAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Путь для отображения: /uploads/...' })
  url: string;

  @ApiPropertyOptional()
  caption: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  uploaderId: number;
}
