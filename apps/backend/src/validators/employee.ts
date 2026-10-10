import { z } from 'zod'

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  walletAddress: z.string().min(10),
  title: z.string().optional(),
  salary: z.number().positive(),
  token: z.enum(['USDC', 'USDT', 'XLM']).default('USDC'),
  paymentFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('MONTHLY'),
})

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  walletAddress: z.string().min(10).optional(),
  title: z.string().optional(),
  salary: z.number().positive().optional(),
  token: z.enum(['USDC', 'USDT', 'XLM']).optional(),
  paymentFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
})

export const updateEmployeeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']),
})

export const employeeSchema = createEmployeeSchema

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusSchema>
