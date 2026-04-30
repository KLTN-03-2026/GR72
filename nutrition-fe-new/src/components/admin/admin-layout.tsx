'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { AdminNotificationBell } from './admin-notification-bell'
import { apiRequest, getHomeForRole, type AuthUser } from '@/lib/auth'

const navItems = [
  ['Tổng quan', '/admin/dashboard'],
  ['Người dùng', '/admin/users'],
  ['Chuyên gia', '/admin/experts'],
  ['Gói dịch vụ', '/admin/service-packages'],
  ['Thanh toán', '/admin/payments'],
  ['Đánh giá', '/admin/reviews'],
  ['Thống kê Doanh thu', '/admin/revenue'],
  ['Hoa hồng', '/admin/commissions'],
  ['Khiếu nại', '/admin/complaints'],
  ['Thông báo', '/admin/notifications'],
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let active = true

    apiRequest<AuthUser>('/auth/me')
      .then((response) => {
        if (!active) return
        if (response.data.vai_tro !== 'admin') {
          router.replace(getHomeForRole(response.data.vai_tro))
          return
        }
        setAllowed(true)
      })
      .catch(() => {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      })

    return () => {
      active = false
    }
  }, [pathname, router])

  if (!allowed) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700'>
        <div className='rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm'>
          Đang kiểm tra phiên đăng nhập...
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_8%_0%,#DBEAFE_0,transparent_28%),linear-gradient(180deg,#F8FAFC_0%,#EEF6FF_48%,#F8FAFC_100%)] text-[#1E293B]'>
      <aside className='fixed inset-y-4 left-4 hidden w-72 rounded-[1.75rem] border border-white/80 bg-white/90 px-4 py-5 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur lg:block'>
        <Link href='/admin/dashboard' className='block rounded-2xl bg-slate-950 px-4 py-4 text-white'>
          <span className='block text-lg font-semibold'>Nutrition Admin</span>
          <span className='mt-1 block text-xs text-slate-300'>Vận hành tư vấn sức khỏe</span>
        </Link>
        <nav className='mt-5 space-y-1.5'>
          {navItems.map(([label, href]) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? 'block rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100'
                    : 'block rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-[#2563EB]'
                }
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <section className='lg:pl-80'>
        <header className='sticky top-0 z-10 border-b border-white/70 bg-white/75 px-4 py-3 backdrop-blur-xl lg:top-4 lg:mx-4 lg:rounded-2xl lg:border lg:shadow-sm'>
          <div className='mx-auto flex max-w-7xl items-center justify-between gap-4'>
            <div className='min-w-0'>
              <p className='font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[#2563EB]'>Admin</p>
              <h1 className='truncate text-lg font-semibold text-slate-950 sm:text-xl'>Bảng điều hành hệ thống</h1>
            </div>
            <div className='flex items-center gap-2'>
              <AdminNotificationBell />
              <LogoutButton />
            </div>
          </div>
          <nav className='mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden'>
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className={pathname === href ? 'shrink-0 rounded-full bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white' : 'shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600'}>
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <div className='mx-auto max-w-7xl px-4 py-6 lg:px-5 lg:py-8'>{children}</div>
      </section>
    </main>
  )
}
