const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '')

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`)
  return json as T
}

// ============================================================
// Dashboard
// ============================================================
export type DashboardResponse = {
  success: boolean
  message: string
  data: {
    onboarding_completed: boolean
    onboarding_step: 'ho_so' | 'muc_tieu' | null
    redirect_to: string
    thieu_du_lieu: string[]
    ho_so_tom_tat: {
      gioi_tinh: string | null
      ngay_sinh: string | null
      chieu_cao_cm: number | null
      can_nang_hien_tai_kg: number | null
      muc_do_van_dong: string | null
    } | null
    muc_tieu_hien_tai: {
      id: number
      loai_muc_tieu: string
      trang_thai: string
      can_nang_bat_dau_kg: number | null
      can_nang_muc_tieu_kg: number | null
      muc_tieu_calories_ngay: number | null
      muc_tieu_protein_g: number | null
      muc_tieu_carb_g: number | null
      muc_tieu_fat_g: number | null
      ngay_bat_dau: string | null
      ngay_muc_tieu: string | null
    } | null
    chi_so_gan_nhat: {
      id: number
      do_luc: string
      can_nang_kg: number | null
      chieu_cao_cm: number | null
      vong_eo_cm: number | null
      vong_mong_cm: number | null
      huyet_ap_tam_thu: number | null
      huyet_ap_tam_truong: number | null
      duong_huyet: number | null
      ghi_chu: string | null
    } | null
    bieu_do_can_nang: { do_luc: string; can_nang_kg: number }[]
    danh_gia_suc_khoe_moi_nhat: {
      id: number
      bmi: number | null
      phan_loai_bmi: string | null
      bmr: number | null
      tdee: number | null
      calories_khuyen_nghi: number | null
      protein_khuyen_nghi_g: number | null
      carb_khuyen_nghi_g: number | null
      fat_khuyen_nghi_g: number | null
      tom_tat: string | null
      tao_luc: string
      cap_nhat_luc: string
    } | null
    dinh_duong_hom_nay: {
      ngay: string
      tong_calories: number | null
      tong_protein_g: number | null
      tong_carb_g: number | null
      tong_fat_g: number | null
      so_bua_da_ghi: number
      cap_nhat_luc: string
    } | null
    khuyen_nghi_ai_moi_nhat: {
      id: number
      trang_thai: string
      loai_khuyen_nghi: string
      ngay_muc_tieu: string | null
      muc_tieu_calories: number | null
      muc_tieu_protein_g: number | null
      muc_tieu_carb_g: number | null
      muc_tieu_fat_g: number | null
      canh_bao: unknown
      ly_giai: string | null
      du_lieu_khuyen_nghi: unknown
      tao_luc: string
      cap_nhat_luc: string
    } | null
    thong_bao_chua_doc: number
  }
}

export async function getDashboard() {
  return apiFetch<DashboardResponse>('/me/dashboard')
}

// ============================================================
// Health Metrics
// ============================================================
export type HealthMetricItem = {
  id: number
  tai_khoan_id: number
  do_luc: string
  can_nang_kg: number | null
  chieu_cao_cm: number | null
  vong_eo_cm: number | null
  vong_mong_cm: number | null
  huyet_ap_tam_thu: number | null
  huyet_ap_tam_truong: number | null
  duong_huyet: number | null
  ghi_chu: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export type HealthMetricsResponse = {
  success: boolean
  message: string
  data: {
    items: HealthMetricItem[]
    pagination: { page: number; limit: number; total: number }
  }
}

export async function getHealthMetrics(params?: {
  page?: number
  limit?: number
  from?: string
  to?: string
}) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.from) q.set('from', params.from)
  if (params?.to) q.set('to', params.to)
  return apiFetch<HealthMetricsResponse>(`/me/health-metrics?${q.toString()}`)
}

export type CreateHealthMetricDto = {
  doLuc?: string
  canNangKg?: number
  chieuCaoCm?: number
  vongEoCm?: number
  vongMongCm?: number
  huyetApTamThu?: number
  huyetApTamTruong?: number
  duongHuyet?: number
  ghiChu?: string
}

export type HealthMetricResponse = {
  success: boolean
  message: string
  data: HealthMetricItem
}

export async function createHealthMetric(dto: CreateHealthMetricDto) {
  return apiFetch<HealthMetricResponse>('/me/health-metrics', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export async function updateHealthMetric(
  id: number,
  dto: Partial<CreateHealthMetricDto>
) {
  return apiFetch<HealthMetricResponse>(`/me/health-metrics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })
}

// ============================================================
// Health Assessment (latest)
// ============================================================
export type HealthAssessmentResponse = {
  success: boolean
  message: string
  data: DashboardResponse['data']['danh_gia_suc_khoe_moi_nhat']
}

export async function getLatestHealthAssessment() {
  return apiFetch<HealthAssessmentResponse>('/me/health-assessments/latest')
}
