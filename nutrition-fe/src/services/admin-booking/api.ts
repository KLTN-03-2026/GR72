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
export type BookingReportData = {
  tong_booking: number
  tong_doanh_thu: number
  booking_theo_trang_thai: { trang_thai: string; so_luong: number }[]
  thong_ke_theo_ngay: { ngay: string; so_booking: number; so_hoan_thanh: number; doanh_thu: number }[]
}

export type NutritionistStat = {
  chuyen_gia_id: number
  ho_ten: string
  email: string
  anh_dai_dien_url: string | null
  so_booking: number
  so_hoan_thanh: number
  doanh_thu: number
  diem_trung_binh: number
}

export type BookingListItem = {
  id: number
  chuyen_gia_dinh_duong_id: number
  chuyen_gia: { id: number; ho_ten: string; email: string; anh_dai_dien_url: string | null } | null
  tai_khoan_id: number
  user: { id: number; ho_ten: string; email: string } | null
  goi_tu_van: { id: number; ten: string; gia: number; thoi_luong_phut: number } | null
  ma_lich_hen: string
  muc_dich: string | null
  ngay_hen: string
  gio_bat_dau: string
  gio_ket_thuc: string
  dia_diem: string | null
  trang_thai: string
  ly_do_huy: string | null
  ghi_chu_nutritionist: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type BookingDetail = BookingListItem & {
  thanh_toan: {
    id: number
    ma_giao_dich: string
    phuong_thuc: string
    so_tien: number
    trang_thai: string
    thanh_toan_luc: string | null
  }[]
}

// =============================================
// API
// =============================================
export async function getBookingReports(query: {
  start_date?: string
  end_date?: string
  nutritionist_id?: string
}) {
  const qs = buildQueryString({
    start_date: query.start_date,
    end_date: query.end_date,
    nutritionist_id: query.nutritionist_id,
  })
  const res = await request<BookingReportData>(`/admin/bookings/reports${qs}`)
  return res.data
}

export async function getBookingReportsByNutritionist(query: {
  start_date?: string
  end_date?: string
}) {
  const qs = buildQueryString({
    start_date: query.start_date,
    end_date: query.end_date,
  })
  const res = await request<NutritionistStat[]>(`/admin/bookings/reports/by-nutritionist${qs}`)
  return res.data
}

export async function getBookings(query: {
  trang_thai?: string
  nutritionist_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) {
  const qs = buildQueryString({
    trang_thai: query.trang_thai,
    nutritionist_id: query.nutritionist_id,
    start_date: query.start_date,
    end_date: query.end_date,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })
  const res = await request<{ items: BookingListItem[]; pagination: { page: number; limit: number; total: number } }>(`/admin/bookings${qs}`)
  return res.data
}

export async function getBookingDetail(id: number) {
  const res = await request<BookingDetail>(`/admin/bookings/${id}`)
  return res.data
}
