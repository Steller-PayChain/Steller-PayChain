import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validate } from './validate'
import { registerSchema, loginSchema } from '../validators/auth'
import { createEmployeeSchema } from '../validators/employee'
import { createPayrollSchema } from '../validators/payroll'

describe('validate middleware', () => {
  it('calls next() and updates req.body on valid input', () => {
    let nextCalled = false
    const req: any = {
      body: {
        name: 'Alice Developer',
        email: 'alice@example.com',
        password: 'securePassword123',
      },
    }
    const res: any = {
      status: () => res,
      json: () => res,
    }
    const next = () => {
      nextCalled = true
    }

    const middleware = validate(registerSchema)
    middleware(req, res, next)

    assert.strictEqual(nextCalled, true)
    assert.strictEqual(req.body.role, 'ADMIN') // default applied
  })

  it('returns 400 with structured details on invalid input', () => {
    let statusCode = 0
    let responseBody: any = null

    const req: any = {
      body: {
        email: 'invalid-email',
        password: '',
      },
    }
    const res: any = {
      status: (code: number) => {
        statusCode = code
        return res
      },
      json: (data: any) => {
        responseBody = data
        return res
      },
    }
    let nextCalled = false
    const next = () => {
      nextCalled = true
    }

    const middleware = validate(loginSchema)
    middleware(req, res, next)

    assert.strictEqual(nextCalled, false)
    assert.strictEqual(statusCode, 400)
    assert.strictEqual(responseBody.error, 'Validation failed')
    assert.strictEqual(Array.isArray(responseBody.details), true)
    assert.strictEqual(responseBody.details.length > 0, true)
    assert.strictEqual(responseBody.details[0].field, 'email')
  })
})

describe('validators schemas', () => {
  it('validates employee schemas correctly', () => {
    const validEmployee = {
      name: 'Bob Builder',
      email: 'bob@example.com',
      walletAddress: 'GA1234567890ABCDEF',
      salary: 5000,
    }
    const parsed = createEmployeeSchema.safeParse(validEmployee)
    assert.strictEqual(parsed.success, true)

    const invalidEmployee = {
      name: 'B',
      email: 'not-an-email',
      walletAddress: 'short',
      salary: -100,
    }
    const failed = createEmployeeSchema.safeParse(invalidEmployee)
    assert.strictEqual(failed.success, false)
  })

  it('validates payroll schema correctly', () => {
    const validPayroll = {
      employeeId: 'emp-123',
      amount: 2500,
      token: 'USDC',
      paymentDate: '2026-10-15T12:00:00.000Z',
    }
    const parsed = createPayrollSchema.safeParse(validPayroll)
    assert.strictEqual(parsed.success, true)

    const invalidPayroll = {
      employeeId: '',
      amount: -50,
      token: 'INVALID_TOKEN',
      paymentDate: 'not-a-date',
    }
    const failed = createPayrollSchema.safeParse(invalidPayroll)
    assert.strictEqual(failed.success, false)
  })
})
