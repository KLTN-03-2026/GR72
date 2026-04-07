'use client'

import { useMemo } from 'react'
import { Clock3, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { todaySummary as fallbackSummary } from '@/features/nutrition/data/mock-data'
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import { calculateTodaySummary } from '@/features/nutrition/utils'
import { useNutritionStore } from '@/stores/nutrition-store'
import type { MealLogRecord } from '@/features/nutrition/types'

type QuickMealPreset = Omit<MealLogRecord, 'id' | 'date' | 'mealType'>

export function NutritionUserMealLogs() {
  const mealLogs = useNutritionStore((state) => state.mealLogs)
  const addMealLog = useNutritionStore((state) => state.addMealLog)
  const summary = calculateTodaySummary(mealLogs, fallbackSummary)
  const latestDate = mealLogs[0]?.date ?? new Intl.DateTimeFormat('vi-VN').format(new Date())
  const mealSections = useMemo(
    () =>
      [
        { key: 'Bữa sáng', hint: 'Khởi động ngày mới' },
        { key: 'Bữa trưa', hint: 'Giữ năng lượng làm việc' },
        { key: 'Bữa tối', hint: 'Ăn đủ nhưng không quá muộn' },
        { key: 'Bữa phụ', hint: 'Kiểm soát cơn đói cuối ngày' },
      ].map((section) => ({
        ...section,
        entries: mealLogs.filter(
          (log) => log.date === latestDate && log.mealType === section.key
        ),
      })),
    [latestDate, mealLogs]
  )

  function handleQuickAdd(mealType: string) {
    const presets: Record<string, QuickMealPreset> = {
      'Bữa sáng': {
        items: 'Overnight oats, sữa chua Hy Lạp',
        calories: 380,
        protein: 24,
        carbs: 45,
        fat: 11,
      },
      'Bữa trưa': {
        items: 'Ức gà áp chảo, cơm gạo lứt, bông cải xanh',
        calories: 560,
        protein: 44,
        carbs: 47,
        fat: 14,
      },
      'Bữa tối': {
        items: 'Salad cá hồi, súp bí đỏ',
        calories: 520,
        protein: 36,
        carbs: 28,
        fat: 24,
      },
      'Bữa phụ': {
        items: 'Chuối, hạt hạnh nhân',
        calories: 180,
        protein: 5,
        carbs: 22,
        fat: 8,
      },
    }
    const preset = presets[mealType]

    if (!preset) {
      toast.error('Không tìm thấy mẫu bữa ăn để thêm nhanh.')
      return
    }

    addMealLog({
      id: `LOG-${Date.now()}`,
      date: latestDate,
      mealType,
      ...preset,
    })
    toast.success(`Đã thêm nhanh ${mealType.toLowerCase()}.`)
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Nhật ký ăn uống'
          description='Theo dõi các bữa đã ăn và so sánh macro với mục tiêu hằng ngày.'
          actions={[{ label: 'Log bữa ăn mới' }, { label: 'Sao chép hôm qua' }]}
        />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard label='Calories' value={`${summary.calories} kcal`} hint='Đã nạp trong ngày' />
          <StatCard label='Protein' value={`${summary.protein} g`} hint='Nguồn đạm hôm nay' />
          <StatCard label='Carbs' value={`${summary.carbs} g`} hint='Tinh bột hôm nay' />
          <StatCard label='Fat' value={`${summary.fat} g`} hint='Chất béo hôm nay' />
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
          <div className='grid gap-4'>
            {mealSections.map((section) => (
              <Card key={section.key}>
                <CardHeader className='pb-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <CardTitle>{section.key}</CardTitle>
                      <CardDescription>{section.hint}</CardDescription>
                    </div>
                    <Button size='sm' variant='outline' onClick={() => handleQuickAdd(section.key)}>
                      <Plus className='mr-2 size-4' />
                      Thêm món
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {section.entries.length ? (
                    section.entries.map((entry) => (
                      <div key={entry.id} className='rounded-xl border p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='font-medium'>{entry.items}</p>
                          <Badge variant='secondary'>{entry.calories} kcal</Badge>
                        </div>
                        <p className='mt-2 text-sm text-muted-foreground'>
                          P {entry.protein}g / C {entry.carbs}g / F {entry.fat}g
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className='rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
                      Chưa có món nào được log cho {section.key.toLowerCase()}.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Tổng kết ngày {latestDate}</CardTitle>
                <CardDescription>
                  So sánh lượng nạp trong ngày với mục tiêu hiện tại.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <MacroProgress label='Protein' current={summary.protein} target={120} tone='emerald' />
                <MacroProgress label='Carb' current={summary.carbs} target={180} />
                <MacroProgress label='Fat' current={summary.fat} target={55} tone='amber' />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock3 className='size-5 text-primary' />
                  Gợi ý thêm nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <QuickAdd
                  title='Sữa chua Hy Lạp + chuối'
                  description='Bữa phụ 180 kcal, thêm 12g protein.'
                  onAdd={() => handleQuickAdd('Bữa phụ')}
                />
                <QuickAdd
                  title='Ức gà + cơm gạo lứt'
                  description='Bữa trưa chuẩn hóa, dễ log lại nhiều lần.'
                  onAdd={() => handleQuickAdd('Bữa trưa')}
                />
                <QuickAdd
                  title='Overnight oats'
                  description='Phù hợp nếu cần chuẩn bị sẵn cho sáng mai.'
                  onAdd={() => handleQuickAdd('Bữa sáng')}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử bữa ăn</CardTitle>
            <CardDescription>
              Mỗi bữa được lưu độc lập để giữ lịch sử calories và macro chính xác.
            </CardDescription>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Bữa</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Macro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{log.mealType}</Badge>
                    </TableCell>
                    <TableCell>{log.items}</TableCell>
                    <TableCell>{log.calories}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      P {log.protein} / C {log.carbs} / F {log.fat}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

function QuickAdd({
  title,
  description,
  onAdd,
}: {
  title: string
  description: string
  onAdd: () => void
}) {
  return (
    <div className='rounded-xl border p-4'>
      <p className='font-medium'>{title}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      <Button className='mt-3 px-0' variant='link' onClick={onAdd}>
        Thêm vào nhật ký
      </Button>
    </div>
  )
}
