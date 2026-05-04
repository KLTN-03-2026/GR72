'use client'

import { apiRequest } from './auth'

export async function customerGet<T>(path: string) {
  const response = await apiRequest<T>(`/customer${path}`)
  return response.data
}

export async function customerPost<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/customer${path}`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
  return response.data
}

export async function customerPostWithInit<T>(path: string, body?: unknown, init?: RequestInit) {
  const response = await apiRequest<T>(`/customer${path}`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  })
  return response.data
}

export async function customerPatch<T>(path: string, body?: unknown) {
  const response = await apiRequest<T>(`/customer${path}`, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
  })
  return response.data
}

export async function customerDelete<T>(path: string) {
  const response = await apiRequest<T>(`/customer${path}`, {
    method: 'DELETE',
  })
  return response.data
}
