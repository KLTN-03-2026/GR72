import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: string
  hint: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='gap-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-1'>
        <p className='text-3xl font-semibold tracking-tight'>{value}</p>
        <p className='text-sm text-muted-foreground'>{hint}</p>
      </CardContent>
    </Card>
  )
}
