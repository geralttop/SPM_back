import { IsArray, IsString } from 'class-validator';

export class UpdateSidebarOrderDto {
  @IsArray()
  @IsString({ each: true })
  sidebarOrder: string[];
}
