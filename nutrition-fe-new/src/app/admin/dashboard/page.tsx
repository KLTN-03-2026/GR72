'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, AlertCircle, MessageSquare, Wallet, Receipt, Users, Star, RefreshCw } from 'lucide-react'
import { adminGet } from '@/lib/admin-api'
import { ActionButton, LoadingSkeleton, Notice, PageHeader, Panel, StatCard, money } from '@/components/admin/admin-ui'

type Overview = {
  revenue: number
  payments: number
  successfulPayments: number
  refundedPayments: number
  packages: number
  flaggedReviews: number
  openComplaints: number
  pendingCommission: number
}

type ExpertRow = {
  id: number
  ho_ten: string
  email: string
  chuyen_mon: string | null
  trang_thai: string
  nhan_booking: number
  diem_danh_gia_trung_binh: number
  so_luot_danh_gia: number
  so_booking_hoan_thanh: number
  booking_count: number
  package_count: number
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [experts, setExperts] = useState<ExpertRow[]>([])
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setRefreshing(true)
    try {
      const [overviewData, expertRows] = await Promise.all([
        adminGet<Overview>('/overview'),
        adminGet<ExpertRow[]>('/experts'),
      ])
      setOverview(overviewData)
      setExperts(expertRows)
      setLastUpdated(new Date())
      setError('')
    } catch (err: any) {
      setError(err.message ?? 'Lỗi tải dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const topExperts = useMemo(() => {
    return [...experts]
      .sort((a, b) => {
        const ratingDiff = Number(b.diem_danh_gia_trung_binh ?? 0) - Number(a.diem_danh_gia_trung_binh ?? 0)
        if (ratingDiff !== 0) return ratingDiff
        return Number(b.booking_count ?? 0) - Number(a.booking_count ?? 0)
      })
      .slice(0, 8)
  }, [experts])

  const successRate = overview?.payments ? Math.round((overview.successfulPayments / overview.payments) * 100) : 0
  const refundRate = overview?.payments ? Math.round((overview.refundedPayments / overview.payments) * 100) : 0

  return (
    <>
      <PageHeader
        eyebrow='Bảng điều hành'
        title='Bảng điều hành hệ thống'
        description='Tổng hợp KPI, chỉ số vận hành và các vấn đề cần xử lý ngay.'
        action={
          <div className='flex gap-2'>
            <ActionButton tone='secondary' onClick={load} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Đang tải...' : 'Làm mới'}
            </ActionButton>
            <Link href='/admin/revenue'><ActionButton tone='accent'>Xem doanh thu</ActionButton></Link>
          </div>
        }
      />
      {error ? <Notice tone='error'>{error}</Notice> : null}

      {!overview ? (
        <Panel><LoadingSkeleton rows={4} /></Panel>
      ) : (
        <div className='space-y-5'>
          {/* Key metrics */}
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              label='Doanh thu tổng'
              value={money(overview.revenue)}
              icon={TrendingUp}
              tone='green'
              caption={lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString('vi-VN')}` : undefined}
            />
            <StatCard
              label='Tỉ lệ thành công'
              value={`${successRate}%`}
              icon={Receipt}
              tone='blue'
              caption={`${overview.successfulPayments}/${overview.payments} giao dịch`}
            />
            <StatCard
              label='Hoa hồng chờ chi'
              value={money(overview.pendingCommission)}
              icon={Wallet}
              tone='orange'
            />
            <StatCard
              label='Gói đang bán'
              value={String(overview.packages)}
              icon={Users}
              tone='slate'
            />
          </div>

          {/* Priority issues - colored cards */}
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            <PriorityCard
              icon={MessageSquare}
              label='Khiếu nại đang mở'
              value={overview.openComplaints}
              href='/admin/complaints'
              critical={overview.openComplaints > 5}
              warning={overview.openComplaints > 0}
            />
            <PriorityCard
              icon={Star}
              label='Review bị báo cáo'
              value={overview.flaggedReviews}
              href='/admin/reviews'
              warning={overview.flaggedReviews > 0}
            />
            <PriorityCard
              icon={RefreshCw}
              label='Giao dịch hoàn tiền'
              value={overview.refundedPayments}
              href='/admin/payments'
              warning={refundRate > 5}
              caption={`${refundRate}% tổng giao dịch`}
            />
            <PriorityCard
              icon={Wallet}
              label='Hoa hồng chờ payout'
              value={money(overview.pendingCommission)}
              href='/admin/commissions'
              warning={overview.pendingCommission > 0}
              isText
            />
          </div>

          {/* Operational chart */}
          <Panel
            title='Biểu đồ vận hành'
            description='Các chỉ số trọng yếu để theo dõi chất lượng hoạt động.'
            action={<span className='text-xs font-medium text-slate-500'>Cập nhật {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : '--:--'}</span>}
          >
            <div className='space-y-4'>
              <ChartRow
                label='Thanh toán thành công'
                value={overview.successfulPayments}
                total={overview.payments}
                tone='emerald'
              />
              <ChartRow
                label='Hoàn tiền'
                value={overview.refundedPayments}
                total={overview.payments}
                tone='rose'
              />
              <ChartRow
                label='Hoa hồng chờ / Doanh thu'
                value={overview.pendingCommission}
                total={Math.max(overview.revenue, 1)}
                tone='amber'
                isMoney
              />
            </div>
          </Panel>

          {/* Top experts */}
          <Panel
            title='Top chuyên gia'
            description='Sắp xếp theo rating, sau đó theo số booking.'
            action={<Link href='/admin/experts'><ActionButton tone='secondary'>Xem tất cả</ActionButton></Link>}
          >
            {topExperts.length === 0 ? (
              <p className='py-8 text-center text-sm text-slate-400'>Chưa có dữ liệu chuyên gia.</p>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                {topExperts.map((row, idx) => (
                  <div key={row.id} className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-200'>
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {idx + 1}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-slate-900'>{row.ho_ten}</p>
                      <p className='truncate text-xs text-slate-500'>{row.chuyen_mon ?? '—'}</p>
                      <div className='mt-1 flex items-center gap-3 text-xs'>
                        <span className='inline-flex items-center gap-1 font-semibold text-amber-600'>
                          <Star size={11} fill='currentColor' />
                          {Number(row.diem_danh_gia_trung_binh ?? 0).toFixed(1)}
                        </span>
                        <span className='text-slate-500'>{row.booking_count ?? 0} booking</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </>
  )
}

function PriorityCard({
  icon: Icon, label, value, href, critical, warning, caption, isText,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number | string
  href: string
  critical?: boolean
  warning?: boolean
  caption?: string
  isText?: boolean
}) {
  const tone = critical
    ? 'border-red-200 bg-red-50 text-red-700'
    : warning
      ? 'border-orange-200 bg-orange-50 text-orange-700'
      : 'border-slate-200 bg-white text-slate-700'

  return (
    <Link href={href} className={`group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:shadow-md ${tone}`}>
      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/80'>
        <Icon size={18} />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-xs font-semibold uppercase tracking-wide opacity-70'>{label}</p>
        <p className={`mt-0.5 font-bold leading-tight ${isText ? 'text-base' : 'text-2xl'}`}>{value}</p>
        {caption && <p className='mt-1 text-xs opacity-70'>{caption}</p>}
      </div>
      <span className='text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100'>→</span>
    </Link>
  )
}

function ChartRow({ label, value, total, tone, isMoney }: { label: string; value: number; total: number; tone: 'emerald' | 'rose' | 'amber'; isMoney?: boolean }) {
  const percent = total ? Math.round((value / total) * 100) : 0
  const toneBg = { emerald: 'bg-emerald-500', rose: 'bg-rose-500', amber: 'bg-amber-500' }[tone]
  return (
    <div>
      <div className='mb-1.5 flex items-baseline justify-between gap-2 text-sm'>
        <p className='font-medium text-slate-700'>{label}</p>
        <p className='font-bold text-slate-950'>
          {isMoney ? money(value) : value}
          <span className='ml-2 text-xs font-medium text-slate-500'>({percent}%)</span>
        </p>
      </div>
      <div className='h-2.5 overflow-hidden rounded-full bg-slate-100'>
        <div className={`${toneBg} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(2, percent)}%` }} />
      </div>
    </div>
  )
}
