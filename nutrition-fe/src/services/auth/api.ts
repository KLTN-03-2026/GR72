import { AUTH_API_PREFIX } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

type ApiErrorResponse = {
  success: false
  message?: string | string[]
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  user: AuthUser
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${AUTH_API_PREFIX}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null

  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || 'Yeu cau that bai'

    throw new ApiError(message, response.status)
  }

  return payload as ApiSuccessResponse<T>
}

export async function login(payload: LoginPayload) {
  const response = await request<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data.user
}

export async function logout() {
  await request<null>('/logout', {
    method: 'POST',
  })
}

export async function getCurrentUser() {
  const response = await request<AuthUser | null>('/me', {
    method: 'GET',
  })

  return response.data
}
