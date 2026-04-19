import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type UserPublishedArticle = {
  id: number
  tieu_de: string
  slug: string
  danh_muc: string | null
  the_gan: string[] | null
  tom_tat: string | null
  noi_dung: string
  anh_dai_dien_url: string | null
  tac_gia: { id: number; ho_ten: string } | null
  xuat_ban_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type UserPublishedMealTemplate = {
  id: number
  tieu_de: string
  mo_ta: string | null
  loai_muc_tieu_phu_hop: string | null
  calories_muc_tieu: number | null
  tac_gia: { id: number; ho_ten: string } | null
  tao_luc: string
  cap_nhat_luc: string
}

export type UserPublishedMealTemplateDetail = {
  id: number
  tieu_de: string
  mo_ta: string | null
  loai_muc_tieu_phu_hop: string | null
  calories_muc_tieu: number | null
  tac_gia: { id: number; ho_ten: string } | null
  chi_tiet: {
    id: number
    ngay_so: number
    loai_bua_an: string
    cong_thuc_id: number | null
    thuc_pham_id: number | null
    ten_mon: string | null
    so_luong: number | null
    don_vi: string | null
    ghi_chu: string | null
    thu_tu: number
  }[]
}

export type CopiedMealPlan = {
  id: number
  tieu_de: string
  ngay_ap_dung: string
  trang_thai: string
  tong_calories: number | null
  tong_protein_g: number | null
  tong_carb_g: number | null
  tong_fat_g: number | null
  so_luong_chi_tiet: number
  chi_tiet_tom_tat: {
    loai_bua_an: string
    ten_mon: string | null
    so_luong: number | null
    don_vi: string | null
  }[]
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null

  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : (rawMessage ?? 'Yeu cau that bai')
    throw new ApiError(String(message), response.status)
  }

  return payload as ApiSuccessResponse<T>
}

function buildQueryString(
  params: Record<string, string | number | undefined | null>,
) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function getPublishedArticles(query?: {
  search?: string
  danhMuc?: string
  page?: number
  limit?: number
}) {
  const queryString = buildQueryString({
    search: query?.search,
    danhMuc: query?.danhMuc,
    page: query?.page ?? 1,
    limit: query?.limit ?? 12,
  })
  const response = await request<{
    items: UserPublishedArticle[]
    pagination: { page: number; limit: number; total: number }
  }>(`/articles${queryString}`)
  return response.data
}

export async function getPublishedArticleBySlug(slug: string) {
  const response = await request<UserPublishedArticle>(`/articles/${slug}`)
  return response.data
}

export async function getPublishedMealTemplates(query?: {
  loaiMucTieu?: string
  page?: number
  limit?: number
}) {
  const queryString = buildQueryString({
    loaiMucTieu: query?.loaiMucTieu,
    page: query?.page ?? 1,
    limit: query?.limit ?? 20,
  })
  const response = await request<{
    items: UserPublishedMealTemplate[]
    pagination: { page: number; limit: number; total: number }
  }>(`/meal-templates${queryString}`)
  return response.data
}

export async function getPublishedMealTemplateById(id: number) {
  const response = await request<UserPublishedMealTemplateDetail>(
    `/meal-templates/${id}`,
  )
  return response.data
}

export async function copyMealPlanFromTemplate(
  templateId: number,
  payload?: { ngayApDung?: string; tieuDe?: string },
) {
  const response = await request<CopiedMealPlan>(
    `/me/meal-plans/from-template/${templateId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    },
  )
  return response.data
}
