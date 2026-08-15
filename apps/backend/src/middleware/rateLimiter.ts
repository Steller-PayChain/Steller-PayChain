import rateLimit from 'express-rate-limit'
import { config } from '../utils/config'

const TOO_MANY = {
  error: 'Too many requests, please try again later.',
}

/**
 * Stricter IP rate limits for authentication endpoints.
 * Global /api limiter still applies; these are additional per-route caps.
 */
export const loginRateLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  message: TOO_MANY,
  handler: (_req, res, _next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000).toString())
    res.status(options.statusCode).json(options.message)
  },
})

export const registerRateLimiter = rateLimit({
  windowMs: config.rateLimit.registerWindowMs,
  max: config.rateLimit.registerMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: TOO_MANY,
  handler: (_req, res, _next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000).toString())
    res.status(options.statusCode).json(options.message)
  },
})
