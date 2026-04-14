import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

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
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null
  if (!response.ok) {
    const rawMessage = payload?.message
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || 'Yeu cau that bai'
    throw new ApiError(message, response.status)
  }
  return payload as ApiSuccessResponse<T>
}

// =============================================
// TYPES
// =============================================
export type ChuyenGiaTrangThai = 'cho_duyet' | 'tu_choi' | 'hoat_dong' | 'khong_hoat_dong' | 'bi_khoa'

export type NutritionistAccount = {
  id: number
  ho_ten: string
  email: string
  trang_thai: string
  vai_tro: string
}

export type NutritionistRegistration = {
  id: number
  tai_khoan_id: number
  tai_khoan: NutritionistAccount | null
  chuyen_mon: string | null
  mo_ta: string | null
  kinh_nghiem: string | null
  hoc_vi: string | null
  chung_chi: string | null
  gio_lam_viec: string | null
  anh_dai_dien_url: string | null
  trang_thai: ChuyenGiaTrangThai
  trang_thai_thanh_toan?: string | null
  ly_do_tu_choi: string | null
  ly_do_bi_khoa: string | null
  ngay_duyet: string | null
  ngay_thanh_toan: string | null
  vnp_txn_ref: string | null
  ngay_bi_khoa: string | null
  ngay_kich_hoat_lai: string | null
  diem_danh_gia_trung_binh: number
  so_luot_danh_gia: number
  tao_luc: string
  cap_nhat_luc: string
}

export type NutritionistRegistrationDetail = NutritionistRegistration & {
  so_booking?: number
  so_booking_hoan_thanh?: number
  diem_trung_binh?: number
}

export type Nutritionist = NutritionistRegistration
export type NutritionistDetail = NutritionistRegistration & {
  so_booking: number
  so_booking_hoan_thanh: number
  diem_trung_binh: number
}

// =============================================
// API: Nutritionist Registrations
// =============================================
export async function getRegistrations(query: {
  trang_thai?: string
  trang_thai_thanh_toan?: string
  search?: string
  page?: number
  limit?: number
}) {
  const qs = buildQueryString({
    trang_thai: query.trang_thai,
    trang_thai_thanh_toan: query.trang_thai_thanh_toan,
    search: query.search,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })
  const res = await request<{ items: NutritionistRegistration[]; pagination: { page: number; limit: number; total: number } }>(`/admin/nutritionist-registrations${qs}`)
  return res.data
}

export async function getRegistrationDetail(id: number) {
  const res = await request<NutritionistRegistrationDetail>(`/admin/nutritionist-registrations/${id}`)
  return res.data
}

export async function approveRegistration(id: number) {
  const res = await request<NutritionistRegistration>(`/admin/nutritionist-registrations/${id}/approve`, { method: 'PATCH' })
  return res.data
}

export async function rejectRegistration(id: number, lyDoTuChoi: string) {
  const res = await request<NutritionistRegistration>(`/admin/nutritionist-registrations/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ ly_do_tu_choi: lyDoTuChoi }),
  })
  return res.data
}

// =============================================
// API: Nutritionist Management
// =============================================
export async function getNutritionists(query: {
  trang_thai?: string
  search?: string
  page?: number
  limit?: number
}) {
  const qs = buildQueryString({
    trang_thai: query.trang_thai,
    search: query.search,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })
  const res = await request<{ items: Nutritionist[]; pagination: { page: number; limit: number; total: number } }>(`/admin/nutritionists${qs}`)
  return res.data
}

export async function getNutritionistDetail(id: number) {
  const res = await request<NutritionistDetail>(`/admin/nutritionists/${id}`)
  return res.data
}

export async function banNutritionist(id: number, lyDoBiKhoa: string) {
  const res = await request<Nutritionist>(`/admin/nutritionists/${id}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ ly_do_bi_khoa: lyDoBiKhoa }),
  })
  return res.data
}

export async function activateNutritionist(id: number) {
  const res = await request<Nutritionist>(`/admin/nutritionists/${id}/activate`, { method: 'PATCH' })
  return res.data
}
