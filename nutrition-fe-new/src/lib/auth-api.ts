'use client'

import { apiRequest, type AuthUser } from './auth'

export type RegisterPayload = {
  vaiTro: 'customer' | 'expert'
  hoTen: string
  email: string
  matKhau: string
  xacNhanMatKhau: string
  chuyenMon?: string
  moTa?: string
}

export async function login(payload: { email: string; matKhau: string }) {
  const response = await apiRequest<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data.user
}

export async function register(payload: RegisterPayload) {
  const response = await apiRequest<{ user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data.user
}

export async function getMe() {
  const response = await apiRequest<AuthUser>('/auth/me')
  return response.data
}

export async function forgotPassword(payload: { email: string }) {
  return apiRequest<null>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function verifyOtp(payload: { email: string; otp: string }) {
  return apiRequest<null>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resetPassword(payload: {
  email: string
  matKhauMoi: string
  xacNhanMatKhau: string
}) {
  return apiRequest<null>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout() {
  return apiRequest<null>('/auth/logout', { method: 'POST' })
}
