const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`)
  return json as T
}

// ============================================================
// Meal Logs
// ============================================================
export type MealType = 'bua_sang' | 'bua_trua' | 'bua_toi' | 'bua_phu'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  bua_sang: 'Bữa sáng',
  bua_trua: 'Bữa trưa',
  bua_toi: 'Bữa tối',
  bua_phu: 'Bữa phụ',
}

export type MealLogItem = {
  id: number
  tai_khoan_id: number
  ngay_ghi: string
  loai_bua_an: MealType
  ghi_chu: string | null
  chi_tiet: MealLogDetail[]
  tao_luc: string
  cap_nhat_luc: string
}

export type MealLogDetail = {
  id: number
  nhat_ky_bua_an_id: number
  loai_nguon: 'thuc_pham' | 'cong_thuc'
  nguon_id: number | null
  cong_thuc_id: number | null
  thuc_pham_id: number | null
  so_luong: number
  don_vi: string
  calories: number
  protein_g: number
  carb_g: number
  fat_g: number
  chat_xo_g: number | null
  natri_mg: number | null
}

export type CreateMealLogDto = {
  ngayGhi: string
  loaiBuaAn: MealType
  ghiChu?: string
  chiTiet: {
    loaiNguon: 'thuc_pham' | 'cong_thuc'
    thucPhamId?: number
    congThucId?: number
    soLuong: number
    donVi: string
  }[]
}

export type MealLogResponse = {
  success: boolean
  message: string
  data: MealLogItem
}

export async function createMealLog(dto: CreateMealLogDto) {
  return apiFetch<MealLogResponse>('/me/meal-logs', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export async function getMealLogs(params?: {
  ngay?: string
  page?: number
  limit?: number
}) {
  const q = new URLSearchParams()
  if (params?.ngay) q.set('ngay', params.ngay)
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  return apiFetch<{ success: boolean; message: string; data: { items: MealLogItem[]; pagination: { page: number; limit: number; total: number } } }>(`/me/meal-logs?${q.toString()}`)
}
