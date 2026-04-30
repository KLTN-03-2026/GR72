import Link from 'next/link'

const valueCards = [
  ['3 nhóm tư vấn', 'Sức khỏe, dinh dưỡng và tập luyện'],
  ['Đặt lịch linh hoạt', 'Chọn chuyên gia phù hợp với nhu cầu'],
  ['Theo dõi tiến trình', 'Lưu lại chỉ số và mục tiêu cá nhân'],
]

const trustItems = [
  'Chuyên gia tư vấn theo từng gói dịch vụ',
  'Nhắc lịch và lưu thông tin buổi tư vấn',
  'Gợi ý sức khỏe cá nhân hóa theo hồ sơ của bạn',
]

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className='min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_18%,#DBEAFE_0,transparent_32%),linear-gradient(135deg,#F8FAFC_0%,#EEF6FF_48%,#FFF7ED_100%)] text-[#1E293B]'>
      <section className='mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1fr_460px]'>
        <div className='relative flex flex-col justify-between px-6 py-8 sm:px-10 lg:py-12'>
          <div className='pointer-events-none absolute left-10 top-32 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl' />
          <div className='pointer-events-none absolute bottom-20 right-20 h-48 w-48 rounded-full bg-orange-200/40 blur-3xl' />

          <Link
            href='/'
            className='relative w-fit text-lg font-semibold tracking-tight text-[#1E293B] transition-colors duration-200 hover:text-[#2563EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
          >
            Nutrition Consult
          </Link>

          <div className='relative max-w-3xl py-14 lg:py-16'>
            <div className='mb-5 inline-flex rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] shadow-sm backdrop-blur'>
              {eyebrow}
            </div>
            <h1 className='max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl'>
              {title}
            </h1>
            <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-600'>
              {description}
            </p>

            <div className='mt-8 space-y-3'>
              {trustItems.map((item) => (
                <div key={item} className='flex items-start gap-3 text-sm font-semibold text-slate-700'>
                  <span className='mt-1 h-2.5 w-2.5 rounded-full bg-[#F97316]' />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className='mt-10 grid max-w-3xl gap-3 sm:grid-cols-3'>
              {valueCards.map(([value, label]) => (
                <div key={value} className='rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur'>
                  <p className='text-xl font-semibold text-[#2563EB]'>{value}</p>
                  <p className='mt-1 text-sm leading-5 text-slate-600'>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className='relative text-sm text-slate-500'>
            Đồng hành cùng bạn xây dựng thói quen sống khỏe mỗi ngày.
          </p>
        </div>

        <div className='flex items-center border-t border-white/70 bg-white/90 px-6 py-8 shadow-[0_0_48px_rgba(15,23,42,0.10)] backdrop-blur sm:px-10 lg:border-l lg:border-t-0'>
          <div className='w-full'>
            {children}
            {footer ? <div className='mt-6 text-center text-sm text-slate-600'>{footer}</div> : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className='mt-1.5 text-sm font-medium text-red-600'>{children}</p>
}

export function StatusMessage({
  type,
  message,
}: {
  type: 'success' | 'error'
  message: string
}) {
  return (
    <div
      className={
        type === 'success'
          ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800'
          : 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
      }
      role='status'
    >
      {message}
    </div>
  )
}
