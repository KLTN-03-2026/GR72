import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type RevenueData = {
  tong_doanh_thu: number
  tong_giao_dich: number
  doanh_thu_theo_thang: { thang: string; doanh_thu: number; so_giao_dich: number }[]
}

export type PackageStatsData = {
  phan_bo_nguoi_dung: { goi_id: number; ten_goi: string; so_nguoi_dung: number }[]
  goi_ban_chay: { goi_id: number; ten_goi: string; so_giao_dich: number; tong_tien: number }[]
  ty_le_chuyen_doi: { tong_dang_ky_hoat_dong: number; tra_phi: number; ty_le: number }
}

export type SystemRevenueData = {
  pham_vi: { start_date: string; end_date: string }
  tong_quan: {
    tong_doanh_thu_he_thong: number
    tong_phi_dang_ky_chuyen_gia: number
    tong_hoa_hong_booking: number
    so_luot_dang_ky_chuyen_gia_thanh_cong: number
    so_booking_tinh_hoa_hong: number
    muc_phi_dang_ky_hien_tai: number
  }
  theo_thang: Array<{
    thang: string
    doanh_thu_phi_dang_ky: number
    doanh_thu_hoa_hong: number
    tong_doanh_thu_he_thong: number
    so_dang_ky_thanh_cong: number
    so_booking_tinh_hoa_hong: number
  }>
}

async function request<T>(path: string) {
  const response = await fetch(`/api${path}`, { credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' } })
  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null
  if (!response.ok) {
    const rawMessage = payload?.message
    throw new ApiError(Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || 'Yeu cau that bai', response.status)
  }
  return (payload as ApiSuccessResponse<T>).data
}

export async function getRevenue() { return request<RevenueData>('/admin/reports/revenue') }
export async function getPackageStats() { return request<PackageStatsData>('/admin/reports/packages') }
export async function getSystemRevenue(params?: { start_date?: string; end_date?: string }) {
  const search = new URLSearchParams()
  if (params?.start_date) search.set('start_date', params.start_date)
  if (params?.end_date) search.set('end_date', params.end_date)
  const query = search.toString()
  return request<SystemRevenueData>(`/admin/reports/system-revenue${query ? `?${query}` : ''}`)
}
