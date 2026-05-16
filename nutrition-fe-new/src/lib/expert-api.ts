'use client'

import { apiRequest } from './auth'

export async function expertGet<T>(path: string) {
  const response = await apiRequest<T>(`/expert${path}`)
  return response.data
}

export async function expertPost<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/expert${path}`, { method: 'POST', body: JSON.stringify(body ?? {}) })
  return response.data
}

export async function expertPatch<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/expert${path}`, { method: 'PATCH', body: JSON.stringify(body ?? {}) })
  return response.data
}

export async function expertPut<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/expert${path}`, { method: 'PUT', body: JSON.stringify(body ?? {}) })
  return response.data
}

export async function expertDelete<T>(path: string) {
  const response = await apiRequest<T>(`/expert${path}`, { method: 'DELETE' })
  return response.data
}

export async function expertPostFormData<T>(path: string, formData: FormData) {
  const response = await fetch(`/api/expert${path}`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    body: formData,
  })
  const payload = await response.json().catch(() => null) as { message?: string | string[]; data?: T } | null
  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || 'Yeu cau that bai'
    throw new Error(message)
  }
  return (payload?.data ?? null) as T
}
