import { z } from 'zod'
export { registerSchema, loginSchema } from '../validators/auth'
export { employeeSchema, createEmployeeSchema, updateEmployeeSchema } from '../validators/employee'
export { payrollSchema, createPayrollSchema } from '../validators/payroll'

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors.map(e => e.message).join(', ') }
  }
  return { data: result.data }
}
