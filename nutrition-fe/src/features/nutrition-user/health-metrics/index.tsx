'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Main } from '@/components/layout/main'
import { HealthTrendChart } from '@/features/nutrition/components/health-trend-chart'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { buildHealthMetricFromInput, calculateHealthTrend } from '@/features/nutrition/utils'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionUserHealthMetrics() {
  const metrics = useNutritionStore((state) => state.healthMetrics)
  const profile = useNutritionStore((state) => state.profile)
  const addHealthMetric = useNutritionStore((state) => state.addHealthMetric)
  const trend = calculateHealthTrend(metrics)
  const [formData, setFormData] = useState({
    measuredAt: '2026-03-23T07:30',
    weightKg: String(metrics[0]?.weightKg ?? profile.currentWeightKg),
    heightCm: String(profile.heightCm),
    waistCm: '73',
    hipCm: '95',
    bloodGlucose: '5.4',
    note: metrics[0]?.note ?? '',
  })

  function handleSaveMetric() {
    if (!formData.measuredAt) {
      toast.error('Vui lòng chọn thời điểm đo.')
      return
    }

    if (Number(formData.weightKg) <= 0 || Number(formData.heightCm) <= 0) {
      toast.error('Cân nặng và chiều cao phải lớn hơn 0.')
      return
    }

    addHealthMetric(
      buildHealthMetricFromInput({
        measuredAt: formData.measuredAt.replace('T', ' '),
        weightKg: Number(formData.weightKg),
        heightCm: Number(formData.heightCm),
        waistCm: Number(formData.waistCm),
        hipCm: Number(formData.hipCm),
        bloodGlucose: Number(formData.bloodGlucose),
        note: formData.note,
        birthDate: profile.birthDate,
        gender: profile.gender,
        activityLevel: profile.activityLevel,
      })
    )
    toast.success('Đã lưu lần đo mới.')
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Chỉ số sức khỏe'
          description='Nhập và theo dõi các chỉ số cơ thể theo thời gian để hệ thống đánh giá đúng tiến độ.'
          actions={[{ label: 'Thêm chỉ số mới' }, { label: 'Lưu lần đo' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Nhập lần đo mới</CardTitle>
              <CardDescription>
                Các dữ liệu này sẽ được dùng để tạo snapshot BMI, BMR và TDEE.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-1'>
                <MetricField label='Thời điểm đo'>
                  <Input
                    value={formData.measuredAt}
                    type='datetime-local'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, measuredAt: event.target.value }))
                    }
                  />
                </MetricField>
                <MetricField label='Cân nặng (kg)'>
                  <Input
                    value={formData.weightKg}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, weightKg: event.target.value }))
                    }
                  />
                </MetricField>
                <MetricField label='Chiều cao (cm)'>
                  <Input
                    value={formData.heightCm}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, heightCm: event.target.value }))
                    }
                  />
                </MetricField>
                <MetricField label='Vòng eo (cm)'>
                  <Input
                    value={formData.waistCm}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, waistCm: event.target.value }))
                    }
                  />
                </MetricField>
                <MetricField label='Vòng mông (cm)'>
                  <Input
                    value={formData.hipCm}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, hipCm: event.target.value }))
                    }
                  />
                </MetricField>
                <MetricField label='Đường huyết'>
                  <Input
                    value={formData.bloodGlucose}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        bloodGlucose: event.target.value,
                      }))
                    }
                  />
                </MetricField>
              </div>
              <MetricField label='Ghi chú'>
                <Textarea
                  value={formData.note}
                  rows={4}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, note: event.target.value }))
                  }
                />
              </MetricField>
              <div className='flex flex-wrap gap-3'>
                <Button onClick={handleSaveMetric}>Lưu lần đo</Button>
                <Button
                  variant='outline'
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      note: '',
                    }))
                  }
                >
                  Xóa form
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <HealthTrendChart data={trend} />

            <Card>
              <CardHeader>
                <CardTitle>Đánh giá gần nhất</CardTitle>
                <CardDescription>
                  Snapshot đánh giá được giữ lại để đối chiếu theo thời gian.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 md:grid-cols-3'>
                <MetricSummary
                  label='BMI'
                  value={String(metrics[0]?.bmi ?? '-')}
                  hint='Cận trên bình thường'
                />
                <MetricSummary
                  label='BMR'
                  value={String(metrics[0]?.bmr ?? '-')}
                  hint='Năng lượng cơ bản'
                />
                <MetricSummary
                  label='TDEE'
                  value={String(metrics[0]?.tdee ?? '-')}
                  hint='Ngân sách tiêu hao mỗi ngày'
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử đo gần đây</CardTitle>
            <CardDescription>
              Snapshot được giữ lại để so sánh sức khỏe ở từng mốc thời gian.
            </CardDescription>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời điểm đo</TableHead>
                  <TableHead>Cân nặng</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>BMR</TableHead>
                  <TableHead>TDEE</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.measuredAt}>
                    <TableCell>{metric.measuredAt}</TableCell>
                    <TableCell>{metric.weightKg} kg</TableCell>
                    <TableCell>{metric.bmi}</TableCell>
                    <TableCell>{metric.bmr}</TableCell>
                    <TableCell>{metric.tdee}</TableCell>
                    <TableCell className='text-muted-foreground'>{metric.note}</TableCell>
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

function MetricField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function MetricSummary({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className='rounded-xl border p-4'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='mt-2 text-2xl font-semibold'>{value}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{hint}</p>
    </div>
  )
}
