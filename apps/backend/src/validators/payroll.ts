import { z } from 'zod'

export const createPayrollSchema = z.object({
  employeeId: z.string().min(1),
  amount: z.number().positive(),
  token: z.enum(['USDC', 'USDT', 'XLM']),
  paymentDate: z.string().datetime(),
})

export const payrollSchema = createPayrollSchema

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>
