import { Router, Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { hashPassword, comparePassword, signToken, respond } from '../utils/auth'
import { validate, registerSchema, loginSchema } from '../utils/validators'
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimiter'

const router = Router()

// POST /api/auth/register
router.post('/register', registerRateLimiter, async (req: Request, res: Response) => {
  const parsed = validate(registerSchema, req.body)
  if ('error' in parsed) return res.status(400).json({ success: false, error: parsed.error })

  const { name, email, password, role, companyName } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ success: false, error: 'Email already registered' })

  let companyId: string | undefined

  if (role === 'ADMIN' && companyName) {
    const company = await prisma.company.create({ data: { name: companyName } })
    companyId = company.id
  }

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password), role, companyId },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  })

  const token = signToken({ userId: user.id, email: user.email, role: user.role, companyId: user.companyId ?? undefined })
  res.status(201).json(respond({ user, token }, 'Registration successful'))
})

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  const parsed = validate(loginSchema, req.body)
  if ('error' in parsed) return res.status(400).json({ success: false, error: parsed.error })

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role, companyId: user.companyId ?? undefined })
  res.json(respond({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
    token,
  }, 'Login successful'))
})

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' })

  try {
    const { verifyToken } = await import('../utils/auth')
    const payload = verifyToken(authHeader.split(' ')[1])
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, companyId: true, company: { select: { id: true, name: true } } },
    })
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    res.json(respond(user))
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
})

export default router
