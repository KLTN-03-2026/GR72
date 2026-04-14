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

export type SubscriptionStatus = 'cho_kich_hoat' | 'dang_hoat_dong' | 'het_han' | 'da_huy'
export type SubscriptionSource = 'nguoi_dung_tu_nang_cap' | 'quan_tri_cap' | 'khuyen_mai'

export type Subscription = {
  id: number
  tai_khoan_id: number
  tai_khoan: { id: number; ho_ten: string; email: string } | null
  goi_dich_vu_id: number
  goi_dich_vu: { id: number; ten_goi: string; slug: string } | null
  ma_dang_ky: string
  trang_thai: SubscriptionStatus
  ngay_bat_dau: string | null
  ngay_het_han: string | null
  tu_dong_gia_han: boolean
  nguon_dang_ky: SubscriptionSource
  ghi_chu: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type SubscriptionListResponse = {
  items: Subscription[]
  pagination: { page: number; limit: number; total: number }
}

export type SubscriptionQuery = {
  trangThai?: SubscriptionStatus
  goiDichVuId?: number
  keyword?: string
  page?: number
  limit?: number
}

export type CreateSubscriptionPayload = {
  taiKhoanId: number
  goiDichVuId: number
  ngayBatDau?: string
  ngayHetHan?: string
  tuDongGiaHan?: boolean
  nguonDangKy?: SubscriptionSource
  ghiChu?: string
}

export type UpdateSubscriptionPayload = {
  trangThai?: SubscriptionStatus
  ngayBatDau?: string
  ngayHetHan?: string
  tuDongGiaHan?: boolean
  ghiChu?: string
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

export async function getSubscriptions(query?: SubscriptionQuery) {
  const params = new URLSearchParams()
  if (query?.trangThai) params.set('trangThai', query.trangThai)
  if (query?.goiDichVuId) params.set('goiDichVuId', String(query.goiDichVuId))
  if (query?.keyword) params.set('keyword', query.keyword)
  if (query?.page) params.set('page', String(query.page))
  if (query?.limit) params.set('limit', String(query.limit))

  const qs = params.toString()
  const response = await request<SubscriptionListResponse>(
    `/admin/subscriptions${qs ? `?${qs}` : ''}`
  )
  return response.data
}

export async function getSubscription(id: number) {
  const response = await request<Subscription>(`/admin/subscriptions/${id}`)
  return response.data
}

export async function createSubscription(payload: CreateSubscriptionPayload) {
  const response = await request<Subscription>('/admin/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function updateSubscription(
  id: number,
  payload: UpdateSubscriptionPayload
) {
  const response = await request<Subscription>(`/admin/subscriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.data
}
