import dotenv from 'dotenv'
dotenv.config()

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    sorobanRpc: process.env.STELLAR_SOROBAN_RPC || 'https://soroban-testnet.stellar.org',
    adminSecret: process.env.STELLAR_ADMIN_SECRET || '',
    contracts: {
      payroll: process.env.PAYROLL_CONTRACT_ID || '',
      payment: process.env.PAYMENT_CONTRACT_ID || '',
    },
  },
  // Auth endpoint rate limits (issue #6). Overridable via env.
  rateLimit: {
    // Login: default 10 requests / 15 minutes
    loginMax: intEnv('RATE_LIMIT_LOGIN_MAX', 10),
    loginWindowMs: intEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    // Register: default 5 requests / 1 hour
    registerMax: intEnv('RATE_LIMIT_REGISTER_MAX', 5),
    registerWindowMs: intEnv('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000),
  },
} as const
