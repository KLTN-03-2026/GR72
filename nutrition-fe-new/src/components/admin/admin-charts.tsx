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

function safeMax(values: number[]) {
  return Math.max(...values, 1)
}

export function RevenueLineChart({ points }: { points: ChartPoint[] }) {
  const width = 720
  const height = 260
  const padding = 36
  const max = safeMax(points.map((point) => point.value))
  const hasSinglePoint = points.length === 1
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = hasSinglePoint ? width / 2 : padding + index * step
    const y = height - padding - (point.value / max) * (height - padding * 2)
    return { ...point, x, y }
  })
  const path = hasSinglePoint && coords[0]
    ? `M ${padding} ${coords[0].y} L ${width - padding} ${coords[0].y}`
    : coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const area = hasSinglePoint && coords[0]
    ? `M ${padding} ${coords[0].y} L ${width - padding} ${coords[0].y} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`
    : `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
      <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-slate-950'>Xu hướng doanh thu</p>
          <p className='text-xs text-slate-500'>Theo ngày phát sinh thanh toán</p>
        </div>
        <p className='font-mono text-xs font-semibold text-[#2563EB]'>{points.length} điểm dữ liệu</p>
      </div>
      <div className='overflow-x-auto p-4'>
        <svg viewBox={`0 0 ${width} ${height}`} className='min-w-[680px]'>
          {[0, 1, 2, 3].map((line) => {
            const y = padding + ((height - padding * 2) / 3) * line
            return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke='#E2E8F0' strokeDasharray='4 6' />
          })}
          <path d={area} fill='url(#revenueArea)' />
          <path d={path} fill='none' stroke='#2563EB' strokeWidth='4' strokeLinecap='round' strokeLinejoin='round' />
          {coords.map((point) => (
            <g key={`${point.label}-${point.value}`}>
              <circle cx={point.x} cy={point.y} r='5' fill='#FFFFFF' stroke='#2563EB' strokeWidth='3' />
              <title>{point.label}: {money(point.value)}</title>
            </g>
          ))}
          {coords.map((point, index) => index % Math.ceil(points.length / 6 || 1) === 0 ? (
            <text key={point.label} x={point.x} y={height - 10} textAnchor='middle' className='fill-slate-500 text-[11px] font-mono'>
              {point.label.slice(5)}
            </text>
          ) : null)}
          <defs>
            <linearGradient id='revenueArea' x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' stopColor='#2563EB' stopOpacity='0.22' />
              <stop offset='100%' stopColor='#2563EB' stopOpacity='0.02' />
            </linearGradient>
          </defs>
        </svg>
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
