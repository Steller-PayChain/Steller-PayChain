import axios from 'axios'

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

export interface MonthlyAnalyticsData {
  month: string
  yearMonth: string
  USDC: number
  USDT: number
  XLM: number
  total: number
}

export async function getMonthlyAnalytics(): Promise<MonthlyAnalyticsData[]> {
  const res = await api.get('/analytics/monthly')
  return res.data.data
}

