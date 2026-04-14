import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type Notification = {
  id: number
  tai_khoan_id: number
  tai_khoan: { id: number; ho_ten: string; email: string } | null
  nguoi_gui_id: number | null
  nguoi_gui: { id: number; ho_ten: string; email: string } | null
  loai: string
  tieu_de: string
  noi_dung: string
  trang_thai: 'chua_doc' | 'da_doc'
  duong_dan_hanh_dong: string | null
  tao_luc: string
  doc_luc: string | null
  cap_nhat_luc: string
}

export type NotificationListResponse = {
  items: Notification[]
  pagination: { page: number; limit: number; total: number }
}

export type CreateNotificationPayload = {
  taiKhoanId: number
  loai: string
  tieuDe: string
  noiDung: string
  duongDanHanhDong?: string
}

export type UpdateNotificationPayload = {
  tieuDe?: string
  noiDung?: string
  duongDanHanhDong?: string
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    ...init, credentials: 'include', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null
  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || 'Yeu cau that bai'
    throw new ApiError(message, response.status)
  }
  return payload as ApiSuccessResponse<T>
}

export async function getNotifications(query?: { trangThai?: string; page?: number; limit?: number; huong?: 'nhan' | 'gui' }) {
  const params = new URLSearchParams()
  if (query?.trangThai) params.set('trangThai', query.trangThai)
  if (query?.page) params.set('page', String(query.page))
  if (query?.limit) params.set('limit', String(query.limit))
  if (query?.huong) params.set('huong', query.huong)
  const qs = params.toString()
  return (await request<NotificationListResponse>(`/admin/notifications${qs ? `?${qs}` : ''}`)).data
}

export async function getAdminUnreadCount() {
  return (await request<{ count: number }>('/admin/notifications/unread-count')).data
}

export async function markAdminNotificationRead(id: number) {
  return (await request<Notification>(`/admin/notifications/${id}/read`, { method: 'PATCH' })).data
}

export async function createNotification(payload: CreateNotificationPayload) {
  return (await request<Notification>('/admin/notifications', { method: 'POST', body: JSON.stringify(payload) })).data
}

export async function updateNotification(id: number, payload: UpdateNotificationPayload) {
  return (await request<Notification>(`/admin/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).data
}

export async function deleteNotification(id: number) {
  return (await request<null>(`/admin/notifications/${id}`, { method: 'DELETE' })).data
}
