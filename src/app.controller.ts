import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('/ignore-log')
  getIgnoreLog() {
    return this.appService.getHello();
  }

  @Get('/ignore-body-response')
  getIgnoreBodyResponse() {
    return this.appService.getHello();
  }
}
