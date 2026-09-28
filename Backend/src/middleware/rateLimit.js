import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Public endpoint rate limit reached.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'AI analysis rate limit reached.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
