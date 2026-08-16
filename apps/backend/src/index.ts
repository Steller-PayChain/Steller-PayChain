import app from './app'
import { startPayrollScheduler } from './jobs/payroll-scheduler'

const PORT = process.env.PORT || 4000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`PayChain API running on port ${PORT}`)
    startPayrollScheduler()
  })
}

export default app

