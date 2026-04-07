'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type MacroIntakeChartProps = {
  current: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  target: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export function MacroIntakeChart({
  current,
  target,
}: MacroIntakeChartProps) {
  const data = [
    { name: 'Calories', current: current.calories, target: target.calories },
    { name: 'Protein', current: current.protein, target: target.protein },
    { name: 'Carb', current: current.carbs, target: target.carbs },
    { name: 'Fat', current: current.fat, target: target.fat },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cân đối dinh dưỡng trong ngày</CardTitle>
        <CardDescription>
          So sánh mức đã nạp với mục tiêu hiện tại của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent className='h-[320px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={data} barGap={10}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis dataKey='name' tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <Tooltip />
            <Legend />
            <Bar dataKey='current' name='Đã nạp' radius={[6, 6, 0, 0]} fill='hsl(var(--primary))' />
            <Bar dataKey='target' name='Mục tiêu' radius={[6, 6, 0, 0]} fill='hsl(var(--muted-foreground))' />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
