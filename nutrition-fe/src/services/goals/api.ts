import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

type ApiRes<T> = ApiSuccessResponse<T> | { success: false; message?: string | string[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as ApiRes<T> | null

  if (!response.ok) {
    const rawMessage =
      payload && 'message' in payload
        ? (payload as { message?: string | string[] }).message
        : undefined
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || 'Yêu cầu thất bại'
    throw new ApiError(message, response.status)
  }

  return (payload as ApiSuccessResponse<T>).data as T
}

// ============================================
// Types trả về từ API
// ============================================
export type GoalApiResponse = {
  id: number
  tai_khoan_id: number
  loai_muc_tieu: 'giam_can' | 'tang_can' | 'giu_can'
  trang_thai: 'dang_ap_dung' | 'luu_tru' | 'hoan_thanh'
  can_nang_bat_dau_kg: number | null
  can_nang_muc_tieu_kg: number | null
  muc_tieu_calories_ngay: number | null
  muc_tieu_protein_g: number | null
  muc_tieu_carb_g: number | null
  muc_tieu_fat_g: number | null
  ngay_bat_dau: string | null
  ngay_muc_tieu: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type GoalsListResponse = {
  items: GoalApiResponse[]
  total: number
}

// ============================================
// Types gửi lên API (POST / PATCH)
// ============================================
export type CreateGoalPayload = {
  loaiMucTieu: 'giam_can' | 'tang_can' | 'giu_can'
  canNangBatDauKg?: number
  canNangMucTieuKg?: number
  mucTieuCaloriesNgay?: number
  mucTieuProteinG?: number
  mucTieuCarbG?: number
  mucTieuFatG?: number
  ngayBatDau?: string
  ngayMucTieu?: string
}

export type UpdateGoalPayload = {
  loaiMucTieu?: 'giam_can' | 'tang_can' | 'giu_can'
  trangThai?: 'dang_ap_dung' | 'luu_tru' | 'hoan_thanh'
  canNangBatDauKg?: number
  canNangMucTieuKg?: number
  mucTieuCaloriesNgay?: number
  mucTieuProteinG?: number
  mucTieuCarbG?: number
  mucTieuFatG?: number
  ngayBatDau?: string
  ngayMucTieu?: string
}

// ============================================
// API calls
// ============================================

/** Lấy tất cả mục tiêu */
export async function getGoals(): Promise<GoalsListResponse> {
  return request<GoalsListResponse>('/me/goals')
}

/** Lấy mục tiêu hiện tại đang áp dụng */
export async function getCurrentGoal(): Promise<GoalApiResponse | null> {
  return request<GoalApiResponse | null>('/me/goals/current')
}

/** Tạo mục tiêu mới */
export async function createGoal(payload: CreateGoalPayload): Promise<GoalApiResponse> {
  return request<GoalApiResponse>('/me/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Cập nhật mục tiêu theo id */
export async function updateGoal(
  goalId: number,
  payload: UpdateGoalPayload
): Promise<GoalApiResponse> {
  return request<GoalApiResponse>(`/me/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/** Xóa mục tiêu theo id */
export async function deleteGoal(goalId: number): Promise<void> {
  return request<void>(`/me/goals/${goalId}`, {
    method: 'DELETE',
  })
}