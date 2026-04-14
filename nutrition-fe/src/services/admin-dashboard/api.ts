import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = { success: true; message: string; data: T }
type ApiErrorResponse = { success: false; message?: string | string[] }

export type DashboardData = {
  tong_tai_khoan: number
  tai_khoan_moi_7_ngay: number
  tai_khoan_moi_30_ngay: number
  phan_bo_vai_tro: { vai_tro: string; so_luong: number }[]
  xu_huong_dang_ky: { ngay: string; so_luong: number }[]
  tong_thuc_pham: number
  yeu_cau_duyet: { cho_duyet: number; da_duyet: number; tu_choi: number; tong: number }
  thong_bao: { chua_doc: number; tong: number }
  goi_dich_vu: {
    tong_goi: number
    dang_hoat_dong: number
    phan_bo: { ten_goi: string; so_luong: number }[]
  }
  doanh_thu: {
    tong: number
    thang_nay: number
    xu_huong: { ngay: string; doanh_thu: number; so_giao_dich: number }[]
  }
  thanh_toan_theo_trang_thai: { trang_thai: string; so_luong: number }[]
}

export async function getDashboard() {
  const response = await fetch('/api/admin/dashboard', {
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<DashboardData>
    | ApiErrorResponse
    | null
  if (!response.ok) {
    const rawMessage = payload?.message
    throw new ApiError(
      Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || 'Yeu cau that bai',
      response.status
    )
  }
  return (payload as ApiSuccessResponse<DashboardData>).data
}
