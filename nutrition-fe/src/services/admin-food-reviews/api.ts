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

export type ReviewRequestStatus = 'cho_duyet' | 'da_duyet' | 'tu_choi'

export type ReviewRequestUser = {
  id: number
  ho_ten: string
  email: string
}

export type FoodReviewRequest = {
  id: number
  thuc_pham_id: number | null
  loai_yeu_cau: string
  ten_nguon: string | null
  ma_nguon: string | null
  de_xuat_boi: number
  nguoi_de_xuat: ReviewRequestUser | null
  trang_thai: ReviewRequestStatus
  du_lieu_hien_tai: Record<string, unknown> | null
  du_lieu_de_xuat: Record<string, unknown>
  ly_do: string | null
  duyet_boi: number | null
  nguoi_duyet: ReviewRequestUser | null
  duyet_luc: string | null
  ghi_chu_duyet: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type FoodReviewQuery = {
  trangThai?: ReviewRequestStatus
  keyword?: string
  page?: number
  limit?: number
}

export type FoodReviewListResponse = {
  items: FoodReviewRequest[]
  pagination: {
    page: number
    limit: number
    total: number
  }
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

export async function getFoodReviewRequests(query: FoodReviewQuery) {
  const queryString = buildQueryString({
    trangThai: query.trangThai,
    keyword: query.keyword,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })

  const response = await request<FoodReviewListResponse>(
    `/admin/food-review-requests${queryString}`
  )
  return response.data
}

export async function getFoodReviewDetail(id: number) {
  const response = await request<FoodReviewRequest>(
    `/admin/food-review-requests/${id}`
  )
  return response.data
}

export async function approveFoodReview(id: number, ghiChuDuyet?: string) {
  const response = await request<FoodReviewRequest>(
    `/admin/food-review-requests/${id}/approve`,
    {
      method: 'PATCH',
      body: JSON.stringify({ ghiChuDuyet }),
    }
  )
  return response.data
}

export async function rejectFoodReview(id: number, ghiChuDuyet: string) {
  const response = await request<FoodReviewRequest>(
    `/admin/food-review-requests/${id}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify({ ghiChuDuyet }),
    }
  )
  return response.data
}
