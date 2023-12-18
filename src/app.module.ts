import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestsLogMiddleware } from './middleware/requests-log-middleware';
import { Request } from 'express';

import { getCorrelationId } from './server/get-correlation-id';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: async () => {
        return {
          pinoHttp: {
            autoLogging: false,
            base: null,
            serializers: {
              req: (req) => ({}),
            },
            quietReqLogger: true,
            genReqId: (request: Request) => getCorrelationId(request),
            level: 'debug',
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestsLogMiddleware).forRoutes('*');
  }
}
