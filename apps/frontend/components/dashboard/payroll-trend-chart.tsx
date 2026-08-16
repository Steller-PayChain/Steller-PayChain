'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMonthlyAnalytics, MonthlyAnalyticsData } from '@/lib/api'
import { AlertCircle, RefreshCw } from 'lucide-react'

type TokenFilter = 'total' | 'USDC' | 'USDT' | 'XLM'

const tokenColors: Record<TokenFilter, { stroke: string; fillStop: string }> = {
  total: { stroke: '#3b82f6', fillStop: '#3b82f6' },
  USDC: { stroke: '#2563eb', fillStop: '#2563eb' },
  USDT: { stroke: '#10b981', fillStop: '#10b981' },
  XLM: { stroke: '#8b5cf6', fillStop: '#8b5cf6' },
}

interface PayrollTrendChartProps {
  data?: MonthlyAnalyticsData[]
}

export function PayrollTrendChart({ data: initialData }: PayrollTrendChartProps) {
  const [activeToken, setActiveToken] = useState<TokenFilter>('total')

  const { data: fetchedData, isLoading, isError, refetch } = useQuery<MonthlyAnalyticsData[]>({
    queryKey: ['analytics-monthly'],
    queryFn: getMonthlyAnalytics,
    initialData,
  })

  const chartData = fetchedData ?? initialData ?? []

  if (isLoading && !chartData.length) {
    return (
      <Card className="h-[320px] flex flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-muted rounded animate-pulse" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-14 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-[200px] w-full bg-muted/30 rounded animate-pulse flex items-end justify-between p-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-full bg-muted/60 rounded-t" style={{ height: `${((i % 5) + 2) * 15}%` }} />
          ))}
        </div>
      </Card>
    )
  }

  if (isError && !chartData.length) {
    return (
      <Card className="h-[320px] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div>
          <p className="font-semibold">Failed to load payroll trend data</p>
          <p className="text-xs text-muted-foreground">Unable to fetch monthly analytics from the server.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry
        </Button>
      </Card>
    )
  }

  const activeColor = tokenColors[activeToken]

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base font-semibold">Monthly Payroll Trend</CardTitle>
        <div className="flex items-center gap-1 flex-wrap">
          {(['total', 'USDC', 'USDT', 'XLM'] as TokenFilter[]).map((token) => (
            <Button
              key={token}
              variant={activeToken === token ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setActiveToken(token)}
            >
              {token === 'total' ? 'ALL' : token}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorGradient-${activeToken}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeColor.fillStop} stopOpacity={0.4} />
                <stop offset="95%" stopColor={activeColor.fillStop} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(v: number) => [
                `$${v.toLocaleString()}`,
                activeToken === 'total' ? 'Total Spend' : `${activeToken} Spend`,
              ]}
            />
            <Area
              type="monotone"
              dataKey={activeToken}
              stroke={activeColor.stroke}
              fill={`url(#colorGradient-${activeToken})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
