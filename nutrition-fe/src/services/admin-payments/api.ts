import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type PaymentMethod = 'chuyen_khoan' | 'vi_dien_tu' | 'cong_thanh_toan' | 'thu_cong' | 'mien_phi'
export type PaymentStatus = 'cho_thanh_toan' | 'thanh_cong' | 'that_bai' | 'da_hoan_tien'

export type Payment = {
  id: number
  tai_khoan_id: number
  tai_khoan: { id: number; ho_ten: string; email: string } | null
  dang_ky_goi_dich_vu_id: number
  goi_dich_vu_id: number
  goi_dich_vu: { id: number; ten_goi: string } | null
  ma_giao_dich: string
  phuong_thuc_thanh_toan: PaymentMethod
  so_tien: number
  trang_thai: PaymentStatus
  thanh_toan_luc: string | null
  noi_dung_thanh_toan: string | null
  xac_nhan_boi: number | null
  xac_nhan_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type PaymentListResponse = {
  items: Payment[]
  pagination: { page: number; limit: number; total: number }
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

export async function getPayments(query?: { trangThai?: PaymentStatus; page?: number; limit?: number }) {
  const params = new URLSearchParams()
  if (query?.trangThai) params.set('trangThai', query.trangThai)
  if (query?.page) params.set('page', String(query.page))
  if (query?.limit) params.set('limit', String(query.limit))
  const qs = params.toString()
  const response = await request<PaymentListResponse>(`/admin/payments${qs ? `?${qs}` : ''}`)
  return response.data
}

export async function confirmPayment(id: number) {
  const response = await request<Payment>(`/admin/payments/${id}/confirm`, { method: 'PATCH' })
  return response.data
}
