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
