'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, DollarSign, Wallet, Award, Calendar, Crown, Package, BarChart3, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { SectionHeader, Card, UserStatCard, UserButton, UserNotice, UserEmptyState, money } from '@/components/user/user-ui'
import { expertGet } from '@/lib/expert-api'

type Row = Record<string, any>

const RANGE_OPTIONS = [
  { key: 'last7', label: '7 ngày' },
  { key: 'last30', label: '30 ngày' },
  { key: 'last90', label: '90 ngày' },
  { key: 'year', label: '1 năm' },
  { key: 'all', label: 'Tất cả' },
]

const LOAI_GOI: Record<string, string> = {
  dinh_duong: 'Dinh dưỡng',
  tap_luyen: 'Tập luyện',
  suc_khoe: 'Sức khoẻ',
}

function compactMoney(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(Math.round(n))
}

export default function ExpertRevenuePage() {
  const [range, setRange] = useState('last30')
  const [data, setData] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    expertGet<Row>(`/revenue?range=${range}`)
      .then(setData)
      .catch((e) => setError(e.message ?? 'Lỗi tải doanh thu'))
      .finally(() => setLoading(false))
  }, [range])

  const summary = data?.summary
  const timeseries = (data?.timeseries ?? []).map((r: Row) => ({
    ...r,
    date: String(r.date).slice(5), // MM-DD
    revenue: Number(r.revenue ?? 0),
    commission: Number(r.commission ?? 0),
  }))
  const byPackage = data?.by_package ?? []
  const byMonth = data?.by_month ?? []

  const totalRevenue = Number(summary?.total_revenue ?? 0)
  const totalCommission = Number(summary?.total_commission ?? 0)
  const totalBookings = Number(summary?.total_bookings ?? 0)
  const avgRate = Number(summary?.avg_rate ?? 0)
  const avgPerBooking = totalBookings > 0 ? totalCommission / totalBookings : 0

  return (
    <>
      <SectionHeader
        title='Doanh thu & Thu nhập'
        subtitle='Thống kê doanh thu, hoa hồng và xu hướng theo thời gian.'
        action={
          <Link href='/nutritionist/earnings'>
            <UserButton variant='secondary'>Chi tiết theo kỳ <ChevronRight size={14} /></UserButton>
          </Link>
        }
      />

      {error && <UserNotice tone='error'>{error}</UserNotice>}

      {/* Range selector */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Calendar size={15} style={{ color: '#94a3b8' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginRight: 4 }}>Khoảng thời gian:</span>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                border: `1px solid ${range === opt.key ? '#6366f1' : '#e2e8f0'}`,
                background: range === opt.key ? '#eef2ff' : 'white',
                color: range === opt.key ? '#6366f1' : '#64748b',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</p></Card>
      ) : (
        <>
          {/* KPI */}
          <div className='grid-stats'>
            <UserStatCard label='Tổng doanh thu' value={money(totalRevenue)} icon={DollarSign} tone='blue' />
            <UserStatCard label='Hoa hồng nhận' value={money(totalCommission)} icon={Wallet} tone='green' />
            <UserStatCard label='Số booking' value={String(totalBookings)} icon={Award} tone='purple' />
            <UserStatCard label='TB / booking' value={money(avgPerBooking)} icon={TrendingUp} tone='orange' />
          </div>

          {/* Note giải thích */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#475569' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                  Tỷ lệ hoa hồng trung bình: <strong style={{ color: '#6366f1' }}>{avgRate.toFixed(1)}%</strong>
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Doanh thu hợp lệ tính từ các booking đã hoàn thành. Tỷ lệ hoa hồng do admin cấu hình theo gói/chuyên gia.
                </p>
              </div>
            </div>
          </Card>

          {/* Chart timeseries */}
          {timeseries.length >= 2 ? (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📈 Xu hướng doanh thu</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>{timeseries.length} điểm dữ liệu</p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} />
                    Doanh thu
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                    Hoa hồng
                  </span>
                </div>
              </div>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={timeseries} margin={{ top: 20, right: 24, bottom: 8, left: 8 }}>
                    <defs>
                      <linearGradient id='revArea' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#3b82f6' stopOpacity={0.35} />
                        <stop offset='100%' stopColor='#3b82f6' stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id='comArea' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#10b981' stopOpacity={0.35} />
                        <stop offset='100%' stopColor='#10b981' stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke='#e2e8f0' strokeDasharray='4 4' vertical={false} />
                    <XAxis dataKey='date' tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} minTickGap={20} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={compactMoney} width={56} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(v: any, name: any) => [money(Number(v)), name === 'revenue' ? 'Doanh thu' : 'Hoa hồng'] as [string, string]}
                    />
                    <Area type='monotone' dataKey='revenue' stroke='#3b82f6' strokeWidth={2.5} fill='url(#revArea)' />
                    <Area type='monotone' dataKey='commission' stroke='#10b981' strokeWidth={2.5} fill='url(#comArea)' />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ) : timeseries.length === 1 ? (
            <Card>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📈 Xu hướng doanh thu</p>
              <p style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                Chỉ có 1 ngày dữ liệu. Cần thêm booking để vẽ biểu đồ xu hướng.
              </p>
            </Card>
          ) : null}

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
            {/* Top gói */}
            <Card>
              <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🏆 Top gói tạo doanh thu</h2>
              {byPackage.length === 0 ? (
                <UserEmptyState icon={Package} title='Chưa có dữ liệu' />
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {byPackage.slice(0, 5).map((row: Row, idx: number) => {
                    const max = Math.max(...byPackage.map((p: Row) => Number(p.revenue)), 1)
                    const percent = (Number(row.revenue) / max) * 100
                    return (
                      <div key={row.id} style={{ padding: 12, background: '#fafafa', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{
                              flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                              background: idx === 0 ? '#fef3c7' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fed7aa' : '#f1f5f9',
                              color: idx === 0 ? '#92400e' : idx === 1 ? '#475569' : idx === 2 ? '#9a3412' : '#64748b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                            }}>{idx + 1}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.ten_goi}
                            </span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{money(row.revenue)}</span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.max(2, percent)}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748b' }}>
                          {LOAI_GOI[row.loai_goi] ?? row.loai_goi} · {row.bookings} booking · HH {money(row.commission)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Doanh thu theo tháng */}
            <Card>
              <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📅 12 tháng gần nhất</h2>
              {byMonth.length === 0 ? (
                <UserEmptyState icon={Calendar} title='Chưa có dữ liệu' />
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {byMonth.map((row: Row) => {
                    const max = Math.max(...byMonth.map((m: Row) => Number(m.revenue)), 1)
                    const percent = (Number(row.revenue) / max) * 100
                    const isMax = Number(row.revenue) === max && max > 0
                    return (
                      <div key={row.month} style={{
                        position: 'relative', overflow: 'hidden',
                        padding: '10px 12px', background: isMax ? '#fef3c7' : 'white',
                        borderRadius: 8, border: `1px solid ${isMax ? '#fcd34d' : '#f1f5f9'}`,
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0, left: 0,
                          background: isMax ? 'linear-gradient(90deg, #fde68a 0%, #fef3c7 100%)' : 'linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)',
                          width: `${Math.max(2, percent)}%`, opacity: 0.5,
                        }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isMax && <Crown size={14} style={{ color: '#f59e0b' }} />}
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                              {row.month}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{row.bookings} booking</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isMax ? '#92400e' : '#0f172a' }}>
                            {money(row.revenue)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}
