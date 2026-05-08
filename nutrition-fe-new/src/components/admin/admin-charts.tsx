'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot,
} from 'recharts'
import { money } from './admin-ui'

type ChartPoint = {
  label: string
  value: number
}

type ComparisonPoint = {
  label: string
  primary: number
  secondary?: number
}

function compactMoney(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(Math.round(n))
}

function safeMax(values: number[]) {
  return Math.max(...values, 1)
}

/* ─────────── Custom Tooltip ─────────── */
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0].value ?? 0)
  return (
    <div className='rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg'>
      <p className='text-xs font-mono font-semibold text-slate-500'>{label}</p>
      <p className='mt-0.5 text-base font-bold text-blue-700'>{money(value)}</p>
    </div>
  )
}

export function RevenueLineChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) return null

  // Quá ít điểm — show card thay vì chart
  if (points.length < 3) {
    return (
      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
        <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
          <div>
            <p className='text-sm font-semibold text-slate-950'>Doanh thu theo ngày</p>
            <p className='text-xs text-slate-500'>Quá ít điểm dữ liệu để vẽ biểu đồ xu hướng.</p>
          </div>
          <p className='font-mono text-xs font-semibold text-[#2563EB]'>{points.length} ngày</p>
        </div>
        <div className='grid gap-3 p-4 sm:grid-cols-2'>
          {points.map((p) => (
            <div key={p.label} className='rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{p.label}</p>
              <p className='mt-1.5 text-2xl font-bold text-blue-700'>{money(p.value)}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const data = points.map((p) => ({ ...p, label: p.label.length >= 10 ? p.label.slice(5) : p.label }))
  const values = points.map((p) => p.value)
  const max = safeMax(values)
  const total = values.reduce((s, v) => s + v, 0)
  const avg = total / values.length
  const peak = data.find((d) => d.value === max)

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-slate-950'>Xu hướng doanh thu</p>
          <p className='text-xs text-slate-500'>Theo ngày phát sinh thanh toán · {points.length} điểm</p>
        </div>
        <div className='flex items-center gap-4 text-xs'>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block h-2 w-2 rounded-full bg-blue-500' />
            <span className='text-slate-500'>Tổng:</span>
            <b className='text-slate-950'>{money(total)}</b>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block h-2 w-2 rounded-full bg-emerald-500' />
            <span className='text-slate-500'>TB/ngày:</span>
            <b className='text-emerald-700'>{money(avg)}</b>
          </div>
        </div>
      </div>
      <div className='p-2' style={{ height: 320 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={data} margin={{ top: 24, right: 24, bottom: 8, left: 8 }}>
            <defs>
              <linearGradient id='revenueGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#2563EB' stopOpacity={0.35} />
                <stop offset='100%' stopColor='#2563EB' stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke='#E2E8F0' strokeDasharray='4 4' vertical={false} />
            <XAxis
              dataKey='label'
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={compactMoney}
              width={60}
            />
            <Tooltip
              content={<RevenueTooltip />}
              cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine
              y={avg}
              stroke='#10B981'
              strokeDasharray='6 4'
              strokeWidth={1.5}
              label={{ value: `TB ${compactMoney(avg)}`, position: 'right', fill: '#059669', fontSize: 10, fontWeight: 600 }}
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke='#2563EB'
              strokeWidth={2.5}
              fill='url(#revenueGradient)'
              dot={{ fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 2, r: 4 }}
              activeDot={{ fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 3, r: 7 }}
            />
            {peak && (
              <ReferenceDot
                x={peak.label}
                y={peak.value}
                r={7}
                fill='#F59E0B'
                stroke='#FFFFFF'
                strokeWidth={3}
                label={{
                  value: `Đỉnh: ${compactMoney(peak.value)}`,
                  position: 'top',
                  fill: '#D97706',
                  fontSize: 11,
                  fontWeight: 700,
                  offset: 12,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function HorizontalBarChart({ points, accent = '#F97316' }: { points: ChartPoint[]; accent?: string }) {
  const max = safeMax(points.map((point) => point.value))

  return (
    <div className='space-y-3'>
      {points.map((point, index) => (
        <div key={point.label} className='grid grid-cols-[32px_minmax(120px,220px)_1fr_120px] items-center gap-3 text-sm'>
          <span className='font-mono text-xs font-semibold text-slate-400'>#{index + 1}</span>
          <span className='truncate font-semibold text-slate-700'>{point.label}</span>
          <div className='h-4 overflow-hidden rounded-full bg-slate-100'>
            <div className='h-full rounded-full' style={{ width: `${Math.max(4, (point.value / max) * 100)}%`, backgroundColor: accent }} />
          </div>
          <b className='text-right'>{money(point.value)}</b>
        </div>
      ))}
    </div>
  )
}

export function ExpertComparisonChart({ points }: { points: ComparisonPoint[] }) {
  const max = safeMax(points.flatMap((point) => [point.primary, point.secondary ?? 0]))

  return (
    <div className='space-y-4'>
      {points.map((point) => (
        <div key={point.label} className='rounded-2xl border border-slate-200 bg-white p-4'>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <p className='truncate font-semibold text-slate-950'>{point.label}</p>
            <p className='font-mono text-xs text-slate-500'>{money(point.primary)}</p>
          </div>
          <div className='space-y-2'>
            <div className='h-3 overflow-hidden rounded-full bg-blue-50'>
              <div className='h-full rounded-full bg-[#2563EB]' style={{ width: `${Math.max(4, (point.primary / max) * 100)}%` }} />
            </div>
            {point.secondary != null ? (
              <div className='h-2 overflow-hidden rounded-full bg-orange-50'>
                <div className='h-full rounded-full bg-[#F97316]' style={{ width: `${Math.max(4, (point.secondary / max) * 100)}%` }} />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
