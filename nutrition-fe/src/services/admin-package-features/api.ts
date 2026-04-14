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

export type LimitType = 'ngay' | 'thang' | 'khong_gioi_han'

export type PackageFeature = {
  id: number
  goi_dich_vu_id: number
  ma_chuc_nang: string
  ten_chuc_nang: string
  mo_ta: string | null
  duoc_phep_su_dung: boolean
  gioi_han_so_lan: number | null
  gioi_han_theo: LimitType
  tao_luc: string
  cap_nhat_luc: string
}

export type PackageFeaturesResponse = {
  items: PackageFeature[]
  package_name: string
}

export type CreateFeaturePayload = {
  maChucNang: string
  tenChucNang: string
  moTa?: string
  duocPhepSuDung?: boolean
  gioiHanSoLan?: number | null
  gioiHanTheo?: LimitType
}

export type UpdateFeaturePayload = {
  tenChucNang?: string
  moTa?: string
  duocPhepSuDung?: boolean
  gioiHanSoLan?: number | null
  gioiHanTheo?: LimitType
}

export type StandardFeatureCode = {
  code: string
  name: string
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

export async function getPackageFeatures(packageId: number) {
  const response = await request<PackageFeaturesResponse>(
    `/admin/packages/${packageId}/features`
  )
  return response.data
}

export async function createPackageFeature(
  packageId: number,
  payload: CreateFeaturePayload
) {
  const response = await request<PackageFeature>(
    `/admin/packages/${packageId}/features`,
    { method: 'POST', body: JSON.stringify(payload) }
  )
  return response.data
}

export async function updatePackageFeature(
  featureId: number,
  payload: UpdateFeaturePayload
) {
  const response = await request<PackageFeature>(
    `/admin/package-features/${featureId}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  )
  return response.data
}

export async function deletePackageFeature(featureId: number) {
  const response = await request<{ id: number }>(
    `/admin/package-features/${featureId}`,
    { method: 'DELETE' }
  )
  return response.data
}

export async function getStandardFeatureCodes() {
  const response = await request<StandardFeatureCode[]>(
    '/admin/package-features/standard-codes'
  )
  return response.data
}
