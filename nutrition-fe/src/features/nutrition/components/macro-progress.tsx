import { cn } from '@/lib/utils'

type MacroProgressProps = {
  label: string
  current: number
  target: number
  unit?: string
  tone?: 'primary' | 'emerald' | 'amber'
}

const toneClassMap = {
  primary: 'bg-primary',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
}

export function MacroProgress({
  label,
  current,
  target,
  unit = 'g',
  tone = 'primary',
}: MacroProgressProps) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <p className='font-medium'>{label}</p>
        <p className='text-muted-foreground'>
          {current}
          {unit} / {target}
          {unit}
        </p>
      </div>
      <div className='h-2 rounded-full bg-muted'>
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            toneClassMap[tone]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className='text-xs text-muted-foreground'>
        Hoàn thành {Math.round(percent)}% mục tiêu
      </p>
    </div>
  )
}
