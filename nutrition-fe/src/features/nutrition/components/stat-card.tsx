import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'green' | 'amber' | 'red' | 'blue'
}

const toneClassMap: Record<string, string> = {
  default: '',
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
}

export function StatCard({ label, value, sub, tone = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-1'>
        <p className={cn('text-3xl font-bold tracking-tight', toneClassMap[tone])}>{value}</p>
        {sub && <p className='text-sm text-muted-foreground'>{sub}</p>}
      </CardContent>
    </Card>
  )
}