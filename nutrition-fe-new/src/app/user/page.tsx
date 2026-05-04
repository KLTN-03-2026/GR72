'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Package, ShoppingBag, CalendarCheck, CreditCard, ArrowRight, TrendingUp, Star, AlertCircle, Clock, Heart, Activity, Sparkles, Utensils, Bot } from 'lucide-react'
import { SectionHeader, UserStatCard, Card, UserButton, StatusBadge } from '@/components/user/user-ui'
import { customerGet } from '@/lib/customer-api'

type Row = Record<string, any>

export default function UserDashboardPage() {
  const [packages, setPackages] = useState<Row[]>([])
  const [payments, setPayments] = useState<Row[]>([])
  const [bookings, setBookings] = useState<Row[]>([])

  useEffect(() => {
    customerGet<Row[]>('/my-packages').then(setPackages).catch(() => {})
    customerGet<Row[]>('/payments').then(setPayments).catch(() => {})
    customerGet<Row[]>('/bookings').then(setBookings).catch(() => {})
  }, [])

  const stats = useMemo(() => ({
    activePackages: packages.filter((p) => p.runtime_status === 'dang_hieu_luc').length,
    totalPackages: packages.length,
    successPayments: payments.filter((p) => p.trang_thai === 'thanh_cong').length,
    upcomingBookings: bookings.filter((b) => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai)).length,
  }), [packages, payments, bookings])

  const quickActions = [

    { label: 'Mua gói dịch vụ', desc: 'Khám phá các gói tư vấn dinh dưỡng phù hợp', href: '/user/packages', icon: Package, bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#6366f1' },
    { label: 'Gói của tôi', desc: 'Xem gói đã mua & chọn chuyên gia tư vấn', href: '/user/my-packages', icon: ShoppingBag, bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669' },
    { label: 'Đặt lịch tư vấn', desc: 'Hẹn giờ với chuyên gia phù hợp nhu cầu', href: '/user/bookings', icon: CalendarCheck, bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#ea580c' },
    { label: 'Thanh toán', desc: 'Xem lịch sử và trạng thái giao dịch', href: '/user/payments', icon: CreditCard, bg: 'linear-gradient(135deg, #faf5ff, #e9d5ff)', color: '#7c3aed' },
  ]

  return (
    <>
      {/* Welcome Banner */}
      <div className='welcome-banner'>
        <div className='welcome-banner__content'>
          <p className='welcome-banner__greeting'>✨ Chào mừng trở lại</p>
          <h1 className='welcome-banner__title'>
            Quản lý sức khỏe & dinh dưỡng của bạn
          </h1>
          <p className='welcome-banner__desc'>
            Theo dõi gói dịch vụ, lịch hẹn với chuyên gia và lịch sử thanh toán tại đây.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className='grid-stats'>
        <UserStatCard label='Gói đang sử dụng' value={String(stats.activePackages)} icon={ShoppingBag} tone='green' />
        <UserStatCard label='Tổng gói đã mua' value={String(stats.totalPackages)} icon={Package} tone='blue' />
        <UserStatCard label='Lịch sắp tới' value={String(stats.upcomingBookings)} icon={CalendarCheck} tone='orange' />
        <UserStatCard label='Giao dịch thành công' value={String(stats.successPayments)} icon={TrendingUp} tone='purple' />
      </div>

      {/* Quick Actions */}
      <SectionHeader title='Truy cập nhanh' />
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 32 }}>
        {[
          { label: 'Mua gói dịch vụ', desc: 'Khám phá các gói tư vấn dinh dưỡng phù hợp', href: '/user/packages', icon: Package, bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#6366f1' },
          { label: 'Gói của tôi', desc: 'Xem gói đã mua & chọn chuyên gia tư vấn', href: '/user/my-packages', icon: ShoppingBag, bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669' },
          { label: 'Lịch hẹn', desc: 'Theo dõi, đổi lịch hoặc hủy lịch tư vấn', href: '/user/bookings', icon: CalendarCheck, bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#ea580c' },
          { label: 'Thanh toán', desc: 'Xem lịch sử và trạng thái giao dịch', href: '/user/payments', icon: CreditCard, bg: 'linear-gradient(135deg, #faf5ff, #e9d5ff)', color: '#7c3aed' },
          { label: 'Đánh giá', desc: 'Xem và quản lý đánh giá chuyên gia', href: '/user/reviews', icon: Star, bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706' },
          { label: 'Khiếu nại', desc: 'Gửi và theo dõi khiếu nại hỗ trợ', href: '/user/complaints', icon: AlertCircle, bg: 'linear-gradient(135deg, #fef2f2, #fecaca)', color: '#dc2626' },
          { label: 'Hồ sơ sức khỏe', desc: 'Khai báo thông tin sức khỏe nền', href: '/user/health-profile', icon: Heart, bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', color: '#ec4899' },
          { label: 'Chỉ số sức khỏe', desc: 'Theo dõi cân nặng, huyết áp, BMI', href: '/user/health-metrics', icon: Activity, bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#16a34a' },
          { label: 'Gợi ý sức khỏe', desc: 'Kế hoạch sức khỏe cá nhân hóa', href: '/user/health-recommendations', icon: Sparkles, bg: 'linear-gradient(135deg, #fefce8, #fef9c3)', color: '#ca8a04' },
          { label: 'Dinh dưỡng & Tập luyện', desc: 'Gợi ý dinh dưỡng, calories, bài tập', href: '/user/wellness-recommendations', icon: Utensils, bg: 'linear-gradient(135deg, #ecfeff, #cffafe)', color: '#0891b2' },
          { label: 'Chatbox AI sức khỏe', desc: 'Hỏi đáp nhanh với AI theo bối cảnh sức khỏe', href: '/user/ai-chat', icon: Bot, bg: 'linear-gradient(135deg, #eef2ff, #ddd6fe)', color: '#6d28d9' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className='quick-action'>
            <div className='quick-action__icon' style={{ background: item.bg, color: item.color }}>
              <item.icon size={22} />
            </div>
            <div className='quick-action__text'>
              <p className='quick-action__label'>{item.label}</p>
              <p className='quick-action__desc'>{item.desc}</p>
            </div>
            <ArrowRight size={18} className='quick-action__arrow' />
          </Link>
        ))}
      </div>

      {/* Upcoming bookings */}
      {bookings.filter(b => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai)).length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-.02em' }}>Lịch hẹn sắp tới</h2>
            <Link href='/user/bookings'><UserButton variant='ghost' size='sm'>Xem tất cả →</UserButton></Link>
          </div>
          <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
            {bookings.filter(b => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai)).slice(0, 3).map((b) => (
              <Link key={b.id} href={`/user/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
                <Card hover>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{b.expert_name}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{b.ten_goi} · {new Date(b.bat_dau_luc).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                      </div>
                    </div>
                    <StatusBadge value={b.trang_thai} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Recent packages */}
      {packages.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-.02em' }}>Gói gần đây</h2>
            <Link href='/user/my-packages'><UserButton variant='ghost' size='sm'>Xem tất cả →</UserButton></Link>
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {packages.slice(0, 3).map((pkg) => (
              <Card key={pkg.id} hover>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{pkg.ten_goi}</p>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                      Còn <strong style={{ color: '#059669' }}>{pkg.so_luot_con_lai ?? 0}</strong>/{pkg.so_luot_tong ?? 0} lượt
                    </p>
                  </div>
                </div>
                <Link href={`/user/experts?packagePurchaseId=${pkg.id}`}>
                  <UserButton variant='secondary' size='sm'>Chọn chuyên gia →</UserButton>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  )
}
