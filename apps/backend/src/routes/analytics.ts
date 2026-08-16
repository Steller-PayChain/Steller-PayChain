import { Router, Response } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate, requireCompany } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/analytics/overview
router.get('/overview', authenticate, requireCompany, async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId!

  const [totalEmployees, activeEmployees, payrolls] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.payroll.findMany({ where: { companyId } }),
  ])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyPayrolls = payrolls.filter(p => new Date(p.paymentDate) >= startOfMonth)
  const executedPayrolls = payrolls.filter(p => p.status === 'EXECUTED')
  const pendingPayrolls = payrolls.filter(p => p.status === 'PENDING' || p.status === 'APPROVED')

  const monthlyTotal = monthlyPayrolls.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalSent = executedPayrolls.reduce((sum, p) => sum + Number(p.amount), 0)

  // Monthly trend (last 6 months)
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const total = executedPayrolls
      .filter(p => new Date(p.executedAt ?? p.paymentDate) >= d && new Date(p.executedAt ?? p.paymentDate) < end)
      .reduce((sum, p) => sum + Number(p.amount), 0)
    return { month: d.toLocaleString('default', { month: 'short' }), total }
  })

  res.json({
    success: true,
    data: {
      totalEmployees,
      activeEmployees,
      monthlyPayrollTotal: monthlyTotal,
      totalPayrollSent: totalSent,
      pendingPayrolls: pendingPayrolls.length,
      trend,
    },
  })
})

// GET /api/analytics/monthly
router.get('/monthly', authenticate, requireCompany, async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId!

  const payrolls = await prisma.payroll.findMany({
    where: { companyId, status: 'EXECUTED' },
  })

  const now = new Date()
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const month = d.toLocaleString('en-US', { month: 'short' })
    return {
      month,
      yearMonth,
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      USDC: 0,
      USDT: 0,
      XLM: 0,
      total: 0,
    }
  })

  for (const p of payrolls) {
    const date = new Date(p.executedAt ?? p.paymentDate ?? p.createdAt)
    const pYear = date.getFullYear()
    const pMonth = date.getMonth()

    const slot = monthlyData.find(m => m.year === pYear && m.monthIndex === pMonth)
    if (slot) {
      const amt = Number(p.amount)
      if (p.token === 'USDC') slot.USDC += amt
      else if (p.token === 'USDT') slot.USDT += amt
      else if (p.token === 'XLM') slot.XLM += amt
      slot.total += amt
    }
  }

  const responseData = monthlyData.map(({ month, yearMonth, USDC, USDT, XLM, total }) => ({
    month,
    yearMonth,
    USDC,
    USDT,
    XLM,
    total,
  }))

  res.json({
    success: true,
    data: responseData,
  })
})

export default router
