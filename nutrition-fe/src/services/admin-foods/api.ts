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

export type AdminFoodSourceType = 'noi_bo' | 'thu_cong' | 'api_ngoai'

export type AdminFoodGroup = {
  id: number
  ten: string
  slug: string
  mo_ta?: string | null
}

export type AdminFoodGroupPayload = {
  ten: string
  slug?: string
  moTa?: string
}

export type AdminFood = {
  id: number
  nhom_thuc_pham_id: number
  nhom_thuc_pham: AdminFoodGroup | null
  ten: string
  slug: string
  mo_ta: string | null
  the_gan: string[]
  loai_nguon: AdminFoodSourceType
  ten_nguon: string | null
  ma_nguon: string | null
  khau_phan_tham_chieu: number
  don_vi_khau_phan: string
  calories_100g: number
  protein_100g: number
  carb_100g: number
  fat_100g: number
  chat_xo_100g: number
  duong_100g: number
  natri_100g: number
  du_lieu_goc: Record<string, unknown> | null
  da_xac_minh: boolean
  tao_boi: number | null
  cap_nhat_boi: number | null
  tao_luc: string
  cap_nhat_luc: string
}

export type AdminFoodsQuery = {
  keyword?: string
  nhomThucPhamId?: number
  daXacMinh?: boolean
  loaiNguon?: AdminFoodSourceType
  page?: number
  limit?: number
}

export type AdminFoodsListResponse = {
  items: AdminFood[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export type AdminFoodPayload = {
  nhomThucPhamId: number
  ten: string
  slug?: string
  moTa?: string
  theGan?: string[]
  loaiNguon?: AdminFoodSourceType
  tenNguon?: string
  maNguon?: string
  khauPhanThamChieu: number
  donViKhauPhan: string
  calories100g: number
  protein100g: number
  carb100g: number
  fat100g: number
  chatXo100g?: number
  duong100g?: number
  natri100g?: number
  duLieuGoc?: string
  daXacMinh?: boolean
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
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

export async function getAdminFoods(query: AdminFoodsQuery) {
  const queryString = buildQueryString({
    keyword: query.keyword,
    nhomThucPhamId: query.nhomThucPhamId,
    daXacMinh: query.daXacMinh,
    loaiNguon: query.loaiNguon,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })

  const response = await request<AdminFoodsListResponse>(`/admin/foods${queryString}`)
  return response.data
}

export async function getAdminFoodsMeta() {
  const response = await request<{
    groups: AdminFoodGroup[]
    sourceTypes: AdminFoodSourceType[]
  }>('/admin/foods/meta')

  return response.data
}

export async function getAdminFoodGroups() {
  const response = await request<AdminFoodGroup[]>('/admin/food-groups')
  return response.data
}

export async function createAdminFoodGroup(payload: AdminFoodGroupPayload) {
  const response = await request<AdminFoodGroup>('/admin/food-groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateAdminFoodGroup(
  id: number,
  payload: Partial<AdminFoodGroupPayload>
) {
  const response = await request<AdminFoodGroup>(`/admin/food-groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteAdminFoodGroup(id: number) {
  const response = await request<{ id: number }>(`/admin/food-groups/${id}`, {
    method: 'DELETE',
  })

  return response.data
}

export async function getAdminFoodDetail(id: number) {
  const response = await request<AdminFood>(`/admin/foods/${id}`)
  return response.data
}

export async function createAdminFood(payload: AdminFoodPayload) {
  const response = await request<AdminFood>('/admin/foods', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateAdminFood(id: number, payload: Partial<AdminFoodPayload>) {
  const response = await request<AdminFood>(`/admin/foods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteAdminFood(id: number) {
  const response = await request<{ id: number }>(`/admin/foods/${id}`, {
    method: 'DELETE',
  })

  return response.data
}
