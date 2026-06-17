import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'ai-marketing-agent',
    release: env.RELEASE_VERSION,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.encryptedAccessToken',
      '*.encryptedRefreshToken',
    ],
    remove: true,
  },
});

