/**
 * Bộ chuyển đổi enum/status từ DB (snake_case tiếng Việt) sang nhãn hiển thị tiếng Việt có dấu.
 * Dùng chung cho admin/user/expert thay vì duplicate mapping ở mỗi component.
 */

/* ─── Trạng thái chung ─── */
export const STATUS_LABELS: Record<string, string> = {
  // Tài khoản / vai trò
  hoat_dong: 'Hoạt động',
  khong_hoat_dong: 'Không hoạt động',
  bi_khoa: 'Bị khóa',
  customer: 'Khách hàng',
  expert: 'Chuyên gia',
  admin: 'Quản trị viên',

  // Chuyên gia
  cho_duyet: 'Chờ duyệt',
  tu_choi: 'Từ chối',
  tam_dung: 'Tạm dừng',

  // Gói dịch vụ
  dang_ban: 'Đang bán',
  ban_nhap: 'Bản nháp',
  ngung_ban: 'Ngừng bán',
  nhap: 'Đang nháp',

  // Gói đã mua / Booking - thanh toán
  dang_hieu_luc: 'Đang hiệu lực',
  cho_thanh_toan: 'Chờ thanh toán',
  het_luot: 'Hết lượt',
  het_han: 'Hết hạn',
  tam_khoa: 'Tạm khóa',
  da_hoan_tien: 'Đã hoàn tiền',
  khoi_tao: 'Khởi tạo',
  thanh_cong: 'Thành công',
  that_bai: 'Thất bại',
  hoan_tien: 'Hoàn tiền',

  // Booking
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_checkin: 'Đã check-in',
  dang_tu_van: 'Đang tư vấn',
  hoan_thanh: 'Hoàn thành',
  da_huy: 'Đã hủy',
  vo_hieu_hoa: 'Vô hiệu hóa',

  // Đánh giá
  hien_thi: 'Hiển thị',
  bi_an: 'Đã ẩn',
  an: 'Đã ẩn',
  bi_bao_cao: 'Bị báo cáo',
  da_xoa: 'Đã xóa',

  // Khiếu nại
  moi: 'Mới',
  dang_xu_ly: 'Đang xử lý',
  cho_phan_hoi: 'Chờ phản hồi',
  da_giai_quyet: 'Đã giải quyết',
  da_xu_ly: 'Đã xử lý',
  da_dong: 'Đã đóng',

  // Hoa hồng
  da_chot: 'Đã chốt',
  da_chi_tra: 'Đã chi trả',
  cho_chi_tra: 'Chờ chi trả',

  // Thông báo
  chua_doc: 'Chưa đọc',
  da_doc: 'Đã đọc',

  // Phiên chat AI / gợi ý
  dang_mo: 'Đang mở',
  da_luu_tru: 'Đã lưu trữ',
  moi_tao: 'Mới tạo',
  da_ap_dung: 'Đã áp dụng',
  luu_tru: 'Lưu trữ',
  da_huy_bo: 'Đã hủy bỏ',
}

/* ─── Mức độ ưu tiên (khiếu nại / gợi ý) ─── */
export const PRIORITY_LABELS: Record<string, string> = {
  thap: 'Thấp',
  trung_binh: 'Trung bình',
  cao: 'Cao',
}

/* ─── Loại thông báo ─── */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  he_thong: 'Hệ thống',
  system: 'Hệ thống',
  booking: 'Lịch hẹn',
  payment: 'Thanh toán',
  review: 'Đánh giá',
  commission: 'Hoa hồng',
  complaint: 'Khiếu nại',
  message: 'Tin nhắn',
  profile: 'Hồ sơ',
}

/* ─── Loại khiếu nại ─── */
export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  thanh_toan: 'Thanh toán',
  lich_hen: 'Lịch hẹn',
  chuyen_gia: 'Chuyên gia',
  he_thong: 'Hệ thống',
  khac: 'Khác',
}

/* ─── Loại gói dịch vụ ─── */
export const PACKAGE_TYPE_LABELS: Record<string, string> = {
  suc_khoe: 'Sức khỏe',
  dinh_duong: 'Dinh dưỡng',
  tap_luyen: 'Tập luyện',
  tu_van_chung: 'Tư vấn chung',
}

/* ─── Loại thanh toán ─── */
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  mua_goi: 'Mua gói',
  booking: 'Lịch hẹn',
  tu_van_le: 'Tư vấn lẻ',
}

/* ─── Vai trò người dùng ─── */
export const ROLE_LABELS: Record<string, string> = {
  customer: 'Khách hàng',
  expert: 'Chuyên gia',
  admin: 'Quản trị viên',
}

/* ─── Resource type (audit log) ─── */
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  tai_khoan: 'Tài khoản',
  chuyen_gia: 'Chuyên gia',
  goi_dich_vu: 'Gói dịch vụ',
  goi_dich_vu_chuyen_gia: 'Mapping gói-chuyên gia',
  thanh_toan: 'Giao dịch',
  danh_gia: 'Đánh giá',
  khieu_nai: 'Khiếu nại',
  ky_hoa_hong: 'Kỳ hoa hồng',
  cau_hinh_hoa_hong: 'Cấu hình hoa hồng',
  thong_bao: 'Thông báo',
  lich_hen: 'Lịch hẹn',
  export_job: 'Xuất file',
}

/* ─── Sự kiện booking timeline ─── */
export const BOOKING_EVENT_LABELS: Record<string, string> = {
  create: 'Tạo lịch',
  confirm: 'Xác nhận',
  reject: 'Từ chối',
  check_in: 'Check-in',
  checkin: 'Check-in',
  start: 'Bắt đầu',
  complete: 'Hoàn thành',
  cancel: 'Hủy',
  cancel_by_admin: 'Hủy bởi admin',
  cancel_by_customer: 'Hủy bởi khách',
  reschedule: 'Đổi lịch',
}

/* ─── Helper functions ─── */

export function statusLabel(value?: string | null): string {
  if (!value) return '—'
  return STATUS_LABELS[value] ?? value
}

export function priorityLabel(value?: string | null): string {
  if (!value) return '—'
  return PRIORITY_LABELS[value] ?? value
}

export function notificationTypeLabel(value?: string | null): string {
  if (!value) return '—'
  return NOTIFICATION_TYPE_LABELS[value] ?? value
}

export function complaintTypeLabel(value?: string | null): string {
  if (!value) return '—'
  return COMPLAINT_TYPE_LABELS[value] ?? value
}

export function packageTypeLabel(value?: string | null): string {
  if (!value) return '—'
  return PACKAGE_TYPE_LABELS[value] ?? value
}

export function paymentTypeLabel(value?: string | null): string {
  if (!value) return '—'
  return PAYMENT_TYPE_LABELS[value] ?? value
}

export function roleLabel(value?: string | null): string {
  if (!value) return '—'
  return ROLE_LABELS[value] ?? value
}

export function resourceTypeLabel(value?: string | null): string {
  if (!value) return '—'
  return RESOURCE_TYPE_LABELS[value] ?? value
}

export function bookingEventLabel(value?: string | null): string {
  if (!value) return '—'
  return BOOKING_EVENT_LABELS[value] ?? value
}

/**
 * Trả về options [{ value, label }] cho <select> dropdown.
 * VD: enumOptions(['nhap', 'da_chot']) → [{value:'nhap',label:'Đang nháp'}, {value:'da_chot',label:'Đã chốt'}]
 */
export function enumOptions(values: string[], dictionary: Record<string, string> = STATUS_LABELS) {
  return values.map((v) => ({ value: v, label: dictionary[v] ?? v }))
}
