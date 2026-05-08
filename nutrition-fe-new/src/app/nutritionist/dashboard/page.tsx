'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  CalendarClock, CheckCircle, Star, Wallet, Clock, ChevronRight,
  TrendingUp, Calendar, AlertCircle,
} from 'lucide-react'
import {
  SectionHeader, Card, UserStatCard, UserButton, UserNotice,
  UserEmptyState, StatusBadge, money,
} from '@/components/user/user-ui'
import { expertGet } from '@/lib/expert-api'

type Data = Record<string, any>

export default function NutritionistDashboardPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    expertGet<Data>('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  })()

  return (
    <>
      <SectionHeader
        title={`${greeting}, chuyên gia 👋`}
        subtitle='Đây là tổng quan công việc hôm nay của bạn.'
      />

      {error && <UserNotice tone='error'>{error}</UserNotice>}

      {loading ? (
        <Card>
          <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải dashboard...</p>
        </Card>
      ) : data ? (
        <>
          {/* Stats */}
          <div className='grid-stats'>
            <UserStatCard label='Booking đang xử lý' value={String(data.booking?.active ?? 0)} icon={CalendarClock} tone='orange' />
            <UserStatCard label='Đã hoàn thành' value={String(data.booking?.completed ?? 0)} icon={CheckCircle} tone='green' />
            <UserStatCard label='Rating trung bình' value={`${Number(data.review?.avgRating ?? 0).toFixed(1)}/5`} icon={Star} tone='purple' />
            <UserStatCard label='Hoa hồng chờ chi' value={money(data.commission?.pending)} icon={Wallet} tone='blue' />
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
            <QuickAction
              href='/nutritionist/bookings'
              icon={<Calendar size={20} />}
              title='Lịch hẹn của tôi'
              desc='Xác nhận, từ chối, hoàn thành'
              tone='#6366f1'
            />
            <QuickAction
              href='/nutritionist/availability'
              icon={<Clock size={20} />}
              title='Cài đặt lịch'
              desc='Cập nhật khung giờ làm việc'
              tone='#10b981'
            />
            <QuickAction
              href='/nutritionist/earnings'
              icon={<TrendingUp size={20} />}
              title='Thu nhập'
              desc='Theo dõi hoa hồng từng kỳ'
              tone='#f59e0b'
            />
            <QuickAction
              href='/nutritionist/reviews'
              icon={<Star size={20} />}
              title='Đánh giá'
              desc='Phản hồi khách hàng'
              tone='#8b5cf6'
            />
          </div>

          {/* Next bookings */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>📅 Booking sắp xử lý</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  Các lịch đã xác nhận cần chuẩn bị trước buổi tư vấn.
                </p>
              </div>
              <Link href='/nutritionist/bookings'>
                <UserButton size='sm' variant='secondary'>Xem tất cả <ChevronRight size={12} /></UserButton>
              </Link>
            </div>

            {data.nextBookings?.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {data.nextBookings.map((row: Data) => (
                  <Link key={row.id} href='/nutritionist/bookings' style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: 14, background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9',
                      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateX(4px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, background: '#eef2ff', color: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <CalendarClock size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {row.ma_lich_hen}
                          </p>
                          <StatusBadge value={row.trang_thai} />
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#475569' }}>
                          <strong>{row.customer_name}</strong> · {row.ten_goi}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                          {String(row.ngay_hen).slice(0, 10)} · {row.gio_bat_dau}
                        </p>
                      </div>
                      <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <UserEmptyState
                icon={AlertCircle}
                title='Chưa có booking sắp xử lý'
                description='Khi có lịch hẹn được xác nhận, chúng sẽ xuất hiện ở đây.'
              />
            )}
          </Card>
        </>
      ) : null}
    </>
  )
}

function QuickAction({ href, icon, title, desc, tone }: {
  href: string; icon: React.ReactNode; title: string; desc: string; tone: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: 16, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s',
        height: '100%',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = tone; e.currentTarget.style.boxShadow = `0 4px 12px ${tone}25` }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: `${tone}15`, color: tone,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{desc}</p>
        </div>
      </div>
    </Link>
  )
}
