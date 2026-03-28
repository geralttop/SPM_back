import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderVinlandDto {
  @ApiProperty({
    type: [String],
    description: 'Полный порядок id слева направо; должен совпадать с множеством всех ассетов',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
