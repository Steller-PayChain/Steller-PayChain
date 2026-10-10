import { Router, Response } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate, authorize, requireCompany } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createEmployeeSchema, updateEmployeeSchema, updateEmployeeStatusSchema } from '../validators/employee'
import type { AuthRequest } from '../middleware/auth'
import { EmployeeStatus } from '@prisma/client'

const router = Router()

router.use(authenticate, requireCompany)

// GET /api/employees
router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, status } = req.query as Record<string, string | undefined>
  const companyId = req.user!.companyId!

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      ...(status ? { status: status as EmployeeStatus } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: employees })
})

// POST /api/employees
router.post('/', authorize('ADMIN', 'HR_MANAGER'), validate(createEmployeeSchema), async (req: AuthRequest, res: Response) => {
  const data = req.body
  const companyId = req.user!.companyId!
  const existing = await prisma.employee.findUnique({ where: { companyId_email: { companyId, email: data.email } } })
  if (existing) return res.status(409).json({ success: false, error: 'Employee with this email already exists' })

  const employee = await prisma.employee.create({ data: { ...data, companyId, salary: data.salary } })
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
router.put('/:id', authorize('ADMIN', 'HR_MANAGER'), validate(updateEmployeeSchema), async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string
  const data = req.body

  const employee = await prisma.employee.findFirst({ where: { id, companyId: req.user!.companyId! } })
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' })

  const updated = await prisma.employee.update({ where: { id }, data })
  res.json({ success: true, data: updated })
})

// PATCH /api/employees/:id/status
router.patch('/:id/status', authorize('ADMIN', 'HR_MANAGER'), validate(updateEmployeeStatusSchema), async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string
  const { status } = req.body as { status: EmployeeStatus }

  const employee = await prisma.employee.findFirst({ where: { id, companyId: req.user!.companyId! } })
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' })

  const updated = await prisma.employee.update({ where: { id }, data: { status } })
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
