'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, LoaderCircle, RefreshCw } from 'lucide-react'
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
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import {
  getMealLogs,
  getNutritionSummary,
  MEAL_TYPE_LABELS,
  type MealLogDetail,
  type MealLogItem,
} from '@/services/meals/api'

type MealSection = {
  key: keyof typeof MEAL_TYPE_LABELS
  label: string
  hint: string
  entries: MealLogItem[]
}

function toISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function inferDetailName(detail: MealLogDetail & { du_lieu_chup_lai?: Record<string, unknown> }) {
  const snap = detail.du_lieu_chup_lai
  const snapName = snap && typeof snap.ten === 'string' ? snap.ten : null
  if (snapName) return snapName
  if (detail.cong_thuc_id) return `Công thức #${detail.cong_thuc_id}`
  if (detail.thuc_pham_id) return `Thực phẩm #${detail.thuc_pham_id}`
  return 'Món ăn'
}

export function NutritionUserMealLogs() {
  const [selectedDate, setSelectedDate] = useState(toISODate())
  const [loading, setLoading] = useState(true)
  const [mealLogs, setMealLogs] = useState<MealLogItem[]>([])
  const [historyLogs, setHistoryLogs] = useState<MealLogItem[]>([])
  const [summary, setSummary] = useState<{
    tong_calories: number
    tong_protein_g: number
    tong_carb_g: number
    tong_fat_g: number
    so_bua_da_ghi: number
  } | null>(null)

  const mealSections = useMemo<MealSection[]>(
    () => [
      {
        key: 'bua_sang',
        label: MEAL_TYPE_LABELS.bua_sang,
        hint: 'Khởi động ngày mới',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_sang'),
      },
      {
        key: 'bua_trua',
        label: MEAL_TYPE_LABELS.bua_trua,
        hint: 'Giữ năng lượng làm việc',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_trua'),
      },
      {
        key: 'bua_toi',
        label: MEAL_TYPE_LABELS.bua_toi,
        hint: 'Ăn đủ và nhẹ nhàng',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_toi'),
      },
      {
        key: 'bua_phu',
        label: MEAL_TYPE_LABELS.bua_phu,
        hint: 'Kiểm soát cơn đói',
        entries: mealLogs.filter((log) => log.loai_bua_an === 'bua_phu'),
      },
    ],
    [mealLogs],
  )

  async function loadData(date = selectedDate) {
    setLoading(true)
    try {
      const [logRes, summaryRes, historyRes] = await Promise.all([
        getMealLogs({ date, page: 1, limit: 20 }),
        getNutritionSummary({ date }),
        getMealLogs({ page: 1, limit: 100 }),
      ])

      setMealLogs(logRes.data.items)
      setHistoryLogs(historyRes.data.items)

      const summaryData = summaryRes.data
      if (summaryData && 'tong_calories' in summaryData) {
        setSummary({
          tong_calories: Number(summaryData.tong_calories ?? 0),
          tong_protein_g: Number(summaryData.tong_protein_g ?? 0),
          tong_carb_g: Number(summaryData.tong_carb_g ?? 0),
          tong_fat_g: Number(summaryData.tong_fat_g ?? 0),
          so_bua_da_ghi: Number(summaryData.so_bua_da_ghi ?? 0),
        })
      } else {
        setSummary(null)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Không tải được dữ liệu nhật ký ăn uống.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Nhật ký ăn uống'
          description='Theo dõi bữa ăn theo ngày và tổng hợp dinh dưỡng từ dữ liệu thực.'
        />

        <div className='flex flex-wrap items-center gap-3'>
          <input
            type='date'
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className='h-9 rounded-md border border-input bg-background px-3 text-sm'
          />
          <Button
            variant='outline'
            size='sm'
            onClick={() => void loadData(selectedDate)}
            disabled={loading}
          >
            <RefreshCw className='mr-1.5 size-4' />
            Làm mới
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href='/nutrition/foods'>Tìm thực phẩm để log</Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href='/nutrition/meal-plans'>Ghi nhận từ kế hoạch ăn</Link>
          </Button>
        </div>

        {loading && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <LoaderCircle className='size-4 animate-spin' />
            Đang tải nhật ký ăn uống...
          </div>
        )}

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            label='Calories'
            value={`${summary?.tong_calories ?? 0} kcal`}
          />
          <StatCard
            label='Protein'
            value={`${summary?.tong_protein_g ?? 0} g`}
          />
          <StatCard label='Carb' value={`${summary?.tong_carb_g ?? 0} g`} />
          <StatCard label='Fat' value={`${summary?.tong_fat_g ?? 0} g`} />
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
          <div className='grid gap-4'>
            {mealSections.map((section) => (
              <Card key={section.key}>
                <CardHeader className='pb-4'>
                  <CardTitle>{section.label}</CardTitle>
                  <CardDescription>{section.hint}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {section.entries.length > 0 ? (
                    section.entries.map((entry) => (
                      <div key={entry.id} className='rounded-xl border p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='font-medium'>Log #{entry.id}</p>
                          <Badge variant='secondary'>
                            {entry.chi_tiet.reduce(
                              (sum, detail) => sum + Number(detail.calories ?? 0),
                              0,
                            ).toFixed(0)}{' '}
                            kcal
                          </Badge>
                        </div>
                        <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
                          {entry.chi_tiet.map((detail) => (
                            <p key={detail.id}>
                              {inferDetailName(
                                detail as MealLogDetail & {
                                  du_lieu_chup_lai?: Record<string, unknown>
                                },
                              )}{' '}
                              · {detail.so_luong} {detail.don_vi}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
                      Chưa có dữ liệu cho {section.label.toLowerCase()}.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CalendarDays className='size-5 text-primary' />
                  Tổng kết ngày {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('vi-VN')}
                </CardTitle>
                <CardDescription>
                  {summary?.so_bua_da_ghi ?? 0} bữa đã ghi nhận.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <MacroProgress
                  label='Protein'
                  current={summary?.tong_protein_g ?? 0}
                  target={120}
                  tone='emerald'
                />
                <MacroProgress
                  label='Carb'
                  current={summary?.tong_carb_g ?? 0}
                  target={180}
                />
                <MacroProgress
                  label='Fat'
                  current={summary?.tong_fat_g ?? 0}
                  target={55}
                  tone='amber'
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử bữa ăn</CardTitle>
            <CardDescription>
              Dữ liệu lấy trực tiếp từ API nhật ký ăn uống.
            </CardDescription>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Bữa</TableHead>
                  <TableHead>Số món</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Macro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='h-20 text-center text-muted-foreground'
                    >
                      Chưa có nhật ký ăn uống.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyLogs.map((log) => {
                    const calories = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.calories ?? 0),
                      0,
                    )
                    const protein = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.protein_g ?? 0),
                      0,
                    )
                    const carb = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.carb_g ?? 0),
                      0,
                    )
                    const fat = log.chi_tiet.reduce(
                      (sum, item) => sum + Number(item.fat_g ?? 0),
                      0,
                    )
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(`${log.ngay_ghi}T00:00:00`).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {MEAL_TYPE_LABELS[log.loai_bua_an]}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.chi_tiet.length}</TableCell>
                        <TableCell>{calories.toFixed(0)} kcal</TableCell>
                        <TableCell className='text-muted-foreground'>
                          P {protein.toFixed(1)} / C {carb.toFixed(1)} / F{' '}
                          {fat.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
