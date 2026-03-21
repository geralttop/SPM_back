import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminPaginationQueryDto {
  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  _start?: string = '0';

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  _end?: string = '10';

  @ApiPropertyOptional({ example: 'id' })
  @IsOptional()
  @IsString()
  _sort?: string = 'id';

  @ApiPropertyOptional({ example: 'ASC' })
  @IsOptional()
  @IsString()
  _order?: string = 'ASC';
}
