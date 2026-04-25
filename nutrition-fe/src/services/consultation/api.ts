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

export type PublicNutritionist = {
  id: number
  ho_ten: string
  anh_dai_dien_url: string | null
  chuyen_mon: string | null
  mo_ta: string | null
  diem_danh_gia_trung_binh: number
  so_luot_danh_gia: number
  gia_bat_dau: number | null
  so_goi_dang_ban: number
  co_the_dat_lich: boolean
}

export type NutritionistDetail = {
  id: number
  ho_ten: string
  anh_dai_dien_url: string | null
  chuyen_mon: string | null
  mo_ta: string | null
  hoc_vi: string | null
  chung_chi: string | null
  kinh_nghiem: string | null
  diem_danh_gia_trung_binh: number
  so_luot_danh_gia: number
  gio_lam_viec: string | null
  gio_lam_viec_parsed: Record<string, { start: string; end: string }[]> | null
  co_the_dat_lich: boolean
  goi_tu_van: {
    id: number
    ten: string
    mo_ta: string | null
    gia: number
    thoi_luong_phut: number
    so_lan_dung_mien_phi: number
    so_luot_su_dung: number
  }[]
  danh_gia: {
    id: number
    diem: number
    noi_dung: string | null
    tao_luc: string
    ho_ten_user: string
  }[]
}

export type UserBooking = {
  id: number
  ma_lich_hen: string
  ngay_hen: string
  gio_bat_dau: string
  gio_ket_thuc: string
  dia_diem: string | null
  muc_dich: string | null
  trang_thai: string
  ly_do_huy: string | null
  huy_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
  giu_cho_den_luc: string | null
  so_phut_con_lai: number
  co_the_tiep_tuc_thanh_toan: boolean
  nutritionist: {
    id: number
    ho_ten: string
    anh_dai_dien_url: string | null
    chuyen_mon: string | null
  } | null
  goi_tu_van: {
    id: number
    ten: string
    gia: number
    thoi_luong_phut: number
  } | null
  thanh_toan_moi_nhat: {
    id: number
    ma_giao_dich: string
    trang_thai: string
    so_tien: number
    thanh_toan_luc: string | null
    refund_status: string | null
    refund_message: string | null
  } | null
  lich_su_thanh_toan?: ConsultationPayment[]
}

export type ConsultationPayment = {
  id: number
  booking_id: number
  ma_giao_dich: string
  phuong_thuc: string
  so_tien: number
  trang_thai: string
  refund_status: string | null
  refund_message: string | null
  payment_url: string | null
  reused: boolean
  giu_cho_den_luc: string
  so_phut_con_lai: number
  nutritionist: { id: number; ho_ten: string } | null
  goi_tu_van: { id: number; ten: string; gia: number } | null
  tao_luc: string
  cap_nhat_luc: string
  thanh_toan_luc: string | null
}

export type UserReview = {
  id: number
  booking_id: number
  ma_lich_hen: string | null
  nutritionist: {
    id: number
    ho_ten: string | null
    chuyen_mon: string | null
  } | null
  goi_tu_van: {
    id: number
    ten: string
  } | null
  diem: number
  noi_dung: string | null
  tra_loi: string | null
  tao_luc: string
  cap_nhat_luc: string
  co_the_chinh_sua: boolean
  co_the_chinh_sua_den_luc: string
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePublicNutritionist(item: Record<string, unknown>): PublicNutritionist {
  return {
    id: toNumber(item.id),
    ho_ten: String(item.ho_ten ?? ''),
    anh_dai_dien_url: (item.anh_dai_dien_url as string | null | undefined) ?? null,
    chuyen_mon: (item.chuyen_mon as string | null | undefined) ?? null,
    mo_ta: (item.mo_ta as string | null | undefined) ?? null,
    diem_danh_gia_trung_binh: toNumber(item.diem_danh_gia_trung_binh),
    so_luot_danh_gia: toNumber(item.so_luot_danh_gia),
    gia_bat_dau: item.gia_bat_dau === null || item.gia_bat_dau === undefined ? null : toNumber(item.gia_bat_dau),
    so_goi_dang_ban: toNumber(item.so_goi_dang_ban),
    co_the_dat_lich: Boolean(item.co_the_dat_lich),
  }
}

function normalizeNutritionistDetail(item: Record<string, unknown>): NutritionistDetail {
  const packages = Array.isArray(item.goi_tu_van) ? item.goi_tu_van : []
  const reviews = Array.isArray(item.danh_gia) ? item.danh_gia : []

  return {
    id: toNumber(item.id),
    ho_ten: String(item.ho_ten ?? ''),
    anh_dai_dien_url: (item.anh_dai_dien_url as string | null | undefined) ?? null,
    chuyen_mon: (item.chuyen_mon as string | null | undefined) ?? null,
    mo_ta: (item.mo_ta as string | null | undefined) ?? null,
    hoc_vi: (item.hoc_vi as string | null | undefined) ?? null,
    chung_chi: (item.chung_chi as string | null | undefined) ?? null,
    kinh_nghiem: (item.kinh_nghiem as string | null | undefined) ?? null,
    diem_danh_gia_trung_binh: toNumber(item.diem_danh_gia_trung_binh),
    so_luot_danh_gia: toNumber(item.so_luot_danh_gia),
    gio_lam_viec: (item.gio_lam_viec as string | null | undefined) ?? null,
    gio_lam_viec_parsed: (item.gio_lam_viec_parsed as Record<string, { start: string; end: string }[]> | null | undefined) ?? null,
    co_the_dat_lich: Boolean(item.co_the_dat_lich),
    goi_tu_van: packages.map((pkg) => ({
      id: toNumber((pkg as Record<string, unknown>).id),
      ten: String((pkg as Record<string, unknown>).ten ?? ''),
      mo_ta: ((pkg as Record<string, unknown>).mo_ta as string | null | undefined) ?? null,
      gia: toNumber((pkg as Record<string, unknown>).gia),
      thoi_luong_phut: toNumber((pkg as Record<string, unknown>).thoi_luong_phut),
      so_lan_dung_mien_phi: toNumber((pkg as Record<string, unknown>).so_lan_dung_mien_phi),
      so_luot_su_dung: toNumber((pkg as Record<string, unknown>).so_luot_su_dung),
    })),
    danh_gia: reviews.map((review) => ({
      id: toNumber((review as Record<string, unknown>).id),
      diem: toNumber((review as Record<string, unknown>).diem),
      noi_dung: ((review as Record<string, unknown>).noi_dung as string | null | undefined) ?? null,
      tao_luc: String((review as Record<string, unknown>).tao_luc ?? ''),
      ho_ten_user: String((review as Record<string, unknown>).ho_ten_user ?? ''),
    })),
  }
}

export async function getPublicNutritionists(params?: {
  search?: string
  chuyenMon?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}) {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.chuyenMon) q.set('chuyenMon', params.chuyenMon)
  if (params?.minPrice !== undefined) q.set('minPrice', String(params.minPrice))
  if (params?.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice))
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  const response = await apiFetch<{ success: boolean; message: string; data: { items: Record<string, unknown>[]; pagination: { page: number; limit: number; total: number } } }>(`/nutritionists?${q.toString()}`)
  return {
    ...response,
    data: {
      ...response.data,
      items: response.data.items.map(normalizePublicNutritionist),
    },
  }
}

export async function getPublicNutritionist(id: number) {
  const response = await apiFetch<{ success: boolean; message: string; data: Record<string, unknown> }>(`/nutritionists/${id}`)
  return {
    ...response,
    data: normalizeNutritionistDetail(response.data),
  }
}

export async function createUserBooking(payload: {
  nutritionistId: number
  goiTuVanId: number
  ngayHen: string
  gioBatDau: string
  mucDich?: string
}) {
  return apiFetch<{ success: boolean; message: string; data: UserBooking }>('/me/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getUserBookings(params?: {
  trangThai?: string
  page?: number
  limit?: number
}) {
  const q = new URLSearchParams()
  if (params?.trangThai) q.set('trangThai', params.trangThai)
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  return apiFetch<{ success: boolean; message: string; data: { items: UserBooking[]; pagination: { page: number; limit: number; total: number } } }>(`/me/bookings?${q.toString()}`)
}

export async function getUserBooking(id: number) {
  return apiFetch<{ success: boolean; message: string; data: UserBooking }>(`/me/bookings/${id}`)
}

export async function cancelUserBooking(id: number, payload: { lyDoHuy: string }) {
  return apiFetch<{ success: boolean; message: string; data: { booking_id: number; trang_thai: string; refund_status: string; refund_message: string | null } }>(`/me/bookings/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function checkUserBookingRefundStatus(id: number) {
  return apiFetch<{ success: boolean; message: string; data: UserBooking }>(`/me/bookings/${id}/refund-check`, {
    method: 'PATCH',
  })
}

export async function createConsultationPayment(bookingId: number) {
  return apiFetch<{ success: boolean; message: string; data: ConsultationPayment }>('/me/consultation-payments', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  })
}

export async function getPendingConsultationPayment(bookingId: number) {
  return apiFetch<{ success: boolean; message: string; data: ConsultationPayment | null }>(`/me/consultation-payments/pending?booking_id=${bookingId}`)
}

export async function getConsultationPayments(params?: {
  bookingId?: number
  page?: number
  limit?: number
}) {
  const q = new URLSearchParams()
  if (params?.bookingId) q.set('bookingId', String(params.bookingId))
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  return apiFetch<{ success: boolean; message: string; data: { items: ConsultationPayment[]; pagination: { page: number; limit: number; total: number } } }>(`/me/consultation-payments?${q.toString()}`)
}

export async function createUserReview(payload: {
  bookingId: number
  diem: number
  noiDung?: string
}) {
  return apiFetch<{ success: boolean; message: string; data: UserReview }>('/me/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getUserReviews(params?: {
  bookingId?: number
  page?: number
  limit?: number
}) {
  const q = new URLSearchParams()
  if (params?.bookingId) q.set('bookingId', String(params.bookingId))
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  const query = q.toString()
  return apiFetch<{ success: boolean; message: string; data: { items: UserReview[]; pagination: { page: number; limit: number; total: number } } }>(
    `/me/reviews${query ? `?${query}` : ''}`,
  )
}

export async function updateUserReview(
  id: number,
  payload: { diem?: number; noiDung?: string },
) {
  return apiFetch<{ success: boolean; message: string; data: UserReview }>(`/me/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
