import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

type ApiErrorResponse = {
  success: false
  message?: string | string[]
}

export type AdminUserRole =
  | 'nguoi_dung'
  | 'chuyen_gia_dinh_duong'
  | 'quan_tri'

export type AdminUserStatus = 'hoat_dong' | 'khong_hoat_dong' | 'bi_khoa'

export type AdminUser = {
  id: number
  email: string
  vai_tro: AdminUserRole
  trang_thai: AdminUserStatus
  ho_ten: string
  dang_nhap_cuoi_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type AdminUsersQuery = {
  keyword?: string
  vaiTro?: AdminUserRole
  trangThai?: AdminUserStatus
  page?: number
  limit?: number
}

export type AdminUsersListResponse = {
  items: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

type UpdateAdminUserPayload = {
  hoTen?: string
  email?: string
  vaiTro?: AdminUserRole
  trangThai?: AdminUserStatus
}

function buildQueryString(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function request<T>(path: string, init?: RequestInit) {
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

export async function getAdminUsers(query: AdminUsersQuery) {
  const queryString = buildQueryString({
    keyword: query.keyword,
    vaiTro: query.vaiTro,
    trangThai: query.trangThai,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })

  const response = await request<AdminUsersListResponse>(`/admin/users${queryString}`)
  return response.data
}

export async function getAdminUserDetail(id: number) {
  const response = await request<AdminUser>(`/admin/users/${id}`)
  return response.data
}

export async function updateAdminUser(id: number, payload: UpdateAdminUserPayload) {
  const response = await request<AdminUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateAdminUserRole(id: number, vaiTro: AdminUserRole) {
  const response = await request<{ id: number; vai_tro: AdminUserRole }>(
    `/admin/users/${id}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ vaiTro }),
    }
  )

  return response.data
}

export async function updateAdminUserStatus(id: number, trangThai: AdminUserStatus) {
  const response = await request<{ id: number; trang_thai: AdminUserStatus }>(
    `/admin/users/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ trangThai }),
    }
  )

  return response.data
}

export async function resetAdminUserPassword(id: number, newPassword: string) {
  const response = await request<{ id: number }>(`/admin/users/${id}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
  })

  return response.data
}

export async function deleteAdminUser(id: number) {
  const response = await request<{ id: number }>(`/admin/users/${id}`, {
    method: 'DELETE',
  })

  return response.data
}
