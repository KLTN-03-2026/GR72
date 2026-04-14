import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type AdminMealTemplateStatus = 'ban_nhap' | 'xuat_ban' | 'luu_tru'

export type AdminMealTemplateDetail = {
  id: number
  ngay_so: number
  loai_bua_an: string
  cong_thuc_id: number | null
  thuc_pham_id: number | null
  so_luong: number | null
  don_vi: string | null
  ghi_chu: string | null
  thu_tu: number
}

export type AdminMealTemplate = {
  id: number
  tao_boi: number
  nguoi_tao: { id: number; ho_ten: string; email: string } | null
  tieu_de: string
  mo_ta: string | null
  loai_muc_tieu_phu_hop: string | null
  calories_muc_tieu: number | null
  trang_thai: AdminMealTemplateStatus
  chi_tiet: AdminMealTemplateDetail[]
  tao_luc: string
  cap_nhat_luc: string
}

export type AdminMealTemplatesQuery = {
  tieuDe?: string
  trangThai?: AdminMealTemplateStatus
  loaiMucTieu?: string
  tacGiaId?: string
  page?: number
  limit?: number
}

export type AdminMealTemplatesListResponse = {
  items: AdminMealTemplate[]
  pagination: { page: number; limit: number; total: number }
}

export type AdminMealTemplateAuthor = {
  id: number
  ho_ten: string
  email: string
  so_thuc_don: number
}

export type AdminMealTemplateStats = { tong: number; ban_nhap: number; xuat_ban: number; luu_tru: number }

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
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null

  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage || 'Yeu cau that bai')
    throw new ApiError(message, response.status)
  }

  return payload as ApiSuccessResponse<T>
}

export async function getAdminMealTemplates(query: AdminMealTemplatesQuery) {
  const queryString = buildQueryString({
    tieuDe: query.tieuDe,
    trangThai: query.trangThai,
    loaiMucTieu: query.loaiMucTieu,
    tacGiaId: query.tacGiaId,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })
  const response = await request<AdminMealTemplatesListResponse>(`/admin/meal-templates${queryString}`)
  return response.data
}

export async function getAdminMealTemplate(id: number) {
  const response = await request<AdminMealTemplate>(`/admin/meal-templates/${id}`)
  return response.data
}

export async function getAdminMealTemplateStats() {
  const response = await request<AdminMealTemplateStats>('/admin/meal-templates/stats')
  return response.data
}

export async function getAdminMealTemplateAuthors() {
  const response = await request<AdminMealTemplateAuthor[]>('/admin/meal-templates/authors')
  return response.data
}

export async function getAdminPublishedMealTemplates(query?: { loaiMucTieu?: string; page?: number; limit?: number }) {
  const queryString = buildQueryString({
    loaiMucTieu: query?.loaiMucTieu,
    page: query?.page ?? 1,
    limit: query?.limit ?? 10,
  })
  const response = await request<AdminMealTemplatesListResponse>(`/admin/meal-templates/public/list${queryString}`)
  return response.data
}

export async function deleteAdminMealTemplate(id: number) {
  const response = await request<{ success: boolean; message: string }>(`/admin/meal-templates/${id}`, { method: 'DELETE' })
  return response.data
}
