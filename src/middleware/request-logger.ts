import morgan from 'morgan';
import { Request } from 'express';
import { env } from '../config/env';

export const requestLogger = morgan((tokens, req: Request, res) => {
  if (env.NODE_ENV === 'test') {
    return null;
  }
  return [
    `[HTTP]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms',
    '-',
    tokens['remote-addr'](req, res)
  ].join(' ');
});
