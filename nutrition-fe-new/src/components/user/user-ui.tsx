import React, { type ReactNode } from 'react'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/i18n'

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
const STATUS_TONE: Record<string, string> = {
  // Tích cực (green)
  dang_ban: 'green', hoat_dong: 'green', thanh_cong: 'green', hien_thi: 'green',
  da_chi_tra: 'green', hoan_thanh: 'green', da_giai_quyet: 'green', da_xu_ly: 'green',
  dang_hieu_luc: 'green', da_xac_nhan: 'green', dang_tu_van: 'green', da_ap_dung: 'green',
  customer: 'green', expert: 'green', admin: 'green',
  // Cảnh báo (orange)
  cho_duyet: 'orange', cho_xac_nhan: 'orange', cho_thanh_toan: 'orange', cho_chi_tra: 'orange',
  cho_phan_hoi: 'orange', tam_dung: 'orange', tam_khoa: 'orange', moi: 'orange',
  bi_bao_cao: 'orange', moi_tao: 'orange', cao: 'orange',
  // Đang chạy (blue)
  da_checkin: 'blue', dang_xu_ly: 'blue',
  // Lỗi / âm tính (red)
  ngung_ban: 'red', hoan_tien: 'red', that_bai: 'red', da_xoa: 'red', bi_khoa: 'red',
  tu_choi: 'red', het_luot: 'red', het_han: 'red', da_hoan_tien: 'red', da_huy: 'red',
  vo_hieu_hoa: 'red',
  // Trung tính
  ban_nhap: 'slate', khong_hoat_dong: 'slate', khoi_tao: 'slate', bi_an: 'slate',
  an: 'slate', da_dong: 'slate', luu_tru: 'slate', da_luu_tru: 'slate',
  thap: 'slate', trung_binh: 'slate',
}

export function StatusBadge({ value }: { value: string }) {
  const tone = STATUS_TONE[value] ?? 'slate'
  const label = STATUS_LABELS[value] ?? PRIORITY_LABELS[value] ?? value
  return (
    <span className={`user-badge user-badge--${tone}`}>
      <span className='user-badge__dot' />
      {label}
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
