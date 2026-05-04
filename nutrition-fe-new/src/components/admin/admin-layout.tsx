'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  CreditCard,
  Star,
  BarChart2,
  Wallet,
  MessageSquareWarning,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { AdminNotificationBell } from './admin-notification-bell'
import { apiRequest, getHomeForRole, type AuthUser } from '@/lib/auth'

const navItems = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Chuyên gia', href: '/admin/experts', icon: UserCheck },
  { label: 'Gói dịch vụ', href: '/admin/service-packages', icon: Package },
  { label: 'Thanh toán', href: '/admin/payments', icon: CreditCard },
  { label: 'Đánh giá', href: '/admin/reviews', icon: Star },
  { label: 'Doanh thu', href: '/admin/revenue', icon: BarChart2 },
  { label: 'Hoa hồng', href: '/admin/commissions', icon: Wallet },
  { label: 'Khiếu nại', href: '/admin/complaints', icon: MessageSquareWarning },
  { label: 'Thông báo', href: '/admin/notifications', icon: Bell },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let active = true

    apiRequest<AuthUser>('/auth/me')
      .then((response) => {
        if (!active) return
        if (response.data.vai_tro !== 'admin') {
          router.replace(getHomeForRole(response.data.vai_tro))
          return
        }
        setUser(response.data)
        setAllowed(true)
      })
      .catch(() => {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      })

    return () => {
      active = false
    }
  }, [pathname, router])

  const currentNav = navItems.find((n) => n.href === pathname)

  if (!allowed) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700'>
        <div className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm'>
          <span className='h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600' />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_8%_0%,#DBEAFE_0,transparent_28%),linear-gradient(180deg,#F8FAFC_0%,#EEF6FF_48%,#F8FAFC_100%)] text-[#1E293B]'>
      {/* Sidebar desktop */}
      <aside className='fixed inset-y-4 left-4 hidden w-64 flex-col rounded-[1.75rem] border border-white/80 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur lg:flex'>
        {/* Logo */}
        <div className='px-4 pt-5'>
          <Link href='/admin/dashboard' className='block rounded-2xl bg-slate-950 px-4 py-4 text-white'>
            <span className='block text-base font-bold tracking-tight'>Nutrition Admin</span>
            <span className='mt-0.5 block text-xs text-slate-400'>Vận hành tư vấn sức khỏe</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className='mt-4 flex-1 space-y-0.5 overflow-y-auto px-3'>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? 'flex items-center gap-3 rounded-xl bg-[#2563EB] px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100'
                    : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-blue-50 hover:text-[#2563EB]'
                }
              >
                <Icon size={16} className='shrink-0' />
                <span className='truncate'>{label}</span>
                {active && <ChevronRight size={14} className='ml-auto shrink-0 opacity-70' />}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        {user && (
          <div className='border-t border-slate-100 px-3 py-3'>
            <div className='flex items-center gap-3 rounded-xl px-2 py-2'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white'>
                {user.ho_ten?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-slate-900'>{user.ho_ten}</p>
                <p className='truncate text-xs text-slate-500'>{user.email}</p>
              </div>
              <LogoutButton iconOnly />
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <section className='lg:pl-[272px]'>
        {/* Header */}
        <header className='sticky top-0 z-10 border-b border-white/70 bg-white/80 px-4 py-3 backdrop-blur-xl lg:top-4 lg:mx-4 lg:rounded-2xl lg:border lg:shadow-sm'>
          <div className='mx-auto flex max-w-7xl items-center justify-between gap-4'>
            <div className='min-w-0'>
              <p className='font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]'>Admin</p>
              <h1 className='truncate text-lg font-semibold text-slate-950'>
                {currentNav?.label ?? 'Bảng điều hành'}
              </h1>
            </div>
            <div className='flex items-center gap-2'>
              <AdminNotificationBell />
              <div className='hidden lg:block'><LogoutButton /></div>
            </div>
          </div>
          {/* Mobile nav */}
          <nav className='mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden'>
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href
                    ? 'flex shrink-0 items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white'
                    : 'flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600'
                }
              >
                <Icon size={12} />
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
