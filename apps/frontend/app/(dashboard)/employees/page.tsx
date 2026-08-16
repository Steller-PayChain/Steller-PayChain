'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, UserCheck, UserX, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import api, { getEmployees } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, shortenAddress } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Employee } from '@/types'
import { AddEmployeeDialog } from '@/components/employees/add-employee-dialog'
import { EditEmployeeDialog } from '@/components/employees/edit-employee-dialog'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  TERMINATED: 'destructive',
}

export default function EmployeesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageParam = searchParams.get('page')
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const limit = 10

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [showAdd, setShowAdd] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const createQueryString = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, String(value))
      }
    })
    return newSearchParams.toString()
  }

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, limit, search, statusFilter],
    queryFn: () => getEmployees({ page, limit, search, status: statusFilter }),
  })

  const employees = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total ?? employees.length
  const totalPages = Math.max(1, pagination?.totalPages ?? Math.ceil(total / limit) || 1)

  const handlePageChange = (newPage: number) => {
    const queryString = createQueryString({ page: newPage })
    router.push(`${pathname}?${queryString}`)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    const queryString = createQueryString({ search: value, page: 1 })
    router.push(`${pathname}?${queryString}`)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    const queryString = createQueryString({ status, page: 1 })
    router.push(`${pathname}?${queryString}`)
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/employees/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast({ title: status === 'ACTIVE' ? 'Employee resumed' : 'Employee suspended', variant: 'success' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast({ title: 'Employee removed', variant: 'success' })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">{total} total employees</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['', 'ACTIVE', 'SUSPENDED'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange(s)}
            >
              {s || 'All'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No employees found. Add your first employee to get started.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                        {emp.title && <p className="text-xs text-muted-foreground">{emp.title}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{shortenAddress(emp.walletAddress)}</TableCell>
                    <TableCell>{formatCurrency(emp.salary, emp.token)}</TableCell>
                    <TableCell className="capitalize">{emp.paymentFrequency.toLowerCase()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[emp.status]}>{emp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => setEditEmployee(emp)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {emp.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Suspend"
                            onClick={() => statusMutation.mutate({ id: emp.id, status: 'SUSPENDED' })}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Resume"
                            onClick={() => statusMutation.mutate({ id: emp.id, status: 'ACTIVE' })}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Remove"
                          onClick={() => deleteMutation.mutate(emp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {employees.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} employees
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddEmployeeDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <EditEmployeeDialog employee={editEmployee} onClose={() => setEditEmployee(null)} />
    </div>
  )
}
