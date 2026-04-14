import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type AdminArticleStatus = 'ban_nhap' | 'xuat_ban' | 'luu_tru'

export type AdminArticle = {
  id: number
  tac_gia_id: number
  tac_gia: { id: number; ho_ten: string; email: string } | null
  tieu_de: string
  slug: string
  danh_muc: string | null
  the_gan: string[] | null
  tom_tat: string | null
  noi_dung: string
  anh_dai_dien_url: string | null
  huong_dan_ai: Record<string, unknown> | null
  trang_thai: AdminArticleStatus
  xuat_ban_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type AdminArticlesQuery = {
  tieuDe?: string
  trangThai?: AdminArticleStatus
  danhMuc?: string
  tacGiaId?: string
  page?: number
  limit?: number
}

export type AdminArticlesListResponse = {
  items: AdminArticle[]
  pagination: { page: number; limit: number; total: number }
}

export type AdminArticleCategory = { danh_muc: string; so_luong: number }

export type AdminArticleAuthor = {
  id: number
  ho_ten: string
  email: string
  so_bai_viet: number
}

export type AdminArticleStats = { tong: number; ban_nhap: number; xuat_ban: number; luu_tru: number }

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

export async function getAdminArticles(query: AdminArticlesQuery) {
  const queryString = buildQueryString({
    tieuDe: query.tieuDe,
    trangThai: query.trangThai,
    danhMuc: query.danhMuc,
    tacGiaId: query.tacGiaId,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })
  const response = await request<AdminArticlesListResponse>(`/admin/articles${queryString}`)
  return response.data
}

export async function getAdminArticle(id: number) {
  const response = await request<AdminArticle>(`/admin/articles/${id}`)
  return response.data
}

export async function getAdminArticleStats() {
  const response = await request<AdminArticleStats>('/admin/articles/stats')
  return response.data
}

export async function getAdminArticleCategories() {
  const response = await request<AdminArticleCategory[]>('/admin/articles/categories')
  return response.data
}

export async function getAdminArticleAuthors() {
  const response = await request<AdminArticleAuthor[]>('/admin/articles/authors')
  return response.data
}

export async function getAdminPublishedArticles(query?: { danhMuc?: string; page?: number; limit?: number }) {
  const queryString = buildQueryString({
    danhMuc: query?.danhMuc,
    page: query?.page ?? 1,
    limit: query?.limit ?? 10,
  })
  const response = await request<AdminArticlesListResponse>(`/admin/articles/public/list${queryString}`)
  return response.data
}

export async function getAdminArticleBySlug(slug: string) {
  const response = await request<AdminArticle>(`/admin/articles/public/slug/${slug}`)
  return response.data
}

export async function deleteAdminArticle(id: number) {
  const response = await request<{ success: boolean; message: string }>(`/admin/articles/${id}`, { method: 'DELETE' })
  return response.data
}
