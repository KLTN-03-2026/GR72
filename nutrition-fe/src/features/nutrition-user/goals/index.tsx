'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Flag, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import { useNutritionStore } from '@/stores/nutrition-store'

type GoalType = 'Giảm cân' | 'Tăng cân' | 'Duy trì'

export function NutritionUserGoals() {
  const goal = useNutritionStore((state) => state.goal)
  const updateGoal = useNutritionStore((state) => state.updateGoal)
  const healthMetrics = useNutritionStore((state) => state.healthMetrics)
  const latestWeight = healthMetrics[0]?.weightKg ?? goal.startWeight
  const [formData, setFormData] = useState({
    type: goal.type,
    startWeight: String(goal.startWeight),
    targetWeight: String(goal.targetWeight),
    targetDate: goal.targetDate,
    calories: String(goal.dailyTargets.calories),
    protein: String(goal.dailyTargets.protein),
    carbs: String(goal.dailyTargets.carbs),
    fat: String(goal.dailyTargets.fat),
  })

  const projectedGoal = useMemo(
    () => ({
      type: formData.type as typeof goal.type,
      startWeight: Number(formData.startWeight) || 0,
      targetWeight: Number(formData.targetWeight) || 0,
      targetDate: formData.targetDate,
      dailyTargets: {
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fat: Number(formData.fat) || 0,
      },
    }),
    [formData]
  )

  function handleSaveGoal() {
    if (projectedGoal.targetWeight <= 0 || projectedGoal.startWeight <= 0) {
      toast.error('Cân nặng bắt đầu và mục tiêu phải lớn hơn 0.')
      return
    }

    if (!projectedGoal.targetDate.trim()) {
      toast.error('Vui lòng nhập ngày dự kiến đạt mục tiêu.')
      return
    }

    updateGoal({
      ...goal,
      type: projectedGoal.type,
      startWeight: projectedGoal.startWeight,
      targetWeight: projectedGoal.targetWeight,
      targetDate: projectedGoal.targetDate,
      dailyTargets: projectedGoal.dailyTargets,
    })
    toast.success('Đã cập nhật mục tiêu sức khỏe.')
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Mục tiêu sức khỏe'
          description='Theo dõi mục tiêu hiện tại, cân nặng đích và ngân sách calories mỗi ngày.'
          actions={[{ label: 'Tạo goal mới' }, { label: 'Lưu mục tiêu' }]}
        />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            label='Goal'
            value={projectedGoal.type}
            hint='Trạng thái hiện tại của kế hoạch sức khỏe'
          />
          <StatCard
            label='Cân nặng bắt đầu'
            value={`${projectedGoal.startWeight} kg`}
            hint='Mốc khi bắt đầu chu kỳ theo dõi'
          />
          <StatCard
            label='Cân nặng mục tiêu'
            value={`${projectedGoal.targetWeight} kg`}
            hint={`Kế hoạch hoàn thành trước ${projectedGoal.targetDate}`}
          />
          <StatCard
            label='Calories mục tiêu'
            value={`${projectedGoal.dailyTargets.calories} kcal`}
            hint='Ngân sách calories mỗi ngày'
          />
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Flag className='size-5 text-primary' />
                Form mục tiêu hiện tại
              </CardTitle>
              <CardDescription>
                Điều chỉnh calories và macro mục tiêu để đồng bộ với meal log và dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <GoalInput
                  label='Loại mục tiêu'
                  value={formData.type}
                  options={['Giảm cân', 'Tăng cân', 'Duy trì']}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, type: value as GoalType }))
                  }
                />
                <GoalInput
                  label='Ngày dự kiến đạt'
                  value={formData.targetDate}
                  icon={CalendarClock}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, targetDate: value }))
                  }
                />
                <GoalInput
                  label='Cân nặng bắt đầu'
                  value={formData.startWeight}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, startWeight: value }))
                  }
                />
                <GoalInput
                  label='Cân nặng mục tiêu'
                  value={formData.targetWeight}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, targetWeight: value }))
                  }
                />
                <GoalInput
                  label='Calories mục tiêu'
                  value={formData.calories}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, calories: value }))
                  }
                />
                <GoalInput label='Chu kỳ hiện tại' value='12 tuần' readOnly />
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <MacroField
                  label='Protein mục tiêu'
                  value={formData.protein}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, protein: value }))
                  }
                />
                <MacroField
                  label='Carb mục tiêu'
                  value={formData.carbs}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, carbs: value }))
                  }
                />
                <MacroField
                  label='Fat mục tiêu'
                  value={formData.fat}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, fat: value }))
                  }
                />
              </div>

              <div className='flex flex-wrap gap-3'>
                <Button onClick={handleSaveGoal}>Lưu mục tiêu</Button>
                <Button variant='outline' onClick={() => toast.success('Đã tạo một bản goal mới.')}>
                  Lưu thành bản mới
                </Button>
                <Button variant='outline' onClick={() => toast.success('Đã đánh dấu goal hoàn thành.')}>
                  Đánh dấu hoàn thành
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='size-5 text-primary' />
                  Macro target hằng ngày
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <MacroProgress
                  label='Protein'
                  current={projectedGoal.dailyTargets.protein}
                  target={projectedGoal.dailyTargets.protein}
                  tone='emerald'
                />
                <MacroProgress
                  label='Carb'
                  current={projectedGoal.dailyTargets.carbs}
                  target={projectedGoal.dailyTargets.carbs}
                />
                <MacroProgress
                  label='Fat'
                  current={projectedGoal.dailyTargets.fat}
                  target={projectedGoal.dailyTargets.fat}
                  tone='amber'
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lịch sử mục tiêu</CardTitle>
                <CardDescription>
                  Các đợt mục tiêu gần đây để đối chiếu tiến độ.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <HistoryRow
                  title={`${projectedGoal.type} ${projectedGoal.startWeight}kg xuống ${projectedGoal.targetWeight}kg`}
                  period={`Hiện tại • cân nặng mới nhất ${latestWeight}kg`}
                  status='Đang áp dụng'
                />
                <HistoryRow title='Duy trì sau Tết' period='Tháng 2/2026' status='Hoàn tất' />
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

function GoalInput({
  label,
  value,
  onChange,
  icon: Icon,
  readOnly = false,
  options,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  icon?: typeof CalendarClock
  readOnly?: boolean
  options?: string[]
}) {
  if (options?.length) {
    return (
      <div className='space-y-2'>
        <Label>{label}</Label>
        <select
          value={value}
          disabled={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='relative'>
        {Icon ? <Icon className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' /> : null}
        <Input
          className={Icon ? 'pl-9' : undefined}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </div>
    </div>
  )
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function HistoryRow({
  title,
  period,
  status,
}: {
  title: string
  period: string
  status: string
}) {
  return (
    <div className='rounded-xl border p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='font-medium'>{title}</p>
          <p className='mt-1 text-sm text-muted-foreground'>{period}</p>
        </div>
        <Button size='sm' variant='outline'>
          {status}
        </Button>
      </div>
    </div>
  )
}
