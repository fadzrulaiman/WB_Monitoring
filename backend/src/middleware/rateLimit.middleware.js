import rateLimit from 'express-rate-limit';

// Generic configurable rate limiter for auth endpoints
// Defaults are sensible for development; override via env if needed
const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

export const authRateLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  limit: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  keyGenerator: (req) => {
    // Use IP by default; can be customized to include user identifier if available
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

export default authRateLimiter;

