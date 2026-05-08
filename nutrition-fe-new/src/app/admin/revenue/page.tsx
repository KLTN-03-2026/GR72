'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, RefreshCw, Download, DollarSign, Wallet, Receipt,
  Package, User, Calendar, BarChart3, Crown,
} from 'lucide-react'
import {
  ActionButton, EmptyState, FilterChip, LoadingSkeleton, Notice,
  PageHeader, Panel, money,
} from '@/components/admin/admin-ui'
import { RevenueLineChart } from '@/components/admin/admin-charts'
import { adminGet } from '@/lib/admin-api'

type Summary = Record<string, number>
type Row = Record<string, any>
type RevenueRange = 'today' | 'yesterday' | 'last7' | 'month' | 'year' | 'all'

const RANGE_OPTIONS: { key: RevenueRange; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'last7', label: '7 ngày' },
  { key: 'month', label: '30 ngày' },
  { key: 'year', label: '1 năm' },
  { key: 'all', label: 'Tất cả' },
]

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function rangeToQuery(range: RevenueRange) {
  if (range === 'all') return ''
  const today = new Date()
  const to = formatDate(today)
  const fromMap: Record<Exclude<RevenueRange, 'all' | 'yesterday'>, string> = {
    today: to,
    last7: formatDate(addDays(today, -6)),
    month: formatDate(addDays(today, -29)),
    year: formatDate(addDays(today, -364)),
  }
  const from = range === 'yesterday' ? formatDate(addDays(today, -1)) : fromMap[range]
  const end = range === 'yesterday' ? from : to
  return `?from=${from}&to=${end}`
}

function pct(current: number, prev: number) {
  if (!prev) return current ? 100 : 0
  return Math.round(((current - prev) / prev) * 100)
}

export default function RevenuePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null)
  const [packages, setPackages] = useState<Row[]>([])
  const [experts, setExperts] = useState<Row[]>([])
  const [series, setSeries] = useState<Row[]>([])
  const [activeRange, setActiveRange] = useState<RevenueRange>('month')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info')

  async function load(range: RevenueRange) {
    setLoading(true)
    setMessage('')
    try {
      const query = rangeToQuery(range)
      const [s, p, e, t] = await Promise.all([
        adminGet<Summary>(`/revenue/summary${query}`),
        adminGet<Row[]>(`/revenue/by-package${query}`),
        adminGet<Row[]>(`/revenue/by-expert${query}`),
        adminGet<Row[]>(`/revenue/timeseries${query}`),
      ])
      setSummary(s)
      setPackages(p)
      setExperts(e)
      setSeries(t)

      // Fetch previous period for comparison (only if not "all")
      if (range !== 'all') {
        const prevQuery = previousRangeQuery(range)
        const prev = await adminGet<Summary>(`/revenue/summary${prevQuery}`).catch(() => null)
        setPrevSummary(prev)
      } else {
        setPrevSummary(null)
      }
    } catch (err: any) {
      setMessage(err.message ?? 'Lỗi tải dữ liệu')
      setTone('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(activeRange) }, [activeRange])

  async function exportReport() {
    setExporting(true)
    try {
      const result = await adminGet<{ file_url: string }>(`/revenue/export${rangeToQuery(activeRange)}`)
      setMessage(`✅ Đã tạo file: ${result.file_url}`)
      setTone('success')
    } catch (e: any) {
      setMessage(e.message ?? 'Lỗi export')
      setTone('error')
    } finally {
      setExporting(false)
    }
  }

  const totalSeriesRevenue = useMemo(() => series.reduce((s, r) => s + Number(r.revenue ?? 0), 0), [series])
  const avgDaily = series.length ? totalSeriesRevenue / series.length : 0
  const peakDay = useMemo(() => series.reduce<Row | null>((max, r) => !max || Number(r.revenue) > Number(max.revenue) ? r : max, null), [series])

  const revenuePoints = useMemo(() => series.map((r) => ({ label: String(r.date).slice(0, 10), value: Number(r.revenue) })), [series])

  const grossDelta = summary && prevSummary ? pct(Number(summary.grossRevenue), Number(prevSummary.grossRevenue)) : null
  const netDelta = summary && prevSummary ? pct(Number(summary.netRevenue), Number(prevSummary.netRevenue)) : null
  const refundDelta = summary && prevSummary ? pct(Number(summary.refundedRevenue), Number(prevSummary.refundedRevenue)) : null
  const commissionDelta = summary && prevSummary ? pct(Number(summary.payableCommission), Number(prevSummary.payableCommission)) : null

  return (
    <>
      <PageHeader
        eyebrow='Phân tích doanh thu'
        title='Báo cáo Doanh thu'
        description='Theo dõi doanh thu, refund, hoa hồng và xu hướng theo thời gian.'
        action={
          <div className='flex gap-2'>
            <ActionButton tone='secondary' onClick={() => load(activeRange)} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Đang tải...' : 'Làm mới'}
            </ActionButton>
            <ActionButton tone='accent' onClick={exportReport} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Đang export...' : 'Export'}
            </ActionButton>
          </div>
        }
      />
      {message ? <Notice tone={tone}>{message}</Notice> : null}

      {/* Period selector */}
      <div className='mb-5 flex flex-wrap items-center gap-2'>
        <span className='inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500'>
          <Calendar size={13} /> Khoảng thời gian:
        </span>
        {RANGE_OPTIONS.map((opt) => (
          <FilterChip key={opt.key} active={activeRange === opt.key} onClick={() => setActiveRange(opt.key)}>
            {opt.label}
          </FilterChip>
        ))}
      </div>

      {loading && !summary ? (
        <Panel><LoadingSkeleton rows={4} /></Panel>
      ) : summary ? (
        <>
          {/* KPI cards with comparison */}
          <div className='mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <KpiCard
              icon={DollarSign}
              label='Doanh thu gộp'
              value={money(summary.grossRevenue)}
              delta={grossDelta}
              tone='blue'
              hint='Trước hoàn tiền'
            />
            <KpiCard
              icon={TrendingUp}
              label='Doanh thu thuần'
              value={money(summary.netRevenue)}
              delta={netDelta}
              tone='green'
              hint='Sau trừ refund'
            />
            <KpiCard
              icon={RefreshCw}
              label='Hoàn tiền'
              value={money(summary.refundedRevenue)}
              delta={refundDelta}
              tone='red'
              inversePositive
            />
            <KpiCard
              icon={Wallet}
              label='Hoa hồng phải trả'
              value={money(summary.payableCommission)}
              delta={commissionDelta}
              tone='orange'
            />
          </div>

          {/* Secondary stats */}
          <div className='mb-5 grid gap-3 sm:grid-cols-3'>
            <MetricBox icon={BarChart3} label='Doanh thu TB/ngày' value={money(avgDaily)} caption={`${series.length} ngày dữ liệu`} />
            <MetricBox icon={TrendingUp} label='Ngày cao điểm' value={peakDay ? money(peakDay.revenue) : '—'} caption={peakDay ? String(peakDay.date).slice(0, 10) : 'chưa có'} />
            <MetricBox icon={Receipt} label='Tỉ lệ refund' value={summary.grossRevenue ? `${((summary.refundedRevenue / summary.grossRevenue) * 100).toFixed(1)}%` : '0%'} caption='trên doanh thu gộp' />
          </div>

          {/* Trend chart */}
          {revenuePoints.length > 0 && (
            <div className='mb-5'>
              <RevenueLineChart points={revenuePoints} />
            </div>
          )}

          {/* Two-column: Top packages + Top experts */}
          <div className='mb-5 grid gap-5 xl:grid-cols-2'>
            <Panel
              title='Top gói theo doanh thu'
              description='Gói nào kéo doanh thu tốt nhất.'
              action={packages.length > 5 ? <span className='text-xs font-medium text-slate-500'>Hiển thị 5/{packages.length}</span> : undefined}
            >
              {packages.length === 0 ? (
                <EmptyState text='Chưa có doanh thu theo gói.' />
              ) : (
                <div className='space-y-3'>
                  {packages.slice(0, 5).map((row, idx) => {
                    const max = Math.max(...packages.map(p => Number(p.revenue)), 1)
                    const percent = (Number(row.revenue) / max) * 100
                    return (
                      <div key={row.id ?? idx} className='space-y-1.5'>
                        <div className='flex items-center justify-between gap-3'>
                          <div className='flex min-w-0 items-center gap-2'>
                            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                              {idx + 1}
                            </span>
                            <Package size={13} className='text-slate-400' />
                            <span className='truncate text-sm font-semibold text-slate-900'>{row.ten_goi}</span>
                          </div>
                          <span className='whitespace-nowrap text-sm font-bold text-slate-950'>{money(row.revenue)}</span>
                        </div>
                        <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
                          <div
                            className='h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500'
                            style={{ width: `${Math.max(2, percent)}%` }}
                          />
                        </div>
                        <p className='text-xs text-slate-500'>{row.loai_goi} · {row.bookings ?? 0} booking</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel
              title='Top chuyên gia'
              description='Chuyên gia tạo doanh thu cao nhất.'
              action={experts.length > 5 ? <span className='text-xs font-medium text-slate-500'>Hiển thị 5/{experts.length}</span> : undefined}
            >
              {experts.length === 0 ? (
                <EmptyState text='Chưa có doanh thu theo chuyên gia.' />
              ) : (
                <div className='space-y-3'>
                  {experts.slice(0, 5).map((row, idx) => {
                    const max = Math.max(...experts.map(e => Number(e.revenue)), 1)
                    const percent = (Number(row.revenue) / max) * 100
                    return (
                      <div key={row.expert_id ?? idx} className='rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex min-w-0 items-center gap-2'>
                            {idx === 0 && <Crown size={14} className='flex-shrink-0 text-amber-500' />}
                            <User size={13} className='flex-shrink-0 text-slate-400' />
                            <div className='min-w-0'>
                              <p className='truncate text-sm font-semibold text-slate-900'>{row.expert_name}</p>
                              <p className='text-xs text-slate-500'>{row.completed_bookings} booking hoàn thành</p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='whitespace-nowrap text-sm font-bold text-blue-700'>{money(row.revenue)}</p>
                            <p className='whitespace-nowrap text-xs font-semibold text-orange-600'>HH: {money(row.commission)}</p>
                          </div>
                        </div>
                        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100'>
                          <div
                            className='h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500'
                            style={{ width: `${Math.max(2, percent)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>
          </div>

          {/* Daily breakdown — collapsible heatmap-style */}
          <Panel
            title='Doanh thu theo ngày'
            description='Bảng chi tiết với heatmap cường độ.'
            action={<span className='text-xs font-medium text-slate-500'>{series.length} ngày</span>}
          >
            {series.length === 0 ? (
              <EmptyState text='Chưa có dữ liệu doanh thu theo ngày.' />
            ) : (
              <div className='space-y-2'>
                {series.map((row) => {
                  const max = Math.max(...series.map((r) => Number(r.revenue ?? 0)), 1)
                  const percent = (Number(row.revenue) / max) * 100
                  const isPeak = row === peakDay
                  return (
                    <div key={row.date} className={`relative overflow-hidden rounded-xl border ${isPeak ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'} px-3 py-2.5`}>
                      <div
                        className={`absolute inset-y-0 left-0 ${isPeak ? 'bg-gradient-to-r from-amber-100 to-amber-50' : 'bg-gradient-to-r from-blue-50 to-blue-50/40'}`}
                        style={{ width: `${Math.max(2, percent)}%` }}
                      />
                      <div className='relative flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-3'>
                          {isPeak && <Crown size={14} className='text-amber-500' />}
                          <span className='font-mono text-xs font-semibold text-slate-700'>{String(row.date).slice(0, 10)}</span>
                          <span className='text-xs text-slate-500'>{row.bookings ?? 0} giao dịch</span>
                        </div>
                        <span className={`whitespace-nowrap font-bold ${isPeak ? 'text-amber-700' : 'text-slate-950'}`}>
                          {money(row.revenue)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </>
      ) : null}
    </>
  )
}

function previousRangeQuery(range: RevenueRange): string {
  const today = new Date()
  if (range === 'today') {
    const d = formatDate(addDays(today, -1))
    return `?from=${d}&to=${d}`
  }
  if (range === 'yesterday') {
    const d = formatDate(addDays(today, -2))
    return `?from=${d}&to=${d}`
  }
  const lengths: Partial<Record<RevenueRange, number>> = { last7: 7, month: 30, year: 365 }
  const len = lengths[range] ?? 0
  const to = formatDate(addDays(today, -len))
  const from = formatDate(addDays(today, -len * 2 + 1))
  return `?from=${from}&to=${to}`
}

function KpiCard({ icon: Icon, label, value, delta, tone, hint, inversePositive }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  delta: number | null
  tone: 'blue' | 'green' | 'orange' | 'red'
  hint?: string
  inversePositive?: boolean
}) {
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50/60',
    green: 'border-emerald-100 bg-emerald-50/60',
    orange: 'border-orange-100 bg-orange-50/60',
    red: 'border-red-100 bg-red-50/60',
  }[tone]

  const iconColor = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  }[tone]

  // Determine if delta is "good"
  const isPositive = delta !== null && (inversePositive ? delta < 0 : delta > 0)
  const isNegative = delta !== null && delta !== 0 && (inversePositive ? delta > 0 : delta < 0)

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${toneClass}`}>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-semibold uppercase tracking-wide text-slate-600'>{label}</p>
        <Icon size={16} className={iconColor} />
      </div>
      <p className='mt-2 text-2xl font-bold tracking-tight text-slate-950'>{value}</p>
      <div className='mt-2 flex items-center justify-between gap-2'>
        {hint && <p className='text-xs text-slate-500'>{hint}</p>}
        {delta !== null && (
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${
            isPositive ? 'bg-emerald-100 text-emerald-700' :
            isNegative ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : null}
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
    </div>
  )
}

function MetricBox({ icon: Icon, label, value, caption }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  caption?: string
}) {
  return (
    <div className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4'>
      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100'>
        <Icon size={18} className='text-slate-600' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
        <p className='mt-0.5 truncate text-base font-bold text-slate-900'>{value}</p>
        {caption && <p className='text-xs text-slate-500'>{caption}</p>}
      </div>
    </div>
  )
}
