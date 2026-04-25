import { ApiError } from '@/services/auth/api'

type ApiSuccessResponse<T> = {
  success: true
  message: string
  data: T
}

type ApiRes<T> = ApiSuccessResponse<T> | { success: false; message?: string | string[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as ApiRes<T> | null

  if (!response.ok) {
    const rawMessage = payload && 'message' in payload ? (payload as { message?: string | string[] }).message : undefined
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || 'Yêu cầu thất bại'
    throw new ApiError(message, response.status)
  }

  return (payload as ApiSuccessResponse<T>).data as T
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as ApiRes<T> | null

  if (!response.ok) {
    const rawMessage = payload && 'message' in payload ? (payload as { message?: string | string[] }).message : undefined
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || 'Yêu cầu thất bại'
    throw new ApiError(message, response.status)
  }

  return (payload as ApiSuccessResponse<T>).data as T
}

// ============================================
// Types trả về từ API
// ============================================
export type ProfileApiResponse = {
  tai_khoan_id: number
  ho_ten: string
  email: string
  gioi_tinh: 'nam' | 'nu' | 'khac' | null
  ngay_sinh: string | null
  chieu_cao_cm: number | null
  can_nang_hien_tai_kg: number | null
  muc_do_van_dong: 'it_van_dong' | 'van_dong_nhe' | 'van_dong_vua' | 'nang_dong' | 'rat_nang_dong' | null
  che_do_an_uu_tien: string[]
  di_ung: string[]
  thuc_pham_khong_thich: string[]
  anh_dai_dien_url: string | null
  cap_nhat_luc: string
}

// ============================================
// Types gửi lên API (PATCH)
// ============================================
export type UpdateProfilePayload = {
  hoTen?: string
  gioiTinh?: 'nam' | 'nu' | 'khac'
  ngaySinh?: string
  chieuCaoCm?: number
  canNangHienTaiKg?: number
  mucDoVanDong?: 'it_van_dong' | 'van_dong_nhe' | 'van_dong_vua' | 'nang_dong' | 'rat_nang_dong'
  cheDoAnUuTien?: string[]
  diUng?: string[]
  thucPhamKhongThich?: string[]
  anhDaiDienUrl?: string
}

// ============================================
// API calls
// ============================================
export async function getUserProfile(): Promise<ProfileApiResponse> {
  return request<ProfileApiResponse>('/me/profile')
}

export async function updateUserProfile(
  payload: UpdateProfilePayload
): Promise<ProfileApiResponse> {
  return request<ProfileApiResponse>('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function uploadUserAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return requestFormData<{ url: string }>('/me/profile/upload-avatar', formData)
}
