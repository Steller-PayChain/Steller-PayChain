import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  isLoading?: boolean
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className, isLoading }: StatCardProps) {

  if(isLoading){
    return (
      <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <Skeleton className="h-4 w-24" />
        </CardTitle>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <Skeleton className="h-6 w-24" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          <Skeleton className="h-4 w-32" />
        </p>
          <p className={cn('text-xs mt-1')}>
            <Skeleton className="h-4 w-16" />
          </p>
      </CardContent>
    </Card>
    )
  }
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-green-500' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
