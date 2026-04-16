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

export type FoodGroup = {
  id: number
  ten: string
  slug: string
  mo_ta?: string
}

export type FoodItem = {
  id: number
  nhom_thuc_pham_id: number | null
  nhom_thuc_pham: FoodGroup | null
  ten: string
  slug: string
  mo_ta: string | null
  the_gan: string[]
  loai_nguon: 'noi_bo' | 'ben_ngoai'
  ten_nguon: string | null
  ma_nguon: string | null
  khau_phan_tham_chieu: number
  don_vi_khau_phan: string | null
  calories_100g: number
  protein_100g: number
  carb_100g: number
  fat_100g: number
  chat_xo_100g: number
  duong_100g: number
  natri_100g: number
  da_xac_minh: boolean
  cap_nhat_luc: string
}

export type FoodsResponse = {
  success: boolean
  message: string
  data: {
    items: FoodItem[]
    filters: {
      nhom_thuc_pham: FoodGroup[]
    }
    pagination: { page: number; limit: number; total: number }
  }
}

export async function getFoods(params?: {
  keyword?: string
  nhomThucPhamId?: number
  page?: number
  limit?: number
}) {
  const q = new URLSearchParams()
  if (params?.keyword?.trim()) q.set('keyword', params.keyword.trim())
  if (params?.nhomThucPhamId) q.set('nhomThucPhamId', String(params.nhomThucPhamId))
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))

  return apiFetch<FoodsResponse>(`/foods?${q.toString()}`)
}

export type FoodDetailResponse = {
  success: boolean
  message: string
  data: FoodItem
}

export async function getFoodDetail(id: number) {
  return apiFetch<FoodDetailResponse>(`/foods/${id}`)
}
