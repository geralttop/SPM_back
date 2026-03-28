import { ApiProperty } from '@nestjs/swagger';

export class ZlataTagBriefDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class ZlataAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Путь для отображения: /uploads/...' })
  url: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  uploaderId: number;

  @ApiProperty({ type: [ZlataTagBriefDto] })
  tags: ZlataTagBriefDto[];
}
