import axios from 'axios'
import type { Employee } from '@/types'


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('paychain_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('paychain_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export interface GetEmployeesOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface PaginatedEmployeesResponse {
  success: boolean
  data: Employee[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function getEmployees(options: GetEmployeesOptions = {}): Promise<PaginatedEmployeesResponse> {
  const { page = 1, limit = 10, search, status } = options
  const params = new URLSearchParams()
  if (page) params.set('page', page.toString())
  if (limit) params.set('limit', limit.toString())
  if (search) params.set('search', search)
  if (status) params.set('status', status)

  const res = await api.get(`/employees?${params.toString()}`)
  return res.data
}

