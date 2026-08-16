import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import employeeRoutes from './routes/employees'
import payrollRoutes from './routes/payroll'
import analyticsRoutes from './routes/analytics'
import walletRoutes from './routes/wallets'
import { errorHandler, notFound } from './middleware/error'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(compression() as express.RequestHandler)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}
app.use(express.json({ limit: '10kb' }))

if (process.env.NODE_ENV !== 'test') {
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' }))
}

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/wallets', walletRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
