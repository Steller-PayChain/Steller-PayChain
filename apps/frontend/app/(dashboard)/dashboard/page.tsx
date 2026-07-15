'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { StatCard } from '@/components/dashboard/stat-card'
import { PayrollTrendChart } from '@/components/dashboard/payroll-trend-chart'
import { formatCurrency } from '@/lib/utils'
import type { AnalyticsOverview } from '@/types'

interface AnalyticsData extends AnalyticsOverview {
  trend: { month: string; total: number }[]
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview')
      return res.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your payroll operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={data?.totalEmployees ?? 0}
          description={`${data?.activeEmployees ?? 0} active`}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Payroll"
          value={formatCurrency(data?.monthlyPayrollTotal ?? 0, 'USDC')}
          description="This month"
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Sent"
          value={formatCurrency(data?.totalPayrollSent ?? 0, 'USDC')}
          description="All time"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Payrolls"
          value={data?.pendingPayrolls ?? 0}
          description="Awaiting execution"
          icon={Clock}
          isLoading={isLoading}
        />
      </div>

      {data?.trend && <PayrollTrendChart data={data.trend} />}
    </div>
  )
}
