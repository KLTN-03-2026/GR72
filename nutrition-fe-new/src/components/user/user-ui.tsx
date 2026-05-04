import React, { type ReactNode } from 'react'

/* ─────────── Section Header ─────────── */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className='user-section-header'>
      <div className='user-section-header__text'>
        <h1 className='user-section-header__title'>{title}</h1>
        {subtitle && <p className='user-section-header__subtitle'>{subtitle}</p>}
      </div>
      {action && <div className='user-section-header__action'>{action}</div>}
    </div>
  )
}

/* ─────────── Card ─────────── */
export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={`user-card ${hover ? 'user-card--hover' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ─────────── Stat Card ─────────── */
export function UserStatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'slate' | 'red'
}) {
  return (
    <div className={`user-stat user-stat--${tone}`}>
      {Icon && (
        <div className='user-stat__icon'>
          <Icon size={20} />
        </div>
      )}
      <div className='user-stat__content'>
        <p className='user-stat__label'>{label}</p>
        <p className='user-stat__value'>{value}</p>
      </div>
    </div>
  )
}

/* ─────────── Button ─────────── */
export function UserButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  style,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`user-btn user-btn--${variant} user-btn--${size} ${className}`}
    >
      {children}
    </button>
  )
}

/* ─────────── Badge ─────────── */
const statusConfig: Record<string, { label: string; tone: string }> = {
  dang_ban: { label: 'Đang bán', tone: 'green' },
  ban_nhap: { label: 'Bản nháp', tone: 'slate' },
  ngung_ban: { label: 'Ngừng bán', tone: 'red' },
  hoat_dong: { label: 'Hoạt động', tone: 'green' },
  khong_hoat_dong: { label: 'Không hoạt động', tone: 'slate' },
  bi_khoa: { label: 'Bị khóa', tone: 'red' },
  cho_duyet: { label: 'Chờ duyệt', tone: 'orange' },
  tu_choi: { label: 'Từ chối', tone: 'red' },
  thanh_cong: { label: 'Thành công', tone: 'green' },
  hoan_tien: { label: 'Hoàn tiền', tone: 'red' },
  dang_hieu_luc: { label: 'Đang hiệu lực', tone: 'green' },
  cho_thanh_toan: { label: 'Chờ thanh toán', tone: 'orange' },
  het_luot: { label: 'Hết lượt', tone: 'red' },
  het_han: { label: 'Hết hạn', tone: 'red' },
  khoi_tao: { label: 'Khởi tạo', tone: 'slate' },
  that_bai: { label: 'Thất bại', tone: 'red' },
  da_hoan_tien: { label: 'Đã hoàn tiền', tone: 'red' },
  da_xac_nhan: { label: 'Đã xác nhận', tone: 'green' },
  cho_xac_nhan: { label: 'Chờ xác nhận', tone: 'orange' },
  da_huy: { label: 'Đã hủy', tone: 'red' },
  hoan_thanh: { label: 'Hoàn thành', tone: 'green' },
  da_checkin: { label: 'Đã check-in', tone: 'blue' },
  dang_tu_van: { label: 'Đang tư vấn', tone: 'green' },
  // Reviews
  hien_thi: { label: 'Hiển thị', tone: 'green' },
  an: { label: 'Đã ẩn', tone: 'slate' },
  bi_an: { label: 'Bị ẩn', tone: 'slate' },
  da_xoa: { label: 'Đã xóa', tone: 'red' },
  bi_bao_cao: { label: 'Bị báo cáo', tone: 'orange' },
  // Complaints
  moi: { label: 'Mới', tone: 'orange' },
  dang_xu_ly: { label: 'Đang xử lý', tone: 'blue' },
  da_xu_ly: { label: 'Đã xử lý', tone: 'green' },
  da_dong: { label: 'Đã đóng', tone: 'slate' },
  // Purchases
  tam_khoa: { label: 'Tạm khóa', tone: 'orange' },
  // Recommendations
  moi_tao: { label: 'Mới tạo', tone: 'orange' },
  da_ap_dung: { label: 'Đã áp dụng', tone: 'green' },
  luu_tru: { label: 'Lưu trữ', tone: 'slate' },
  // Booking extra
  vo_hieu_hoa: { label: 'Vô hiệu hóa', tone: 'red' },
}


export function StatusBadge({ value }: { value: string }) {
  const cfg = statusConfig[value] ?? { label: value, tone: 'slate' }
  return (
    <span className={`user-badge user-badge--${cfg.tone}`}>
      <span className='user-badge__dot' />
      {cfg.label}
    </span>
  )
}

/* ─────────── Empty State ─────────── */
export function UserEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className='user-empty'>
      {Icon && (
        <div className='user-empty__icon'>
          <Icon size={40} />
        </div>
      )}
      <h3 className='user-empty__title'>{title}</h3>
      {description && <p className='user-empty__desc'>{description}</p>}
      {action && <div className='user-empty__action'>{action}</div>}
    </div>
  )
}

/* ─────────── Alert/Notice ─────────── */
export function UserNotice({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'info' | 'success' | 'error' | 'warning'
}) {
  return (
    <div className={`user-notice user-notice--${tone}`} role='status'>
      {children}
    </div>
  )
}

/* ─────────── Money Formatter ─────────── */
export function money(value: unknown) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

/* ─────────── Input ─────────── */
export function UserInput({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className='user-field'>
      <span className='user-field__label'>{label}</span>
      <div className='user-field__input'>{children}</div>
      {hint && !error && <p className='user-field__hint'>{hint}</p>}
      {error && <p className='user-field__error'>{error}</p>}
    </label>
  )
}

export const userInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]'
