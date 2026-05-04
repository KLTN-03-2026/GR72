export function PageHeader({
  title,
  description,
  action,
  eyebrow = 'Admin workspace',
}: {
  title: string
  description: string
  action?: React.ReactNode
  eyebrow?: string
}) {
  return (
    <div className='relative mb-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_58%,#FFF7ED_100%)] p-5 shadow-sm'>
      <div className='pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-cyan-200/35 blur-3xl' />
      <div className='pointer-events-none absolute left-8 top-0 h-20 w-40 rounded-full bg-emerald-100/50 blur-2xl' />
      <div className='relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <p className='font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[#2563EB]'>
            {eyebrow}
          </p>
          <h2 className='mt-2 max-w-4xl text-2xl font-semibold leading-tight text-slate-950 md:text-3xl'>
            {title}
          </h2>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>{description}</p>
        </div>
        {action ? <div className='shrink-0'>{action}</div> : null}
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  tone = 'blue',
  caption,
  icon: Icon,
}: {
  label: string
  value: string
  tone?: 'blue' | 'orange' | 'green' | 'red' | 'slate'
  caption?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}) {
  const tones = {
    blue: 'text-[#2563EB] bg-blue-50 border-blue-100 shadow-blue-50',
    orange: 'text-[#F97316] bg-orange-50 border-orange-100 shadow-orange-50',
    green: 'text-emerald-700 bg-emerald-50 border-emerald-100 shadow-emerald-50',
    red: 'text-red-700 bg-red-50 border-red-100 shadow-red-50',
    slate: 'text-slate-800 bg-slate-50 border-slate-200 shadow-slate-50',
  }
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-colors duration-200 hover:border-current ${tones[tone]}`}>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs font-semibold uppercase tracking-wide opacity-80'>{label}</p>
        {Icon ? <Icon size={15} className='shrink-0 opacity-50' /> : null}
      </div>
      <p className='mt-2 text-2xl font-semibold tracking-tight'>{value}</p>
      {caption ? <p className='mt-2 text-xs font-medium opacity-70'>{caption}</p> : null}
    </div>
  )
}

export function Panel({ children, title, description, action }: { children: React.ReactNode; title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <section className='rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5'>
      {title || action ? (
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            {title ? <h3 className='text-lg font-semibold text-slate-950'>{title}</h3> : null}
            {description ? <p className='mt-1 text-sm leading-6 text-slate-500'>{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className='mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end'>{children}</div>
}

export function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <label className='block'>
      <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</span>
      <div className='mt-1.5'>{children}</div>
      {hint && !error ? <p className='mt-1.5 text-xs leading-5 text-slate-500'>{hint}</p> : null}
      {error ? <p className='mt-1.5 text-xs font-semibold leading-5 text-red-600'>{error}</p> : null}
    </label>
  )
}

export const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

export function StatusPill({ value }: { value: string }) {
  const labels: Record<string, string> = {
    dang_ban: 'Đang bán',
    ban_nhap: 'Bản nháp',
    ngung_ban: 'Ngừng bán',
    hoat_dong: 'Hoạt động',
    khong_hoat_dong: 'Không hoạt động',
    bi_khoa: 'Bị khóa',
    customer: 'Người dùng',
    expert: 'Chuyên gia',
    admin: 'Quản trị viên',
    cho_duyet: 'Chờ duyệt',
    tu_choi: 'Từ chối',
    tam_dung: 'Tạm dừng',
    thanh_cong: 'Thành công',
    hoan_tien: 'Hoàn tiền',
    hien_thi: 'Hiển thị',
    bi_an: 'Đã ẩn',
    bi_bao_cao: 'Bị báo cáo',
    da_chi_tra: 'Đã chi trả',
    cho_chi_tra: 'Chờ chi trả',
    da_chot: 'Đã chốt',
    nhap: 'Đang nháp',
    moi: 'Mới',
    dang_xu_ly: 'Đang xử lý',
    cho_phan_hoi: 'Chờ phản hồi',
    da_giai_quyet: 'Đã giải quyết',
    da_dong: 'Đã đóng',
    chua_doc: 'Chưa đọc',
    da_doc: 'Đã đọc',
    dang_hieu_luc: 'Đang hiệu lực',
    cho_thanh_toan: 'Chờ thanh toán',
    het_luot: 'Hết lượt',
    het_han: 'Hết hạn',
    da_hoan_tien: 'Đã hoàn tiền',
    khoi_tao: 'Khởi tạo',
    that_bai: 'Thất bại',
  }
  const positive = ['dang_ban', 'hoat_dong', 'thanh_cong', 'hien_thi', 'da_chi_tra', 'hoan_thanh', 'da_giai_quyet', 'customer', 'expert', 'admin', 'da_doc', 'dang_hieu_luc']
  const danger = ['ngung_ban', 'hoan_tien', 'bi_an', 'bi_bao_cao', 'that_bai', 'da_xoa', 'bi_khoa', 'tu_choi', 'het_luot', 'het_han', 'da_hoan_tien']
  const className = positive.includes(value)
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : danger.includes(value)
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-slate-50 text-slate-700 border-slate-200'
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{labels[value] ?? value}</span>
}

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center'>
      <p className='text-sm font-medium text-slate-500'>{text}</p>
      {action ? <div className='mt-4'>{action}</div> : null}
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'success' | 'error' }) {
  const tones = {
    info: 'border-blue-100 bg-blue-50 text-[#2563EB]',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    error: 'border-red-100 bg-red-50 text-red-700',
  }
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${tones[tone]}`} role='status'>{children}</div>
}

export function ActionButton({ children, onClick, disabled, tone = 'primary', type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'primary' | 'secondary' | 'danger' | 'accent'; type?: 'button' | 'submit' }) {
  const tones = {
    primary: 'bg-[#2563EB] text-white hover:bg-blue-700 shadow-blue-100',
    accent: 'bg-[#F97316] text-white hover:bg-orange-600 shadow-orange-100',
    secondary: 'border border-slate-300 bg-white text-slate-800 hover:border-[#2563EB] hover:text-[#2563EB] shadow-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-100',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}>
      {children}
    </button>
  )
}

export function money(value: unknown) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value ?? 0))
}

export function barWidth(value: number, max: number) {
  if (!max) return '0%'
  return `${Math.max(4, Math.min(100, Math.round((value / max) * 100)))}%`
}
