'use client'

import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { PayrollTrendChart } from '@/components/dashboard/payroll-trend-chart'
import { Users, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
  })

  const tokenData = [
    { name: 'USDC', value: 65 },
    { name: 'USDT', value: 20 },
    { name: 'XLM', value: 15 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Payroll insights and spending overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={data?.totalEmployees ?? 0} icon={Users} />
        <StatCard title="Monthly Payroll" value={formatCurrency(data?.monthlyPayrollTotal ?? 0, 'USDC')} icon={DollarSign} />
        <StatCard title="Total Sent" value={formatCurrency(data?.totalPayrollSent ?? 0, 'USDC')} icon={TrendingUp} />
        <StatCard title="Pending" value={data?.pendingPayrolls ?? 0} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayrollTrendChart />

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Token Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={tokenData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {tokenData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, 'Share']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
