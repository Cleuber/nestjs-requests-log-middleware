import { Request } from 'express';

export const getCorrelationId = (request: Request) => {
  return request.header('x-correlation-id');
};
