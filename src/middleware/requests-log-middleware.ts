import { NextFunction, Request, Response } from 'express';
import { NestMiddleware } from '@nestjs/common';
import { pick } from 'lodash';
import { Logger } from '@nestjs/common';
import { tryStringify } from 'src/utils/try-stringify';
import { getCorrelationId } from 'src/server/get-correlation-id';

export class RequestsLogMiddleware implements NestMiddleware {
  private readonly maxDataLengthForLogging = 10000;

  /**
   * If you don't want to log certain method requests, add the method to the list.
   * For example, the OPTIONS method is used by browsers to retrieve information.
   */
  private readonly blackListMethods = ['OPTIONS'];

  /**
   * If you prefer not to log specific path requests, add them to the list.
   * For example, I added the /ignore-log (locahost:3000/ignore-log).
   */
  private readonly blackListPaths = ['/ignore-log'];

  /**
   * If you prefer not to log the data responses from specific path requests, add them to the list.
   * Unlike blackListPaths, the blackListResponseData will only skip the body response but will still display the request/response.
   * This is recommend for long responses, for example image, binary, file, among others.
   */
  private readonly blackListResponseData = ['/ignore-body-response'];

  private readonly logger = new Logger();

  use(request: Request, response: Response, next: NextFunction): void {
    if (this.shouldSkipLog(request)) {
      return next();
    }
    this.logRequest(request);
    this.logResponse(response);
    next();
  }

  private shouldSkipLog(request: Request): boolean {
    return (
      this.isBlackList(request.baseUrl, this.blackListPaths) ||
      this.blackListMethods.includes(request.method.toUpperCase())
    );
  }

  private logRequest(request: Request): void {
    const defaultEnd = request.read.bind(request);
    defaultEnd.apply;
    this.logger.log({
      reqId: getCorrelationId(request),
      msg: `Request ${request.method.toUpperCase()} ${request.baseUrl}`,
      type: 'Request',
      url: request.baseUrl,
      method: request.method.toUpperCase(),
      query: tryStringify(request.query),
      headers: pick(request.headers, ['user-agent']),
      data: this.filterDataByMaxLength(tryStringify(request.body)),
    });
  }

  private logResponse(response: Response): void {
    const requestStartTime = Date.now();
    const chunks: Buffer[] = [];

    this.logResponseEndCallback(response, () => {
      const requestTimeMillis = Date.now() - requestStartTime;
      const data = Buffer.concat(chunks).toString();

      this.logFormatResponse(response, requestTimeMillis, data);
    });
    this.logResponseWriteGetChunks(chunks, response);
    this.logResponseEndGetChunks(chunks, response);
  }

  private logFormatResponse(
    response: Response,
    requestTimeMillis: number,
    data: string,
  ): void {
    const request = response.req;
    const method = request.method.toUpperCase();
    this.logger.log({
      msg: `Response ${method} ${request.path} ${response.statusCode}`,
      type: 'Response',
      url: request.path,
      method,
      data: this.filterDataResponse(data, request.path),
      requestTimeMillis,
      status: response.statusCode,
    });
  }

  private isBlackList(url: string, blackList: string[]): boolean {
    const escapeRegExp = (string) => {
      return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    };
    const regex = new RegExp(
      blackList.map((path) => `^${escapeRegExp(path)}`).join('|'),
    );
    return regex.test(url);
  }

  private filterDataResponse(data: string, url): string {
    return this.isBlackList(url, this.blackListResponseData)
      ? '*too long*'
      : data;
  }

  private filterDataByMaxLength(data: string): string {
    return data.length <= this.maxDataLengthForLogging ? data : '*too long*';
  }

  private logResponseWriteGetChunks(
    chunks: Buffer[],
    response: Response,
  ): void {
    const defaultWrite = response.write.bind(response);

    response.write = function write(
      chunk: string | Buffer,
      ...args: never[]
    ): boolean {
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        chunks.push(Buffer.from(chunk));
      }

      return defaultWrite.apply(response, [chunk, ...args]);
    };
  }

  private logResponseEndGetChunks(chunks: Buffer[], response: Response): void {
    const defaultEnd = response.end.bind(response);

    response.end = function end(
      chunk: unknown,
      ...args: never
    ): Response<any, Record<string, any>> {
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        chunks.push(Buffer.from(chunk));
      }

      return defaultEnd.apply(response, [chunk, ...args]);
    };
  }

  private logResponseEndCallback(
    response: Response,
    callback: () => void,
  ): void {
    const defaultEnd = response.end.bind(response);

    response.end = function end(
      ...args: never
    ): Response<any, Record<string, any>> {
      callback();
      return defaultEnd.apply(response, args);
    };
  }
}
