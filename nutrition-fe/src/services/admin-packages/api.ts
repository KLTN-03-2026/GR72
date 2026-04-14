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

export type PackageCycleType = 'thang' | 'quy' | 'nam' | 'tron_doi'
export type PackageStatus = 'ban_nhap' | 'dang_kinh_doanh' | 'ngung_kinh_doanh'

export type AdminPackage = {
  id: number
  ten_goi: string
  slug: string
  mo_ta: string | null
  gia_niem_yet: number
  gia_khuyen_mai: number | null
  thoi_han_ngay: number | null
  loai_chu_ky: PackageCycleType
  trang_thai: PackageStatus
  la_goi_mien_phi: boolean
  goi_noi_bat: boolean
  thu_tu_hien_thi: number
  tao_luc: string
  cap_nhat_luc: string
}

export type AdminPackagePayload = {
  tenGoi: string
  slug?: string
  moTa?: string
  giaNiemYet: number
  giaKhuyenMai?: number | null
  thoiHanNgay?: number | null
  loaiChuKy: PackageCycleType
  trangThai?: PackageStatus
  laGoiMienPhi?: boolean
  goiNoiBat?: boolean
  thuTuHienThi?: number
}

export type PackagesQuery = {
  keyword?: string
  trangThai?: PackageStatus
  page?: number
  limit?: number
}

export type PackagesListResponse = {
  items: AdminPackage[]
  pagination: { page: number; limit: number; total: number }
}

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

export async function getAdminPackages(query: PackagesQuery) {
  const queryString = buildQueryString({
    keyword: query.keyword,
    trangThai: query.trangThai,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  })
  const response = await request<PackagesListResponse>(`/admin/packages${queryString}`)
  return response.data
}

export async function getAdminPackageDetail(id: number) {
  const response = await request<AdminPackage>(`/admin/packages/${id}`)
  return response.data
}

export async function createAdminPackage(payload: AdminPackagePayload) {
  const response = await request<AdminPackage>('/admin/packages', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function updateAdminPackage(id: number, payload: Partial<AdminPackagePayload>) {
  const response = await request<AdminPackage>(`/admin/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function deleteAdminPackage(id: number) {
  const response = await request<{ id: number }>(`/admin/packages/${id}`, {
    method: 'DELETE',
  })
  return response.data
}
