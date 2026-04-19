import { ApiError } from '@/services/auth/api'

type ApiRes<T> = { success: true; data: T }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch (err) {
    console.error('[User Notifications API] Network error:', path, err)
    throw new ApiError('Lỗi kết nối server', 0)
  }

  const text = await res.text()
  let payload: { success?: boolean; data?: T; message?: string | string[] } | null = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('Server trả về dữ liệu không hợp lệ', res.status)
  }

  if (!res.ok) {
    const message = Array.isArray(payload?.message)
      ? payload?.message.join(', ')
      : (payload?.message ?? `Lỗi ${res.status}`)
    throw new ApiError(String(message), res.status)
  }

  return (payload as ApiRes<T>).data
}

export type UserNotification = {
  id: number
  tai_khoan_id: number
  loai: string
  tieu_de: string
  noi_dung: string
  trang_thai: 'chua_doc' | 'da_doc'
  duong_dan_hanh_dong: string | null
  tao_luc: string
  doc_luc: string | null
  cap_nhat_luc: string
}

type Paginated<T> = { items: T[]; pagination: { page: number; limit: number; total: number } }

export async function getUserNotifications(q?: { trangThai?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<UserNotification>>(`/user/notifications${qs ? `?${qs}` : ''}`)
}

export async function markUserNotificationRead(id: number) {
  return request<UserNotification>(`/user/notifications/${id}/read`, { method: 'PATCH' })
}

export async function getUserUnreadCount() {
  return request<{ count: number }>('/user/notifications/unread-count')
}
