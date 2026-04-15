'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  Flag,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { StatCard } from '@/features/nutrition/components/stat-card'
import {
  getGoals,
  getCurrentGoal,
  createGoal,
  updateGoal,
  type GoalApiResponse,
} from '@/services/goals/api'

// ============================================
// Helpers
// ============================================
type GoalType = 'Giảm cân' | 'Tăng cân' | 'Duy trì'
type ApiGoalType = 'giam_can' | 'tang_can' | 'giu_can'
type ApiGoalStatus = 'dang_ap_dung' | 'luu_tru' | 'hoan_thanh'

const GOAL_TYPE_LABELS: Record<ApiGoalType, GoalType> = {
  giam_can: 'Giảm cân',
  tang_can: 'Tăng cân',
  giu_can: 'Duy trì',
}

const GOAL_TYPE_API: Record<GoalType, ApiGoalType> = {
  'Giảm cân': 'giam_can',
  'Tăng cân': 'tang_can',
  'Duy trì': 'giu_can',
}

const STATUS_LABELS: Record<ApiGoalStatus, string> = {
  dang_ap_dung: 'Đang áp dụng',
  luu_tru: 'Lưu trữ',
  hoan_thanh: 'Hoàn tất',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function calcDaysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function calcDaysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null
  const ms = new Date(targetDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function calcWeightDelta(
  start: number | null,
  target: number | null
): { value: number; label: string } | null {
  if (start == null || target == null) return null
  const delta = target - start
  return {
    value: delta,
    label: delta < 0 ? `Giảm ${Math.abs(delta).toFixed(1)}kg` :
           delta > 0 ? `Tăng ${delta.toFixed(1)}kg` : 'Duy trì',
  }
}

function mapApiToForm(goal: GoalApiResponse | null) {
  if (!goal) {
    return {
      loaiMucTieu: 'Giảm cân' as GoalType,
      canNangBatDauKg: '',
      canNangMucTieuKg: '',
      mucTieuCaloriesNgay: '',
      mucTieuProteinG: '',
      mucTieuCarbG: '',
      mucTieuFatG: '',
      ngayBatDau: new Date().toISOString().slice(0, 10),
      ngayMucTieu: '',
    }
  }
  return {
    loaiMucTieu: GOAL_TYPE_LABELS[goal.loai_muc_tieu] ?? 'Duy trì',
    canNangBatDauKg:
      goal.can_nang_bat_dau_kg != null ? String(goal.can_nang_bat_dau_kg) : '',
    canNangMucTieuKg:
      goal.can_nang_muc_tieu_kg != null ? String(goal.can_nang_muc_tieu_kg) : '',
    mucTieuCaloriesNgay:
      goal.muc_tieu_calories_ngay != null
        ? String(goal.muc_tieu_calories_ngay)
        : '',
    mucTieuProteinG:
      goal.muc_tieu_protein_g != null ? String(goal.muc_tieu_protein_g) : '',
    mucTieuCarbG:
      goal.muc_tieu_carb_g != null ? String(goal.muc_tieu_carb_g) : '',
    mucTieuFatG:
      goal.muc_tieu_fat_g != null ? String(goal.muc_tieu_fat_g) : '',
    ngayBatDau: goal.ngay_bat_dau ?? new Date().toISOString().slice(0, 10),
    ngayMucTieu: goal.ngay_muc_tieu ?? '',
  }
}

type FormData = ReturnType<typeof mapApiToForm>

// ============================================
// Sub-components
// ============================================
function GoalTypeBadge({ type }: { type: GoalType }) {
  const configs: Record<GoalType, { label: string; cls: string; Icon: typeof TrendingDown }> = {
    'Giảm cân': { label: 'Giảm cân', cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300', Icon: TrendingDown },
    'Tăng cân': { label: 'Tăng cân', cls: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300', Icon: TrendingUp },
    'Duy trì': { label: 'Duy trì', cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300', Icon: Minus },
  }
  const cfg = configs[type]
  return (
    <Badge className={cfg.cls}>
      <cfg.Icon className='mr-1 size-3' />
      {cfg.label}
    </Badge>
  )
}

function GoalTypeSelect({
  value,
  onChange,
}: {
  value: GoalType
  onChange: (v: GoalType) => void
}) {
  return (
    <div className='space-y-1.5'>
      <Label>Loại mục tiêu</Label>
      <div className='flex gap-2'>
        {(['Giảm cân', 'Tăng cân', 'Duy trì'] as GoalType[]).map((opt) => {
          const active = value === opt
          return (
            <button
              key={opt}
              type='button'
              onClick={() => onChange(opt)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {opt === 'Giảm cân' && <TrendingDown className='size-3.5' />}
              {opt === 'Tăng cân' && <TrendingUp className='size-3.5' />}
              {opt === 'Duy trì' && <Minus className='size-3.5' />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  min,
  step = '0.1',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: typeof CalendarClock
  type?: string
  placeholder?: string
  min?: number
  step?: string
}) {
  return (
    <div className='space-y-1.5'>
      <Label>{label}</Label>
      <div className='relative'>
        {Icon && (
          <Icon className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        )}
        <Input
          className={Icon ? 'pl-9' : ''}
          value={value}
          type={type}
          step={step}
          min={min}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function MacroCard({
  label,
  value,
  icon: Icon,
  tone,
  unit = 'g',
}: {
  label: string
  value: string
  icon: typeof Zap
  tone: 'blue' | 'amber' | 'green'
  unit?: string
}) {
  const toneMap = {
    blue: { icon: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600' },
    amber: { icon: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600' },
    green: { icon: 'text-green-500 bg-green-50 dark:bg-green-950/30', text: 'text-green-600' },
  }
  const cls = toneMap[tone]
  return (
    <div className='flex items-center gap-3 rounded-xl border p-4'>
      <div className={`rounded-lg p-2 ${cls.icon}`}>
        <Icon className='size-4' />
      </div>
      <div className='min-w-0'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className={`text-lg font-bold ${cls.text}`}>
          {value || '—'}
          <span className='ml-1 text-sm font-normal text-muted-foreground'>{unit}</span>
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    'Đang áp dụng': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300',
    'Lưu trữ': 'bg-neutral-200 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400',
    'Hoàn tất': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300',
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${variants[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  )
}

function HistoryRow({ goal }: { goal: GoalApiResponse }) {
  const delta = calcWeightDelta(goal.can_nang_bat_dau_kg, goal.can_nang_muc_tieu_kg)
  const daysTotal = calcDaysBetween(goal.ngay_bat_dau, goal.ngay_muc_tieu)
  const daysRemaining = calcDaysRemaining(goal.ngay_muc_tieu)
  const progress = daysTotal && daysRemaining != null
    ? Math.max(0, Math.min(100, Math.round(((daysTotal - daysRemaining) / daysTotal) * 100)))
    : null

  return (
    <div className='rounded-xl border p-4'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <GoalTypeBadge type={GOAL_TYPE_LABELS[goal.loai_muc_tieu] ?? 'Duy trì'} />
            {delta && (
              <span className='text-sm font-medium'>{delta.label}</span>
            )}
          </div>
          <p className='mt-1.5 text-sm text-muted-foreground'>
            {goal.ngay_bat_dau ? `${formatDate(goal.ngay_bat_dau)} → ${formatDate(goal.ngay_muc_tieu)}` : '—'}
          </p>
          {daysTotal != null && (
            <p className='mt-0.5 text-xs text-muted-foreground'>
              {daysRemaining === 0 ? `Đến hạn hôm nay` :
               daysRemaining != null ? `${daysRemaining} ngày còn lại · ${daysTotal} ngày` :
               `${daysTotal} ngày`}
            </p>
          )}
        </div>
        <div className='flex flex-col items-end gap-1'>
          <StatusBadge status={goal.trang_thai ? STATUS_LABELS[goal.trang_thai] ?? goal.trang_thai : '—'} />
          {progress != null && (
            <div className='flex items-center gap-1.5'>
              <div className='h-1.5 w-16 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className='text-xs text-muted-foreground'>{progress}%</span>
            </div>
          )}
          <p className='text-xs text-muted-foreground'>
            {formatDateTime(goal.cap_nhat_luc)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================
export function NutritionUserGoals() {
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  const [allGoals, setAllGoals] = useState<GoalApiResponse[]>([])
  const [currentGoal, setCurrentGoal] = useState<GoalApiResponse | null>(null)
  const [formData, setFormData] = useState<FormData>(mapApiToForm(null))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getGoals(), getCurrentGoal()])
      .then(([goalsData, current]) => {
        setAllGoals(goalsData.items)
        setCurrentGoal(current)
        setFormData(mapApiToForm(current))
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Không thể tải mục tiêu')
        toast.error('Không thể tải dữ liệu mục tiêu')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSaveGoal = useCallback(async () => {
    if (
      Number(formData.canNangBatDauKg) <= 0 ||
      Number(formData.canNangMucTieuKg) <= 0
    ) {
      toast.error('Cân nặng bắt đầu và mục tiêu phải lớn hơn 0.')
      return
    }
    if (!formData.ngayMucTieu.trim()) {
      toast.error('Vui lòng nhập ngày dự kiến đạt mục tiêu.')
      return
    }
    setIsSaving(true)
    try {
      if (currentGoal) {
        const updated = await updateGoal(currentGoal.id, {
          loaiMucTieu: GOAL_TYPE_API[formData.loaiMucTieu],
          canNangBatDauKg: Number(formData.canNangBatDauKg),
          canNangMucTieuKg: Number(formData.canNangMucTieuKg),
          mucTieuCaloriesNgay: formData.mucTieuCaloriesNgay
            ? Number(formData.mucTieuCaloriesNgay)
            : undefined,
          mucTieuProteinG: formData.mucTieuProteinG
            ? Number(formData.mucTieuProteinG)
            : undefined,
          mucTieuCarbG: formData.mucTieuCarbG
            ? Number(formData.mucTieuCarbG)
            : undefined,
          mucTieuFatG: formData.mucTieuFatG
            ? Number(formData.mucTieuFatG)
            : undefined,
          ngayBatDau: formData.ngayBatDau,
          ngayMucTieu: formData.ngayMucTieu,
        })
        setCurrentGoal(updated)
        setFormData(mapApiToForm(updated))
        toast.success('Cập nhật mục tiêu thành công.')
      } else {
        const created = await createGoal({
          loaiMucTieu: GOAL_TYPE_API[formData.loaiMucTieu],
          canNangBatDauKg: Number(formData.canNangBatDauKg),
          canNangMucTieuKg: Number(formData.canNangMucTieuKg),
          mucTieuCaloriesNgay: formData.mucTieuCaloriesNgay
            ? Number(formData.mucTieuCaloriesNgay)
            : undefined,
          mucTieuProteinG: formData.mucTieuProteinG
            ? Number(formData.mucTieuProteinG)
            : undefined,
          mucTieuCarbG: formData.mucTieuCarbG
            ? Number(formData.mucTieuCarbG)
            : undefined,
          mucTieuFatG: formData.mucTieuFatG
            ? Number(formData.mucTieuFatG)
            : undefined,
          ngayBatDau: formData.ngayBatDau,
          ngayMucTieu: formData.ngayMucTieu,
        })
        setCurrentGoal(created)
        const refreshed = await getGoals()
        setAllGoals(refreshed.items)
        setFormData(mapApiToForm(created))
        toast.success('Tạo mục tiêu thành công.')
      }
      if (isOnboarding) {
        window.location.href = '/nutrition/dashboard'
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu mục tiêu thất bại')
    } finally {
      setIsSaving(false)
    }
  }, [formData, currentGoal, isOnboarding])

  const handleCreateNew = useCallback(async () => {
    if (
      Number(formData.canNangBatDauKg) <= 0 ||
      Number(formData.canNangMucTieuKg) <= 0
    ) {
      toast.error('Cân nặng bắt đầu và mục tiêu phải lớn hơn 0.')
      return
    }
    if (!formData.ngayMucTieu.trim()) {
      toast.error('Vui lòng nhập ngày dự kiến đạt mục tiêu.')
      return
    }
    setIsSaving(true)
    try {
      const created = await createGoal({
        loaiMucTieu: GOAL_TYPE_API[formData.loaiMucTieu],
        canNangBatDauKg: Number(formData.canNangBatDauKg),
        canNangMucTieuKg: Number(formData.canNangMucTieuKg),
        mucTieuCaloriesNgay: formData.mucTieuCaloriesNgay
          ? Number(formData.mucTieuCaloriesNgay)
          : undefined,
        mucTieuProteinG: formData.mucTieuProteinG
          ? Number(formData.mucTieuProteinG)
          : undefined,
        mucTieuCarbG: formData.mucTieuCarbG
          ? Number(formData.mucTieuCarbG)
          : undefined,
        mucTieuFatG: formData.mucTieuFatG
          ? Number(formData.mucTieuFatG)
          : undefined,
        ngayBatDau: formData.ngayBatDau,
        ngayMucTieu: formData.ngayMucTieu,
      })
      setCurrentGoal(created)
      const refreshed = await getGoals()
      setAllGoals(refreshed.items)
      setFormData(mapApiToForm(created))
      toast.success('Đã tạo mục tiêu mới. Mục tiêu cũ được lưu trữ.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo mục tiêu thất bại')
    } finally {
      setIsSaving(false)
    }
  }, [formData])

  // Derived values
  const startKg = Number(formData.canNangBatDauKg) || 0
  const targetKg = Number(formData.canNangMucTieuKg) || 0
  const calories = Number(formData.mucTieuCaloriesNgay) || 0
  const protein = Number(formData.mucTieuProteinG) || 0
  const carb = Number(formData.mucTieuCarbG) || 0
  const fat = Number(formData.mucTieuFatG) || 0
  const delta = calcWeightDelta(
    startKg || null,
    targetKg || null
  )
  const daysTotal = calcDaysBetween(formData.ngayBatDau || null, formData.ngayMucTieu || null)
  const daysRemaining = calcDaysRemaining(formData.ngayMucTieu || null)
  const daysElapsed = daysTotal != null && daysRemaining != null
    ? daysTotal - daysRemaining
    : null
  const progress = daysTotal && daysRemaining != null
    ? Math.max(0, Math.min(100, Math.round(((daysTotal - daysRemaining) / daysTotal) * 100)))
    : null

  const historyRows = allGoals.slice(0, 5)

  // ============================================
  // Loading / Error
  // ============================================
  if (isLoading) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 items-center justify-center'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </Main>
      </>
    )
  }

  if (loadError && !currentGoal) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 items-center justify-center'>
          <Card className='max-w-md'>
            <CardContent className='pt-6 text-center'>
              <p className='text-destructive'>{loadError}</p>
              <Button className='mt-4' onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </Main>
      </>
    )
  }

  // ============================================
  // Render
  // ============================================
  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Onboarding banner */}
        {isOnboarding && (
          <div className='rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm'>
            Thiết lập mục tiêu sức khỏe giúp hệ thống tính calories và macro phù hợp cho bạn.
            Sau khi lưu, bạn sẽ được chuyển đến dashboard.
          </div>
        )}
        <PageHeading
          title='Mục tiêu sức khỏe'
          description='Thiết lập cân nặng đích, ngân sách calories và macro để theo dõi dinh dưỡng hằng ngày.'
        />

        {/* ============================================
            SECTION 1: Goal Hero — visual weight journey
            ============================================ */}
        <Card className='overflow-hidden'>
          <div className='bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-6'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
              {/* Left: type + weight journey */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <GoalTypeBadge type={formData.loaiMucTieu} />
                  {currentGoal && (
                    <span className='text-xs text-muted-foreground'>
                      Đang áp dụng
                    </span>
                  )}
                </div>

                {/* Weight journey */}
                <div className='flex items-center gap-3'>
                  <div className='text-center'>
                    <p className='text-3xl font-bold'>
                      {startKg > 0 ? `${startKg}` : '—'}
                    </p>
                    <p className='text-xs text-muted-foreground'>kg bắt đầu</p>
                  </div>
                  <div className='flex flex-col items-center'>
                    <div className='flex h-10 w-px bg-border' />
                    {delta && (
                      <span className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${
                        delta.value < 0 ? 'text-blue-600' :
                        delta.value > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {delta.value < 0 ? <ArrowDown className='size-3' /> :
                         delta.value > 0 ? <ArrowUp className='size-3' /> :
                         <Minus className='size-3' />}
                        {Math.abs(delta.value).toFixed(1)}kg
                      </span>
                    )}
                    <div className='mt-1 h-10 w-px bg-border' />
                  </div>
                  <div className='text-center'>
                    <p className='text-3xl font-bold'>
                      {targetKg > 0 ? `${targetKg}` : '—'}
                    </p>
                    <p className='text-xs text-muted-foreground'>kg mục tiêu</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <CalendarDays className='size-3.5' />
                  {formData.ngayMucTieu ? (
                    <span>
                      {formatDate(formData.ngayBatDau || null)} →{' '}
                      {formatDate(formData.ngayMucTieu)}
                      {daysRemaining != null && daysRemaining > 0 && (
                        <> · <strong className='text-foreground'>{daysRemaining}</strong> ngày còn lại</>
                      )}
                      {daysRemaining === 0 && ' · Đến hạn hôm nay'}
                    </span>
                  ) : (
                    'Chưa đặt ngày đích'
                  )}
                </div>

                {/* Progress bar */}
                {progress != null && (
                  <div className='flex items-center gap-2'>
                    <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full rounded-full bg-primary transition-all'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className='text-xs font-medium text-muted-foreground'>{progress}%</span>
                  </div>
                )}
              </div>

              {/* Right: quick stat pills */}
              <div className='flex flex-wrap gap-2'>
                {calories > 0 && (
                  <div className='rounded-lg border bg-background/80 px-3 py-2 text-center backdrop-blur-sm'>
                    <p className='text-xs text-muted-foreground'>Calories / ngày</p>
                    <p className='mt-0.5 text-base font-semibold'>{calories} kcal</p>
                  </div>
                )}
                {daysElapsed != null && (
                  <div className='rounded-lg border bg-background/80 px-3 py-2 text-center backdrop-blur-sm'>
                    <p className='text-xs text-muted-foreground'>Đã theo dõi</p>
                    <p className='mt-0.5 text-base font-semibold'>{daysElapsed} ngày</p>
                  </div>
                )}
                {delta && daysTotal != null && daysTotal > 0 && (
                  <div className='rounded-lg border bg-background/80 px-3 py-2 text-center backdrop-blur-sm'>
                    <p className='text-xs text-muted-foreground'>Tốc độ</p>
                    <p className='mt-0.5 text-base font-semibold'>
                      {(Math.abs(delta.value) / daysTotal * 30).toFixed(1)}kg/tháng
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ============================================
            SECTION 2: Form + Sidebar
            ============================================ */}
        <div className='grid gap-6 xl:grid-cols-[1fr_340px]'>
          {/* ---- Form ---- */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Flag className='size-4 text-primary' />
                {currentGoal ? 'Cập nhật mục tiêu' : 'Tạo mục tiêu mới'}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Row 1: goal type + target date */}
              <div className='grid gap-4 md:grid-cols-2'>
                <GoalTypeSelect
                  value={formData.loaiMucTieu}
                  onChange={(v) => setFormData((c) => ({ ...c, loaiMucTieu: v }))}
                />
                <FieldInput
                  label='Ngày dự kiến đạt mục tiêu'
                  value={formData.ngayMucTieu}
                  icon={CalendarClock}
                  type='date'
                  onChange={(v) => setFormData((c) => ({ ...c, ngayMucTieu: v }))}
                />
              </div>

              {/* Row 2: weight fields */}
              <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
                <FieldInput
                  label='Cân nặng bắt đầu (kg)'
                  value={formData.canNangBatDauKg}
                  type='number'
                  placeholder='VD: 70'
                  onChange={(v) => setFormData((c) => ({ ...c, canNangBatDauKg: v }))}
                />
                <FieldInput
                  label='Cân nặng mục tiêu (kg)'
                  value={formData.canNangMucTieuKg}
                  type='number'
                  placeholder='VD: 65'
                  onChange={(v) => setFormData((c) => ({ ...c, canNangMucTieuKg: v }))}
                />
                <FieldInput
                  label='Ngày bắt đầu'
                  value={formData.ngayBatDau}
                  icon={CalendarClock}
                  type='date'
                  step={undefined}
                  onChange={(v) => setFormData((c) => ({ ...c, ngayBatDau: v }))}
                />
              </div>

              {/* Row 3: calories */}
              <FieldInput
                label='Ngân sách calories / ngày (kcal)'
                value={formData.mucTieuCaloriesNgay}
                icon={Flame}
                type='number'
                placeholder='VD: 1800'
                step={undefined}
                onChange={(v) => setFormData((c) => ({ ...c, mucTieuCaloriesNgay: v }))}
              />

              {/* Row 4: macro targets */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Macro mục tiêu / ngày</Label>
                <div className='grid gap-3 sm:grid-cols-3'>
                  <FieldInput
                    label='Protein (g)'
                    value={formData.mucTieuProteinG}
                    type='number'
                    placeholder='VD: 120'
                    onChange={(v) => setFormData((c) => ({ ...c, mucTieuProteinG: v }))}
                  />
                  <FieldInput
                    label='Carbohydrate (g)'
                    value={formData.mucTieuCarbG}
                    type='number'
                    placeholder='VD: 200'
                    onChange={(v) => setFormData((c) => ({ ...c, mucTieuCarbG: v }))}
                  />
                  <FieldInput
                    label='Chất béo (g)'
                    value={formData.mucTieuFatG}
                    type='number'
                    placeholder='VD: 60'
                    onChange={(v) => setFormData((c) => ({ ...c, mucTieuFatG: v }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-wrap items-center gap-3 border-t pt-5'>
                <Button onClick={handleSaveGoal} disabled={isSaving}>
                  {isSaving && <Loader2 className='mr-2 size-4 animate-spin' />}
                  {isSaving ? 'Đang lưu...' : currentGoal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
                </Button>
                {currentGoal && (
                  <Button variant='outline' onClick={handleCreateNew} disabled={isSaving}>
                    Tạo mục tiêu mới
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---- Sidebar ---- */}
          <div className='space-y-5'>
            {/* Macro targets */}
            {(protein > 0 || carb > 0 || fat > 0 || calories > 0) ? (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Macro mục tiêu</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {calories > 0 && (
                    <MacroCard label='Calories / ngày' value={`${calories}`} icon={Flame} tone='blue' unit='kcal' />
                  )}
                  {protein > 0 && (
                    <MacroCard label='Protein / ngày' value={`${protein}`} icon={Zap} tone='green' />
                  )}
                  {carb > 0 && (
                    <MacroCard label='Carb / ngày' value={`${carb}`} icon={Flame} tone='amber' />
                  )}
                  {fat > 0 && (
                    <MacroCard label='Chất béo / ngày' value={`${fat}`} icon={Zap} tone='blue' />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Macro mục tiêu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Chưa có dữ liệu. Nhập calories và macro bên cạnh để xem tại đây.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick overview stats */}
            <div className='grid grid-cols-2 gap-3'>
              <StatCard
                label='Cân nặng mục tiêu'
                value={targetKg > 0 ? `${targetKg} kg` : '—'}
                tone={delta && delta.value < 0 ? 'blue' : delta && delta.value > 0 ? 'amber' : 'default'}
              />
              <StatCard
                label='Calories / ngày'
                value={calories > 0 ? `${calories}` : '—'}
                sub={calories > 0 ? 'kcal' : undefined}
                tone='red'
              />
            </div>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  Lịch sử mục tiêu
                  {historyRows.length > 0 && (
                    <span className='rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground'>
                      {historyRows.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {historyRows.length === 0 ? (
                  <div className='flex flex-col items-center gap-2 py-4 text-center'>
                    <Circle className='size-8 text-muted-foreground/40' />
                    <p className='text-sm text-muted-foreground'>
                      Chưa có mục tiêu nào. Tạo mục tiêu đầu tiên bên cạnh.
                    </p>
                  </div>
                ) : (
                  historyRows.map((goal) => (
                    <HistoryRow key={goal.id} goal={goal} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
