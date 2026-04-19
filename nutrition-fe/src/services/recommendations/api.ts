import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

type ApiRes<T> = ApiSuccessResponse<T> | { success: false; message?: string | string[] }

export type Recommendation = {
  id: number
  loai_khuyen_nghi: string
  trang_thai: 'moi_tao' | 'da_ap_dung' | string
  ngay_muc_tieu: string | null
  muc_tieu_calories: number | null
  muc_tieu_protein_g: number | null
  muc_tieu_carb_g: number | null
  muc_tieu_fat_g: number | null
  canh_bao: string[]
  ly_giai: string | null
  du_lieu_khuyen_nghi: Record<string, unknown>
  ke_hoach_an_da_ap_dung_id: number | null
  tao_luc: string
  cap_nhat_luc: string
}

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
      : rawMessage || 'Yeu cau that bai'
    throw new ApiError(message, response.status)
  }

  return (payload as ApiSuccessResponse<T>).data as T
}

export async function getNutritionRecommendation() {
  return request<Recommendation>('/me/recommendations/nutrition')
}

export async function getNextMealRecommendation() {
  return request<Recommendation>('/me/recommendations/meals/next')
}

export async function getDailyMealPlanRecommendation() {
  return request<Recommendation>('/me/recommendations/meal-plans/daily')
}

export async function getHealthManagementRecommendation() {
  return request<Recommendation>('/me/recommendations/health-management')
}

export async function applyRecommendation(id: number, payload?: { ngayApDung?: string }) {
  return request<{
    recommendation: Recommendation
    ke_hoach_an?: {
      id: number
      tieu_de: string
      ngay_ap_dung: string
      trang_thai: string
    }
  }>(`/me/recommendations/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  })
}
