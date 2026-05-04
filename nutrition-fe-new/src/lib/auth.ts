export type UserRole = 'admin' | 'expert' | 'customer'

export type AuthUser = {
  id: number
  email: string
  ho_ten: string
  vai_tro: UserRole
  trang_thai: string
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const AUTH_COOKIE_NAME = 'access_token'

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  expert: '/nutritionist/dashboard',
  customer: '/user',
}

export function getHomeForRole(role: UserRole) {
  return ROLE_HOME[role] ?? '/user'
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | { success: false; message?: string | string[] }
    | null

  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || 'Yeu cau that bai'
    throw new ApiError(message, response.status)
  }

  return payload as ApiResponse<T>
}

export function isAuthPath(pathname: string) {
  return [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-otp',
    '/reset-password',
  ].includes(pathname)
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (pathname.startsWith('/admin')) return role === 'admin'
  if (pathname.startsWith('/nutritionist')) return role === 'expert'
  if (pathname.startsWith('/user')) return role === 'customer'
  return true
}

