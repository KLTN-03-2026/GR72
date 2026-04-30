'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionButton, EmptyState, Notice, PageHeader, Panel, StatCard, barWidth, money } from '@/components/admin/admin-ui'
import { ExpertComparisonChart, HorizontalBarChart, RevenueLineChart } from '@/components/admin/admin-charts'
import { adminGet } from '@/lib/admin-api'

type Summary = Record<string, number>
type Row = Record<string, any>
type RevenueRange = 'today' | 'yesterday' | 'last7' | 'month' | 'year' | 'all'

const rangeOptions: { key: RevenueRange; label: string; description: string }[] = [
  { key: 'today', label: 'Hôm nay', description: 'Giao dịch phát sinh trong ngày hiện tại' },
  { key: 'yesterday', label: 'Hôm qua', description: 'Giao dịch phát sinh trong ngày hôm qua' },
  { key: 'last7', label: '7 ngày', description: '7 ngày gần nhất, bao gồm hôm nay' },
  { key: 'month', label: '1 tháng', description: '30 ngày gần nhất, bao gồm hôm nay' },
  { key: 'year', label: '1 năm', description: '365 ngày gần nhất, bao gồm hôm nay' },
  { key: 'all', label: 'Tất cả', description: 'Toàn bộ dữ liệu doanh thu' },
]

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function revenueRangeQuery(range: RevenueRange) {
  if (range === 'all') return ''

  const today = new Date()
  const to = formatDate(today)
  const fromByRange: Record<Exclude<RevenueRange, 'all' | 'yesterday'>, string> = {
    today: to,
    last7: formatDate(addDays(today, -6)),
    month: formatDate(addDays(today, -29)),
    year: formatDate(addDays(today, -364)),
  }

  const from = range === 'yesterday' ? formatDate(addDays(today, -1)) : fromByRange[range]
  const end = range === 'yesterday' ? from : to
  return `?from=${from}&to=${end}`
}

export default function RevenuePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [packages, setPackages] = useState<Row[]>([])
  const [experts, setExperts] = useState<Row[]>([])
  const [series, setSeries] = useState<Row[]>([])
  const [activeRange, setActiveRange] = useState<RevenueRange>('all')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load(range: RevenueRange) {
    setLoading(true)
    setMessage('')
    const query = revenueRangeQuery(range)
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
    setLoading(false)
  }

  useEffect(() => {
    load(activeRange).catch((err) => {
      setLoading(false)
      setMessage(err.message)
    })
  }, [activeRange])

  async function exportReport() {
    const result = await adminGet<{ file_url: string }>(`/revenue/export${revenueRangeQuery(activeRange)}`)
    setMessage(`Đã tạo file export: ${result.file_url}`)
  }

  const activeRangeOption = rangeOptions.find((option) => option.key === activeRange)
  const maxPackageRevenue = useMemo(() => Math.max(...packages.map((row) => Number(row.revenue)), 0), [packages])
  const maxSeriesRevenue = useMemo(() => Math.max(...series.map((row) => Number(row.revenue)), 0), [series])
  const revenuePoints = useMemo(() => series.map((row) => ({ label: String(row.date).slice(0, 10), value: Number(row.revenue) })), [series])
  const packagePoints = useMemo(() => packages.map((row) => ({ label: row.ten_goi as string, value: Number(row.revenue) })), [packages])
  const expertPoints = useMemo(() => experts.map((row) => ({ label: row.expert_name as string, primary: Number(row.revenue), secondary: Number(row.commission) })), [experts])

  return (
    <>
      <PageHeader
        eyebrow='Revenue intelligence'
        title='Thống kê Doanh thu'
        description='Theo dõi doanh thu hợp lệ, refund, booking hoàn thành và hoa hồng phải trả để số liệu khớp với đối soát.'
        action={<ActionButton tone='accent' onClick={exportReport}>Export báo cáo</ActionButton>}
      />
      {message ? <Notice>{message}</Notice> : null}
      <div className='mb-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm'>
        <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
          <div>
            <p className='text-sm font-semibold text-slate-950'>Bộ lọc thời gian</p>
            <p className='mt-1 text-sm text-slate-500'>{activeRangeOption?.description}</p>
          </div>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end'>
            {rangeOptions.map((option) => {
              const isActive = option.key === activeRange
              return (
                <button
                  key={option.key}
                  type='button'
                  onClick={() => setActiveRange(option.key)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${isActive ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-sm shadow-blue-100' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]'}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {loading ? <Notice>Đang tải dữ liệu doanh thu theo bộ lọc...</Notice> : null}
      {summary ? (
        <div className='mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard label='Doanh thu gộp' value={money(summary.grossRevenue)} />
          <StatCard label='Doanh thu thuần' value={money(summary.netRevenue)} tone='green' />
          <StatCard label='Hoàn tiền' value={money(summary.refundedRevenue)} tone='red' />
          <StatCard label='Hoa hồng phải trả' value={money(summary.payableCommission)} tone='orange' />
        </div>
      ) : null}

      <div className='space-y-5'>
        {revenuePoints.length ? <RevenueLineChart points={revenuePoints} /> : null}

        <div className='grid gap-5 xl:grid-cols-2'>
          <Panel title='Chart doanh thu theo gói' description='So sánh nhanh gói nào đang kéo doanh thu tốt nhất.'>
            {packagePoints.length ? <HorizontalBarChart points={packagePoints} /> : <EmptyState text='Chưa có dữ liệu chart theo gói.' />}
          </Panel>
          <Panel title='Chart chuyên gia: doanh thu và hoa hồng' description='Thanh xanh là doanh thu, thanh cam là hoa hồng phải trả.'>
            {expertPoints.length ? <ExpertComparisonChart points={expertPoints} /> : <EmptyState text='Chưa có dữ liệu chart theo chuyên gia.' />}
          </Panel>
        </div>

        <Panel title='Doanh thu theo ngày' description='Biểu đồ thanh giúp nhìn nhanh ngày nào có giao dịch tốt.'>
          {series.length ? <div className='space-y-3'>{series.map((row) => <div key={row.date} className='grid grid-cols-[86px_1fr_120px] items-center gap-3 text-sm'><span className='font-mono text-xs text-slate-500'>{String(row.date).slice(0, 10)}</span><div className='h-3 overflow-hidden rounded-full bg-slate-100'><div className='h-full rounded-full bg-[#2563EB]' style={{ width: barWidth(Number(row.revenue), maxSeriesRevenue) }} /></div><b className='text-right'>{money(row.revenue)}</b></div>)}</div> : <EmptyState text='Chưa có dữ liệu doanh thu theo ngày.' />}
        </Panel>

        <Panel title='Top gói theo doanh thu' description='Ưu tiên tối ưu các gói đang tạo doanh thu tốt.'>
          {packages.length ? <div className='space-y-4'>{packages.map((row, index) => <div key={row.id} className='rounded-2xl border border-slate-200 p-4'><div className='flex items-center justify-between gap-3'><div><p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>#{index + 1} · {row.loai_goi}</p><p className='mt-1 font-semibold text-slate-950'>{row.ten_goi}</p></div><b>{money(row.revenue)}</b></div><div className='mt-3 h-2 overflow-hidden rounded-full bg-slate-100'><div className='h-full rounded-full bg-[#F97316]' style={{ width: barWidth(Number(row.revenue), maxPackageRevenue) }} /></div></div>)}</div> : <EmptyState text='Chưa có doanh thu theo gói.' />}
        </Panel>

        <Panel title='Doanh thu theo chuyên gia' description='Dùng để so sánh chuyên gia nào tạo nhiều booking và doanh thu.'>
          {experts.length ? <div className='grid gap-3 md:grid-cols-2'>{experts.map((row) => <div key={row.expert_id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4'><p className='font-semibold'>{row.expert_name}</p><p className='mt-1 text-sm text-slate-500'>{row.completed_bookings} booking hoàn thành</p><div className='mt-4 flex items-end justify-between'><b className='text-lg text-[#2563EB]'>{money(row.revenue)}</b><span className='text-xs font-semibold text-[#F97316]'>HH {money(row.commission)}</span></div></div>)}</div> : <EmptyState text='Chưa có doanh thu theo chuyên gia.' />}
        </Panel>
      </div>
    </>
  )
}
