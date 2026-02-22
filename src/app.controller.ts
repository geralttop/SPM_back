import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Общее')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка API', description: 'Простой эндпоинт для проверки доступности сервера.' })
  @ApiOkResponse({ description: 'Приветственное сообщение', schema: { example: 'Hello World!' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
