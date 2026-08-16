import { Router, Response } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate, authorize, requireCompany } from '../middleware/auth'
import { validate, employeeSchema } from '../utils/validators'
import type { AuthRequest } from '../middleware/auth'
import { EmployeeStatus } from '@prisma/client'

const router = Router()

router.use(authenticate, requireCompany)

// GET /api/employees
router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, status, page, limit } = req.query as Record<string, string | undefined>
  const companyId = req.user!.companyId!

  const where = {
    companyId,
    ...(status ? { status: status as EmployeeStatus } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const total = await prisma.employee.count({ where })

  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : undefined
  const limitNum = limit ? Math.max(1, parseInt(limit, 10) || 10) : undefined

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    ...(pageNum && limitNum ? { skip: (pageNum - 1) * limitNum, take: limitNum } : {}),
  })

  const effectivePage = pageNum || 1
  const effectiveLimit = limitNum || (total > 0 ? total : 10)
  const totalPages = Math.ceil(total / effectiveLimit) || 1

  res.json({
    success: true,
    data: employees,
    pagination: {
      total,
      page: effectivePage,
      limit: effectiveLimit,
      totalPages,
    },
  })
})

// POST /api/employees
router.post('/', authorize('ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const parsed = validate(employeeSchema, req.body)
  if ('error' in parsed) return res.status(400).json({ success: false, error: parsed.error })

  const companyId = req.user!.companyId!
  const existing = await prisma.employee.findUnique({ where: { companyId_email: { companyId, email: parsed.data.email } } })
  if (existing) return res.status(409).json({ success: false, error: 'Employee with this email already exists' })

  const employee = await prisma.employee.create({ data: { ...parsed.data, companyId, salary: parsed.data.salary } })
  res.status(201).json({ success: true, data: employee })
})

// GET /api/employees/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string
  const employee = await prisma.employee.findFirst({
    where: { id, companyId: req.user!.companyId! },
    include: { payrolls: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' })
  res.json({ success: true, data: employee })
})

// PUT /api/employees/:id
router.put('/:id', authorize('ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string
  const parsed = validate(employeeSchema.partial(), req.body)
  if ('error' in parsed) return res.status(400).json({ success: false, error: parsed.error })

  const employee = await prisma.employee.findFirst({ where: { id, companyId: req.user!.companyId! } })
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' })

  const updated = await prisma.employee.update({ where: { id }, data: parsed.data })
  res.json({ success: true, data: updated })
})

// PATCH /api/employees/:id/status
router.patch('/:id/status', authorize('ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string
  const { status } = req.body as { status: string }
  if (!['ACTIVE', 'SUSPENDED', 'TERMINATED'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' })
  }

  const employee = await prisma.employee.findFirst({ where: { id, companyId: req.user!.companyId! } })
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' })

  const updated = await prisma.employee.update({ where: { id }, data: { status: status as EmployeeStatus } })
  res.json({ success: true, data: updated })
})

// DELETE /api/employees/:id
router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string
  const employee = await prisma.employee.findFirst({ where: { id, companyId: req.user!.companyId! } })
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' })

  await prisma.employee.delete({ where: { id } })
  res.json({ success: true, message: 'Employee removed' })
})

export default router
