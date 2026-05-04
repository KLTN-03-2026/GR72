'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MessageCircle,
  CalendarCheck,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Star,
  AlertCircle,
  Heart,
  Activity,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { UserNotificationBell } from '@/components/user/user-notification-bell'
import { apiRequest, getHomeForRole, type AuthUser } from '@/lib/auth'

const navItems = [
  { label: 'Tổng quan', href: '/user', icon: LayoutDashboard, description: 'Xem tổng quan tài khoản' },
  { label: 'Gói dịch vụ', href: '/user/packages', icon: Package, description: 'Khám phá gói tư vấn' },
  { label: 'Gói của tôi', href: '/user/my-packages', icon: ShoppingBag, description: 'Quản lý gói đã mua' },
  { label: 'Chuyên gia', href: '/user/experts', icon: Users, description: 'Tìm chuyên gia phù hợp' },
  { label: 'Lịch hẹn', href: '/user/bookings', icon: CalendarCheck, description: 'Đặt & quản lý lịch' },
  { label: 'Chat tư vấn', href: '/user/chats', icon: MessageCircle, description: 'Trao đổi realtime với chuyên gia' },
  { label: 'Thanh toán', href: '/user/payments', icon: CreditCard, description: 'Lịch sử giao dịch' },
  { label: 'Đánh giá', href: '/user/reviews', icon: Star, description: 'Đánh giá chuyên gia' },
  { label: 'Khiếu nại', href: '/user/complaints', icon: AlertCircle, description: 'Hỗ trợ & khiếu nại' },
  { label: 'Hồ sơ sức khỏe', href: '/user/health-profile', icon: Heart, description: 'Thông tin sức khỏe' },
  { label: 'Chỉ số sức khỏe', href: '/user/health-metrics', icon: Activity, description: 'Theo dõi chỉ số' },
  { label: 'Gợi ý sức khỏe', href: '/user/health-recommendations', icon: Sparkles, description: 'Kế hoạch sức khỏe' },
  { label: 'Dinh dưỡng', href: '/user/wellness-recommendations', icon: Utensils, description: 'Dinh dưỡng & tập luyện' },
]


export function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let active = true

    apiRequest<AuthUser>('/auth/me')
      .then((response) => {
        if (!active) return
        if (response.data.vai_tro !== 'customer') {
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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (!allowed) {
    return (
      <main className='user-loading'>
        <div className='user-loading__card'>
          <span className='user-loading__spinner' />
          <span>Đang tải...</span>
        </div>
      </main>
    )
  }

  return (
    <div className='user-shell'>
      {/* Sidebar */}
      <aside className={`user-sidebar ${mobileOpen ? 'user-sidebar--open' : ''}`}>
        <div className='user-sidebar__header'>
          <Link href='/user' className='user-sidebar__logo'>
            <div className='user-sidebar__logo-icon'>
              <span>N</span>
            </div>
            <div className='user-sidebar__logo-text'>
              <span className='user-sidebar__brand'>NutriConsult</span>
              <span className='user-sidebar__brand-sub'>Tư vấn dinh dưỡng</span>
            </div>
          </Link>
          <button className='user-sidebar__close' onClick={() => setMobileOpen(false)} aria-label='Đóng menu'>
            <X size={20} />
          </button>
        </div>

        <nav className='user-sidebar__nav'>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/user' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`user-sidebar__link ${active ? 'user-sidebar__link--active' : ''}`}
              >
                <Icon size={18} className='user-sidebar__link-icon' />
                <span className='user-sidebar__link-label'>{label}</span>
                {active && <ChevronRight size={14} className='user-sidebar__link-arrow' />}
              </Link>
            )
          })}
        </nav>

        {user && (
          <div className='user-sidebar__footer'>
            <div className='user-sidebar__profile'>
              <div className='user-sidebar__avatar'>
                {user.ho_ten?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className='user-sidebar__user-info'>
                <p className='user-sidebar__user-name'>{user.ho_ten}</p>
                <p className='user-sidebar__user-email'>{user.email}</p>
              </div>
              <LogoutButton iconOnly />
            </div>
          </div>
        )}
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className='user-sidebar__overlay' onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className='user-main'>
        <header className='user-header'>
          <div className='user-header__inner'>
            <button className='user-header__menu-btn' onClick={() => setMobileOpen(true)} aria-label='Mở menu'>
              <Menu size={20} />
            </button>
            <div className='user-header__greeting'>
              <p className='user-header__hello'>
                Xin chào, <strong>{user?.ho_ten ?? 'bạn'}</strong> 👋
              </p>
            </div>
            <div className='user-header__actions' style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <UserNotificationBell />
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className='user-content'>
          {children}
        </main>
      </div>
    </div>
  )
}
