import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly logger: Logger) {}
  getHello() {
    this.logger.log('Any logging [1]');
    this.anotherFunction();

    return { message: 'Hello' };
  }

  anotherFunction(): void {
    this.logger.log('Calling another function [1]');
  }
}
