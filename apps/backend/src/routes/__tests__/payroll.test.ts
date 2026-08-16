import request from 'supertest'
import app from '../../app'
import { prisma } from '../../utils/prisma'
import { signToken } from '../../utils/auth'

jest.mock('../../services/payment', () => {
  const actual = jest.requireActual('../../services/payment')
  return {
    ...actual,
    executePayroll: jest.fn(async (payrollId: string) => {
      const { prisma: prismaClient } = require('../../utils/prisma')
      const payroll = await prismaClient.payroll.findUnique({ where: { id: payrollId } })
      if (!payroll) throw new Error('Payroll not found')
      if (payroll.status === 'EXECUTED') throw new Error('Payroll already executed')
      if (payroll.status === 'CANCELLED') throw new Error('Payroll is cancelled')

      await prismaClient.payroll.update({
        where: { id: payrollId },
        data: {
          status: 'EXECUTED',
          txHash: '0xmocktxhash123456789',
          executedAt: new Date(),
        },
      })
      return { success: true, txHash: '0xmocktxhash123456789' }
    }),
  }
})

describe('Payroll API Integration Tests', () => {
  let companyId: string
  let adminToken: string
  let hrToken: string
  let employeeToken: string
  let employeeId: string

  const createdPayrollIds: string[] = []

  beforeAll(async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Payroll Corp',
        chain: 'STELLAR',
      },
    })
    companyId = company.id

    // Create test users and tokens
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: `admin_${Date.now()}@test.com`,
        password: 'hashedpassword123',
        role: 'ADMIN',
        companyId,
      },
    })
    adminToken = signToken({ userId: adminUser.id, email: adminUser.email, role: 'ADMIN', companyId })

    const hrUser = await prisma.user.create({
      data: {
        name: 'HR User',
        email: `hr_${Date.now()}@test.com`,
        password: 'hashedpassword123',
        role: 'HR_MANAGER',
        companyId,
      },
    })
    hrToken = signToken({ userId: hrUser.id, email: hrUser.email, role: 'HR_MANAGER', companyId })

    const empUser = await prisma.user.create({
      data: {
        name: 'Standard Employee User',
        email: `emp_${Date.now()}@test.com`,
        password: 'hashedpassword123',
        role: 'EMPLOYEE',
        companyId,
      },
    })
    employeeToken = signToken({ userId: empUser.id, email: empUser.email, role: 'EMPLOYEE', companyId })

    // Create test employee
    const employee = await prisma.employee.create({
      data: {
        companyId,
        name: 'Jane Doe',
        email: `jane_${Date.now()}@test.com`,
        walletAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        salary: 5000,
        token: 'USDC',
        status: 'ACTIVE',
      },
    })
    employeeId = employee.id
  })

  afterEach(async () => {
    if (createdPayrollIds.length > 0) {
      await prisma.payroll.deleteMany({
        where: { id: { in: createdPayrollIds } },
      })
      createdPayrollIds.length = 0
    }
  })

  afterAll(async () => {
    // Clean up created resources
    await prisma.payroll.deleteMany({ where: { companyId } })
    await prisma.employee.deleteMany({ where: { companyId } })
    await prisma.user.deleteMany({ where: { companyId } })
    await prisma.company.delete({ where: { id: companyId } })
    await prisma.$disconnect()
  })

  describe('Authentication & Authorization', () => {
    it('returns 401 Unauthorized when requesting payroll without token', async () => {
      const res = await request(app).get('/api/payroll')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('returns 403 Forbidden when standard EMPLOYEE attempts to create payroll', async () => {
      const res = await request(app)
        .post('/api/payroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId,
          amount: 1000,
          token: 'USDC',
          paymentDate: new Date().toISOString(),
        })

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Insufficient permissions')
    })

    it('returns 403 Forbidden when HR_MANAGER attempts to approve payroll', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          companyId,
          employeeId,
          amount: 1500,
          token: 'USDC',
          paymentDate: new Date(),
          status: 'PENDING',
        },
      })
      createdPayrollIds.push(payroll.id)

      const res = await request(app)
        .post(`/api/payroll/${payroll.id}/approve`)
        .set('Authorization', `Bearer ${hrToken}`)

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Insufficient permissions')
    })

    it('returns 403 Forbidden when HR_MANAGER attempts to execute payroll', async () => {
      const payroll = await prisma.payroll.create({
        data: {
          companyId,
          employeeId,
          amount: 1500,
          token: 'USDC',
          paymentDate: new Date(),
          status: 'APPROVED',
        },
      })
      createdPayrollIds.push(payroll.id)

      const res = await request(app)
        .post(`/api/payroll/${payroll.id}/execute`)
        .set('Authorization', `Bearer ${hrToken}`)

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Insufficient permissions')
    })
  })

  describe('Full Payroll Lifecycle (PENDING -> APPROVED -> EXECUTED)', () => {
    it('successfully runs full payroll lifecycle: create (PENDING) -> approve (APPROVED) -> execute (EXECUTED)', async () => {
      // 1. Create payroll as HR_MANAGER
      const createRes = await request(app)
        .post('/api/payroll')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId,
          amount: 2500,
          token: 'USDC',
          paymentDate: new Date().toISOString(),
        })

      expect(createRes.status).toBe(201)
      expect(createRes.body.success).toBe(true)
      expect(createRes.body.data).toBeDefined()
      expect(createRes.body.data.status).toBe('PENDING')

      const payrollId = createRes.body.data.id
      createdPayrollIds.push(payrollId)

      // Verify status in DB
      let dbPayroll = await prisma.payroll.findUnique({ where: { id: payrollId } })
      expect(dbPayroll?.status).toBe('PENDING')

      // 2. Approve payroll as ADMIN
      const approveRes = await request(app)
        .post(`/api/payroll/${payrollId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(approveRes.status).toBe(200)
      expect(approveRes.body.success).toBe(true)
      expect(approveRes.body.data.status).toBe('APPROVED')

      // Verify status in DB
      dbPayroll = await prisma.payroll.findUnique({ where: { id: payrollId } })
      expect(dbPayroll?.status).toBe('APPROVED')

      // 3. Execute payroll as ADMIN
      const executeRes = await request(app)
        .post(`/api/payroll/${payrollId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(executeRes.status).toBe(200)
      expect(executeRes.body.success).toBe(true)

      // Verify status in DB is EXECUTED
      dbPayroll = await prisma.payroll.findUnique({ where: { id: payrollId } })
      expect(dbPayroll?.status).toBe('EXECUTED')
      expect(dbPayroll?.txHash).toBe('0xmocktxhash123456789')
    })
  })

  describe('GET /api/payroll (List Payrolls)', () => {
    it('fetches payroll entries for the company and supports filtering', async () => {
      const p1 = await prisma.payroll.create({
        data: {
          companyId,
          employeeId,
          amount: 1000,
          token: 'USDC',
          paymentDate: new Date(),
          status: 'PENDING',
        },
      })
      const p2 = await prisma.payroll.create({
        data: {
          companyId,
          employeeId,
          amount: 2000,
          token: 'USDC',
          paymentDate: new Date(),
          status: 'APPROVED',
        },
      })
      createdPayrollIds.push(p1.id, p2.id)

      const res = await request(app)
        .get('/api/payroll?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      const foundPending = res.body.data.find((p: any) => p.id === p1.id)
      const foundApproved = res.body.data.find((p: any) => p.id === p2.id)
      expect(foundPending).toBeDefined()
      expect(foundApproved).toBeUndefined()
    })
  })
})
