'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthTrendPoint } from '@/features/nutrition/types'

type HealthTrendChartProps = {
  data: HealthTrendPoint[]
}

export function HealthTrendChart({ data }: HealthTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu đồ cân nặng 7 ngày</CardTitle>
        <CardDescription>
          Theo dõi xu hướng giảm cân và chỉ số BMI gần đây.
        </CardDescription>
      </CardHeader>
      <CardContent className='h-[320px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='date' tickLine={false} axisLine={false} />
            <YAxis yAxisId='left' tickLine={false} axisLine={false} width={36} />
            <YAxis yAxisId='right' orientation='right' tickLine={false} axisLine={false} width={36} />
            <Tooltip />
            <Legend />
            <Area
              yAxisId='left'
              type='monotone'
              dataKey='weight'
              name='Cân nặng'
              stroke='hsl(var(--primary))'
              strokeWidth={3}
              fill='hsl(var(--primary) / 0.16)'
            />
            <Area
              yAxisId='right'
              type='monotone'
              dataKey='bmi'
              name='BMI'
              stroke='hsl(var(--chart-2, 200 90% 45%))'
              strokeWidth={2}
              fill='hsl(var(--chart-2, 200 90% 45%) / 0.1)'
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
