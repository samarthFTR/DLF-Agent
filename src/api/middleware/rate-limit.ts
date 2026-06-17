import rateLimit from 'express-rate-limit';

/** Global rate limit: 200 req/min per IP */
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded, try again later' } },
});

/** Stricter limit for AI generation endpoints: 10 req/min per IP */
export const generationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Generation rate limit exceeded' } },
});
