import { LogoutButton } from './logout-button'

type RoleDashboardProps = {
  eyebrow: string
  title: string
  description: string
  stats: Array<{ label: string; value: string }>
  actions: string[]
}

export function RoleDashboard({
  eyebrow,
  title,
  description,
  stats,
  actions,
}: RoleDashboardProps) {
  return (
    <main className='min-h-screen bg-[#F8FAFC] px-6 py-8 text-[#1E293B]'>
      <section className='mx-auto max-w-6xl'>
        <header className='flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.25em] text-[#2563EB]'>
              {eyebrow}
            </p>
            <h1 className='mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl'>{title}</h1>
            <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600'>{description}</p>
          </div>
          <LogoutButton />
        </header>

        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          {stats.map((stat) => (
            <article key={stat.label} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <p className='text-sm font-medium text-slate-500'>{stat.label}</p>
              <p className='mt-3 text-3xl font-semibold text-[#2563EB]'>{stat.value}</p>
            </article>
          ))}
        </div>

        <section className='mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='text-xl font-semibold text-slate-950'>Chức năng chính sắp triển khai</h2>
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            {actions.map((action) => (
              <div key={action} className='rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-700'>
                {action}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
