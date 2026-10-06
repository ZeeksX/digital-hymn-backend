import { env } from '../../config/env';

const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'secret',
  'cookie',
  'authorization',
  'credentials',
]);

function redactObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redactObject(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message: string, meta?: unknown) => {
    if (env.NODE_ENV !== 'test') {
      const output = meta ? ` | ${JSON.stringify(redactObject(meta))}` : '';
      console.log(`[INFO] [${new Date().toISOString()}] ${message}${output}`);
    }
  },
  warn: (message: string, meta?: unknown) => {
    if (env.NODE_ENV !== 'test') {
      const output = meta ? ` | ${JSON.stringify(redactObject(meta))}` : '';
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}${output}`);
    }
  },
  error: (message: string, error?: unknown) => {
    if (env.NODE_ENV !== 'test') {
      let errDetail = '';
      if (error instanceof Error) {
        errDetail = env.NODE_ENV === 'development' ? ` | ${error.stack}` : ` | ${error.message}`;
      } else if (error) {
        errDetail = ` | ${JSON.stringify(redactObject(error))}`;
      }
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}${errDetail}`);
    }
  },
};
