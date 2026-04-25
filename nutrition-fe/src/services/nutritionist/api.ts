import { ApiError } from '@/services/auth/api'

type ApiRes<T> = { success: true; data: T }
type ApiErr = { success: false; message?: string | string[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init, credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch (err) {
    console.error('[Nutritionist API] Network error:', path, err)
    throw new ApiError('Lỗi kết nối server', 0)
  }

  const text = await res.text()
  let payload: { success?: boolean; data?: T; message?: string | string[] } | null = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    console.error('[Nutritionist API] Non-JSON response:', path, res.status, text.slice(0, 200))
    throw new ApiError('Server trả về dữ liệu không hợp lệ', res.status)
  }

  if (!res.ok) {
    const m = payload?.message
    const msg = Array.isArray(m) ? m.join(', ') : (m || `Lỗi ${res.status}`)
    throw new ApiError(String(msg), res.status)
  }

  if (!payload || payload.data === undefined) {
    // Some endpoints return {success: true, message: "..."} without data
    return (payload as unknown) as T
  }

  return payload.data as T
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      body: formData,
    })
  } catch (err) {
    console.error('[Nutritionist API] Network error:', path, err)
    throw new ApiError('Lỗi kết nối server', 0)
  }

  const text = await res.text()
  let payload: { success?: boolean; data?: T; message?: string | string[] } | null = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    console.error('[Nutritionist API] Non-JSON response:', path, res.status, text.slice(0, 200))
    throw new ApiError('Server trả về dữ liệu không hợp lệ', res.status)
  }

  if (!res.ok) {
    const m = payload?.message
    const msg = Array.isArray(m) ? m.join(', ') : (m || `Lỗi ${res.status}`)
    throw new ApiError(String(msg), res.status)
  }

  if (!payload || payload.data === undefined) {
    return (payload as unknown) as T
  }

  return payload.data as T
}

// ====== FOODS ======
export type NFood = {
  id: number; ten: string; nhom_thuc_pham_id: number
  nhom_thuc_pham: { id: number; ten: string } | null
  calories_100g: number | null; protein_100g: number | null
  carb_100g: number | null; fat_100g: number | null
  khau_phan_tham_chieu: string; don_vi_khau_phan: string; da_xac_minh: boolean
}
type Paginated<T> = { items: T[]; pagination: { page: number; limit: number; total: number } }

export async function getNutriFoods(q?: { keyword?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.keyword) p.set('keyword', q.keyword)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<NFood>>(`/nutritionist/foods${qs ? `?${qs}` : ''}`)
}

export async function getNutriFood(id: number) {
  return request<NFood>(`/nutritionist/foods/${id}`)
}

// ====== FOOD REVIEW REQUESTS ======
export type NFoodReview = {
  id: number; thuc_pham_id: number | null; loai_yeu_cau: string
  de_xuat_boi: number; trang_thai: 'cho_duyet' | 'da_duyet' | 'tu_choi'
  du_lieu_hien_tai: Record<string, unknown> | null
  du_lieu_de_xuat: Record<string, unknown>
  ly_do: string | null; duyet_boi: number | null
  duyet_luc: string | null; ghi_chu_duyet: string | null
  tao_luc: string; cap_nhat_luc: string
}

export type NFoodReviewDetail = NFoodReview & {
  ten_nguon: string | null
  ma_nguon: string | null
  nguoi_de_xuat: {
    id: number
    ho_ten: string | null
  } | null
  thuc_pham: {
    id: number
    ten: string
    nhom_thuc_pham_id: number
    calories_100g: number | null
    protein_100g: number | null
    carb_100g: number | null
    fat_100g: number | null
    da_xac_minh: boolean
  } | null
}

export async function getNutriFoodReviews(q?: { trangThai?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<NFoodReview>>(`/nutritionist/food-review-requests${qs ? `?${qs}` : ''}`)
}

export async function getNutriFoodReview(id: number) {
  return request<NFoodReviewDetail>(`/nutritionist/food-review-requests/${id}`)
}

export async function createNutriFoodReview(payload: {
  thucPhamId?: number; loaiYeuCau: string
  duLieuDeXuat: Record<string, unknown>
  duLieuHienTai?: Record<string, unknown>; lyDo?: string
}) {
  return request<NFoodReview>('/nutritionist/food-review-requests', { method: 'POST', body: JSON.stringify(payload) })
}

// ====== ARTICLES ======
export type NArticle = {
  id: number; tac_gia_id: number; tieu_de: string; slug: string
  danh_muc: string | null; the_gan: string[] | null
  tom_tat: string | null; noi_dung: string
  anh_dai_dien_url: string | null; huong_dan_ai: Record<string, unknown> | null
  trang_thai: 'ban_nhap' | 'xuat_ban' | 'luu_tru'
  xuat_ban_luc: string | null; tao_luc: string; cap_nhat_luc: string
}

export type NArticleUploadResponse = {
  items: Array<{
    file_name: string
    original_name: string
    size: number
    mime_type: string
    url: string
  }>
  urls: string[]
}

export async function getNutriArticles(q?: { trangThai?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  return request<Paginated<NArticle>>(`/nutritionist/articles?${p.toString()}`)
}

export async function createNutriArticle(payload: {
  tieuDe: string; noiDung: string; danhMuc?: string
  theGan?: string[]; tomTat?: string; anhDaiDienUrl?: string
  huongDanAi?: Record<string, unknown>
}) {
  return request<NArticle>('/nutritionist/articles', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateNutriArticle(id: number, payload: {
  tieuDe?: string; noiDung?: string; danhMuc?: string
  theGan?: string[]; tomTat?: string; anhDaiDienUrl?: string
  huongDanAi?: Record<string, unknown>
}) {
  return request<NArticle>(`/nutritionist/articles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function publishNutriArticle(id: number) {
  return request<NArticle>(`/nutritionist/articles/${id}/publish`, { method: 'PATCH' })
}

export async function archiveNutriArticle(id: number) {
  return request<NArticle>(`/nutritionist/articles/${id}/archive`, { method: 'PATCH' })
}

export async function deleteNutriArticle(id: number) {
  return request<null>(`/nutritionist/articles/${id}`, { method: 'DELETE' })
}

export async function uploadNutriArticleImages(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return requestFormData<NArticleUploadResponse>('/nutritionist/articles/upload-images', formData)
}

// ====== RECIPES ======
export type NRecipe = {
  id: number; tao_boi: number; ten: string; slug: string
  mo_ta: string | null; huong_dan: string | null
  so_khau_phan: number | null
  tong_calories: number | null; tong_protein_g: number | null
  tong_carb_g: number | null; tong_fat_g: number | null
  trang_thai: 'ban_nhap' | 'xuat_ban' | 'luu_tru'
  thanh_phan: { id: number; thuc_pham_id: number; so_luong: number; don_vi: string }[]
  tao_luc: string; cap_nhat_luc: string
}

export async function getNutriRecipes(q?: { trangThai?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  return request<Paginated<NRecipe>>(`/nutritionist/recipes?${p.toString()}`)
}

export async function createNutriRecipe(payload: {
  ten: string; moTa?: string; huongDan?: string; soKhauPhan?: number
  thanhPhan?: { thucPhamId: number; soLuong: number; donVi: string }[]
}) {
  return request<NRecipe>('/nutritionist/recipes', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateNutriRecipe(id: number, payload: {
  ten?: string; moTa?: string; huongDan?: string; soKhauPhan?: number; trangThai?: string
  thanhPhan?: { thucPhamId: number; soLuong: number; donVi: string }[]
}) {
  return request<NRecipe>(`/nutritionist/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteNutriRecipe(id: number) {
  return request<null>(`/nutritionist/recipes/${id}`, { method: 'DELETE' })
}

// ====== MEAL TEMPLATES ======
export type NMealTemplate = {
  id: number; tao_boi: number; tieu_de: string; mo_ta: string | null
  loai_muc_tieu_phu_hop: string | null; calories_muc_tieu: number | null
  trang_thai: 'ban_nhap' | 'xuat_ban' | 'luu_tru'
  chi_tiet: {
    id: number; ngay_so: number; loai_bua_an: string
    cong_thuc_id: number | null; thuc_pham_id: number | null
    so_luong: number | null; don_vi: string | null
    ghi_chu: string | null; thu_tu: number
  }[]
  tao_luc: string; cap_nhat_luc: string
}

export async function getNutriMealTemplates(q?: { trangThai?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  return request<Paginated<NMealTemplate>>(`/nutritionist/meal-templates?${p.toString()}`)
}

export async function createNutriMealTemplate(payload: {
  tieuDe: string; moTa?: string; loaiMucTieuPhuHop?: string; caloriesMucTieu?: number
  chiTiet?: { ngaySo: number; loaiBuaAn: string; congThucId?: number; thucPhamId?: number; soLuong?: number; donVi?: string; ghiChu?: string; thuTu?: number }[]
}) {
  return request<NMealTemplate>('/nutritionist/meal-templates', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateNutriMealTemplate(id: number, payload: {
  tieuDe?: string; moTa?: string; trangThai?: string; loaiMucTieuPhuHop?: string; caloriesMucTieu?: number
  chiTiet?: { ngaySo: number; loaiBuaAn: string; congThucId?: number; thucPhamId?: number; soLuong?: number; donVi?: string; ghiChu?: string; thuTu?: number }[]
}) {
  return request<NMealTemplate>(`/nutritionist/meal-templates/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteNutriMealTemplate(id: number) {
  return request<null>(`/nutritionist/meal-templates/${id}`, { method: 'DELETE' })
}

// ====== DASHBOARD ======
export type NutriDashboardSummary = {
  articles: number
  recipes: number
  mealTemplates: number
  pendingReviews: number
  approvedReviews: number
  rejectedReviews: number
  unreadNotifications: number
}

export async function getNutriDashboard() {
  return request<NutriDashboardSummary>('/nutritionist/dashboard')
}

// ====== NUTRITIONIST PROFILE ======
export type NProfile = {
  id: number
  hoTen: string
  vaiTro: string
  trangThai: string
  anhDaiDienUrl: string | null
  moTa: string | null
  chuyenMon: string | null
  gioLamViec: string | null
  diemDanhGiaTrungBinh: number
  soLuotDanhGia: number
  tongBooking: number
  taoLuc: string
  capNhatLuc: string
}

export async function getNutriProfile() {
  return request<NProfile>('/nutritionist/profile')
}

export async function updateNutriProfile(payload: {
  anhDaiDienUrl?: string
  moTa?: string
  chuyenMon?: string
  gioLamViec?: string
}) {
  return request<NProfile>('/nutritionist/profile', { method: 'PATCH', body: JSON.stringify(payload) })
}

export type NNutriReview = {
  id: number
  booking_id: number
  booking_ma: string | null
  booking_ngay_hen: string | null
  goi_tu_van_ten: string | null
  user_id: number
  user_ho_ten: string | null
  diem: number
  noi_dung: string | null
  tra_loi: string | null
  tra_loi_luc: string | null
  tao_luc: string
  cap_nhat_luc: string
}

export async function getNutriReviews(q?: { page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<NNutriReview>>(`/nutritionist/profile/reviews${qs ? `?${qs}` : ''}`)
}

// ====== CONSULTATION PACKAGES ======
export type NPackage = {
  id: number
  chuyenGiaDinhDuongId: number
  ten: string
  moTa: string | null
  gia: number
  thoiLuongPhut: number
  soLanDungMienPhi: number
  soLuotSuDung: number
  trangThai: string
  taLuc: string
  capNhatLuc: string
}

export async function getNutriPackages(q?: { page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<NPackage>>(`/nutritionist/consultation-packages${qs ? `?${qs}` : ''}`)
}

export async function getNutriPackage(id: number) {
  return request<NPackage>(`/nutritionist/consultation-packages/${id}`)
}

export async function createNutriPackage(payload: {
  ten: string
  moTa?: string
  gia: number
  thoiLuongPhut?: number
  soLanDungMienPhi?: number
}) {
  return request<NPackage>('/nutritionist/consultation-packages', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateNutriPackage(id: number, payload: {
  ten?: string
  moTa?: string
  gia?: number
  thoiLuongPhut?: number
  soLanDungMienPhi?: number
  trangThai?: string
}) {
  return request<NPackage>(`/nutritionist/consultation-packages/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteNutriPackage(id: number) {
  return request<{ success: boolean; message: string }>(`/nutritionist/consultation-packages/${id}`, { method: 'DELETE' })
}

// ====== NUTRITIONIST BOOKINGS ======
export type NBooking = {
  id: number
  maLichHen: string
  taiKhoanId: number
  tenUser: string
  chuyenGiaDinhDuongId: number
  goiTuVanId: number
  tenGoiTuVan: string
  thoiLuongPhut: number
  ngayHen: string
  gioBatDau: string
  gioKetThuc: string
  diaDiem: string | null
  trangThai: string
  trangThaiThanhToan: string | null
  trangThaiPhanBoDoanhThu: string | null
  mucDich: string | null
  ghiChuNutritionist: string | null
  giaGoi: number
  hoaHongHeThong: number
  thuNhapDuKien: number
  thuNhapThucNhan: number
  refundStatus: 'not_required' | 'processing' | 'bank_sent' | 'success' | 'failed'
  refundMessage: string | null
  taLuc: string
  capNhatLuc: string
}

export async function getNutriBookings(q?: {
  trangThai?: string
  ngayHen?: string
  tenUser?: string
  page?: number
  limit?: number
}) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.ngayHen) p.set('ngayHen', q.ngayHen)
  if (q?.tenUser) p.set('tenUser', q.tenUser)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<NBooking>>(`/nutritionist/bookings${qs ? `?${qs}` : ''}`)
}

export async function getNutriBooking(id: number) {
  return request<NBooking>(`/nutritionist/bookings/${id}`)
}

export async function confirmNutriBooking(id: number) {
  return request<NBooking>(`/nutritionist/bookings/${id}/confirm`, { method: 'PATCH' })
}

export async function completeNutriBooking(id: number, payload?: { ghiChu?: string }) {
  return request<NBooking>(`/nutritionist/bookings/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(payload ?? {}),
  })
}

export async function cancelNutriBooking(id: number, payload: { lyDoHuy: string }) {
  return request<NBooking>(`/nutritionist/bookings/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function checkNutriBookingRefundStatus(id: number) {
  return request<NBooking>(`/nutritionist/bookings/${id}/refund-check`, {
    method: 'PATCH',
  })
}

// ====== NOTIFICATIONS (của chuyên gia) ======
export type NNutriNotification = {
  id: number
  tai_khoan_id: number
  loai: string
  tieu_de: string
  noi_dung: string
  trang_thai: 'chua_doc' | 'da_doc'
  duong_dan_hanh_dong: string | null
  tao_luc: string
  doc_luc: string | null
  cap_nhat_luc: string
}

export async function getNutriNotifications(q?: { trangThai?: string; page?: number; limit?: number }) {
  const p = new URLSearchParams()
  if (q?.trangThai) p.set('trangThai', q.trangThai)
  if (q?.page) p.set('page', String(q.page))
  if (q?.limit) p.set('limit', String(q.limit))
  const qs = p.toString()
  return request<Paginated<NNutriNotification>>(`/nutritionist/notifications${qs ? `?${qs}` : ''}`)
}

export async function markNutriNotificationRead(id: number) {
  return request<NNutriNotification>(`/nutritionist/notifications/${id}/read`, { method: 'PATCH' })
}

export async function getNutriUnreadCount() {
  return request<{ count: number }>('/nutritionist/notifications/unread-count')
}

// ====== NUTRITIONIST EARNINGS ======
export type NEarningsData = {
  tong_thu_nhap_gop: number
  tong_phi_hoa_hong: number
  tong_thu_nhap_rong: number
  so_booking: number
  khoang_ngay: { start_date: string; end_date: string }
  thu_nhap_theo_thang: {
    thang: string
    so_booking: number
    tong_thu_nhap_gop: number
    tong_phi_hoa_hong: number
    tong_thu_nhap_rong: number
  }[]
  chi_tiet: {
    booking_id: number
    ma_lich_hen: string
    ngay: string
    ten_user: string
    ten_goi: string
    gia_goi: number
    phi_hoa_hong: number
    thu_nhap_rong: number
    trang_thai_phan_bo: string
    trang_thai_thanh_toan: string
    ngay_thanh_toan: string | null
  }[]
}

export async function getNutriEarnings(q?: { start_date?: string; end_date?: string }) {
  const p = new URLSearchParams()
  if (q?.start_date) p.set('start_date', q.start_date)
  if (q?.end_date) p.set('end_date', q.end_date)
  const qs = p.toString()
  return request<NEarningsData>(`/nutritionist/earnings${qs ? `?${qs}` : ''}`)
}
