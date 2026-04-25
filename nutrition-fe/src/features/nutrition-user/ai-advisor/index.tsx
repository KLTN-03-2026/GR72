'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Bot,
  Calendar,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Info,
  LoaderCircle,
  RefreshCw,
  Salad,
  Scale,
  Utensils,
  X,
} from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import {
  applyRecommendation,
  getDailyMealPlanRecommendation,
  getHealthManagementRecommendation,
  getNextMealRecommendation,
  getNutritionRecommendation,
  type Recommendation,
} from '@/services/recommendations/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabData = {
  nextMeal: Recommendation | null
  dailyPlan: Recommendation | null
  nutrition: Recommendation | null
  health: Recommendation | null
}

type PreviewTarget = {
  rec: Recommendation
  title: string
  description: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function isMealRec(rec: Recommendation | null) {
  return (
    rec?.loai_khuyen_nghi === 'meal_next' ||
    rec?.loai_khuyen_nghi === 'meal_plan_daily'
  )
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} giờ trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// ─── Preview Modal ───────────────────────────────────────────────────────────

function PreviewModal({
  target,
  open,
  onClose,
  onApply,
  applying,
}: {
  target: PreviewTarget | null
  open: boolean
  onClose: () => void
  onApply: (rec: Recommendation) => void
  applying: boolean
}) {
  const rec = target?.rec ?? null
  const data = rec?.du_lieu_khuyen_nghi as Record<string, unknown> | null
  const chiTiet = Array.isArray(data?.chi_tiet)
    ? (data.chi_tiet as Record<string, unknown>[])
    : []
  const recipes = Array.isArray(data?.recipes)
    ? (data.recipes as Record<string, unknown>[])
    : []
  const foods = Array.isArray(data?.foods_uu_tien)
    ? (data.foods_uu_tien as Record<string, unknown>[])
    : []
  const limitFoods = Array.isArray(data?.foods_han_che)
    ? (data.foods_han_che as Record<string, unknown>[])
    : []
  const actions = Array.isArray(data?.actions)
    ? (data.actions as string[])
    : []
  const warnings = Array.isArray(data?.warnings)
    ? (data.warnings as string[])
    : []
  const calorieGap = data?.calorie_gap as number | null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-w-lg max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{target?.title ?? 'Chi tiết khuyến nghị'}</DialogTitle>
          <DialogDescription>{target?.description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-5'>
          {/* Lý giải */}
          {rec?.ly_giai && (
            <div className='rounded-lg border bg-muted/50 p-3'>
              <p className='text-sm leading-relaxed'>{rec.ly_giai}</p>
            </div>
          )}

          {/* Warnings */}
          {rec?.canh_bao && rec.canh_bao.length > 0 && (
            <div className='space-y-1.5'>
              <p className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600'>
                <AlertTriangle className='size-3.5' />
                Lưu ý
              </p>
              {rec.canh_bao.map((w) => (
                <div
                  key={w}
                  className='flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30'
                >
                  <AlertTriangle className='mt-0.5 size-3.5 shrink-0 text-amber-600' />
                  <p className='text-xs text-amber-700'>{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meal plan / Next meal items */}
          {(chiTiet.length > 0 || recipes.length > 0) && (
            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Danh sách món
              </p>
              <div className='space-y-1.5'>
                {(chiTiet.length > 0 ? chiTiet : recipes).map((item, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between rounded-lg border px-3 py-2.5'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium'>
                        {String(
                          item.ten_mon ?? item.ten ?? `Món ${i + 1}`,
                        )}
                      </p>
                      {(item.so_luong ?? item.sl ?? item.quantity) && (
                        <p className='text-xs text-muted-foreground'>
                          {String(
                            item.so_luong ?? item.sl ?? item.quantity ?? '',
                          )}{' '}
                          {String(item.don_vi ?? item.unit ?? '')}
                        </p>
                      )}
                    </div>
                    {item.calories != null && (
                      <p className='ml-3 shrink-0 text-sm font-semibold'>
                        {Number(item.calories).toFixed(0)} kcal
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Macro targets */}
          {rec?.muc_tieu_calories && (
            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Chỉ số mục tiêu
              </p>
              <div className='grid grid-cols-4 gap-2 rounded-lg border p-3 text-center text-xs'>
                {[
                  { label: 'Calories', value: `${rec.muc_tieu_calories}`, unit: 'kcal' },
                  rec.muc_tieu_protein_g && {
                    label: 'Protein',
                    value: `${rec.muc_tieu_protein_g}`,
                    unit: 'g',
                  },
                  rec.muc_tieu_carb_g && {
                    label: 'Carb',
                    value: `${rec.muc_tieu_carb_g}`,
                    unit: 'g',
                  },
                  rec.muc_tieu_fat_g && {
                    label: 'Fat',
                    value: `${rec.muc_tieu_fat_g}`,
                    unit: 'g',
                  },
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div key={item!.label}>
                      <p className='text-muted-foreground'>{item!.label}</p>
                      <p className='mt-0.5 font-bold'>{item!.value}</p>
                      <p className='text-muted-foreground'>{item!.unit}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Nutrition: calorie gap */}
          {calorieGap !== null && calorieGap !== undefined && (
            <div
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium',
                calorieGap > 200
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30'
                  : calorieGap < -200
                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30'
                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30',
              )}
            >
              Chênh lệch calories:{' '}
              {calorieGap > 0 ? `+${Math.round(calorieGap)} kcal` : `${Math.round(calorieGap)} kcal`}
            </div>
          )}

          {/* Nutrition: foods */}
          {(foods.length > 0 || limitFoods.length > 0) && (
            <div className='space-y-3'>
              {foods.length > 0 && (
                <div>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Nên ăn nhiều
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {foods.map((item, i) => (
                      <Badge key={i} variant='default' className='bg-green-600'>
                        {String(item.ten ?? item.name ?? '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {limitFoods.length > 0 && (
                <div>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Hạn chế
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {limitFoods.map((item, i) => (
                      <Badge key={i} variant='destructive'>
                        {String(item.ten ?? item.name ?? '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Health: actions */}
          {actions.length > 0 && (
            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Hành động gợi ý
              </p>
              {actions.map((action, i) => (
                <div
                  key={i}
                  className='flex items-start gap-3 rounded-lg border px-3 py-2.5'
                >
                  <div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-900'>
                    {i + 1}
                  </div>
                  <p className='text-sm'>{action}</p>
                </div>
              ))}
            </div>
          )}

          {/* Health: warnings */}
          {warnings.length > 0 && (
            <div className='space-y-1.5'>
              <p className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600'>
                <AlertTriangle className='size-3.5' />
                Cảnh báo
              </p>
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className='flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30'
                >
                  <AlertTriangle className='mt-0.5 size-3.5 shrink-0 text-amber-600' />
                  <p className='text-xs text-amber-700'>{w}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={onClose}>
            Đóng
          </Button>
          {isMealRec(rec) && rec?.trang_thai !== 'da_ap_dung' && (
            <Button
              onClick={() => rec && onApply(rec)}
              disabled={applying}
            >
              {applying ? (
                <>
                  <LoaderCircle className='mr-1.5 size-3.5 animate-spin' />
                  Đang áp dụng...
                </>
              ) : (
                <>
                  <CalendarCheck className='mr-1.5 size-3.5' />
                  Áp dụng vào kế hoạch ăn
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function NutritionUserAiAdvisor() {
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [data, setData] = useState<TabData>({
    nextMeal: null,
    dailyPlan: null,
    nutrition: null,
    health: null,
  })
  const [errorCount, setErrorCount] = useState(0)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        getNextMealRecommendation(),
        getDailyMealPlanRecommendation(),
        getNutritionRecommendation(),
        getHealthManagementRecommendation(),
      ])

      const [nextMeal, dailyPlan, nutrition, health] = results

      setData({
        nextMeal: nextMeal.status === 'fulfilled' ? nextMeal.value : null,
        dailyPlan: dailyPlan.status === 'fulfilled' ? dailyPlan.value : null,
        nutrition: nutrition.status === 'fulfilled' ? nutrition.value : null,
        health: health.status === 'fulfilled' ? health.value : null,
      })

      const rejected = results.filter((r) => r.status === 'rejected').length
      setErrorCount(rejected)

      if (rejected === results.length) {
        toast.error('Không tải được khuyến nghị. Vui lòng thử lại.')
      } else if (rejected > 0) {
        toast.warning(`${rejected} loại khuyến nghị chưa tải được.`)
      }
    } catch {
      toast.error('Lỗi khi tải khuyến nghị.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleApply(rec: Recommendation) {
    setApplyingId(rec.id)
    try {
      const result = await applyRecommendation(rec.id)
      setPreview(null)
      toast.success(
        result.ke_hoach_an
          ? `Đã tạo kế hoạch ăn "${result.ke_hoach_an.tieu_de}"`
          : 'Đã áp dụng khuyến nghị.',
      )
      await loadData()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Không áp dụng được khuyến nghị.')
    } finally {
      setApplyingId(null)
    }
  }

  const hasAnyData =
    data.nextMeal || data.dailyPlan || data.nutrition || data.health

  function openPreview(rec: Recommendation, title: string, description: string) {
    setPreview({ rec, title, description })
  }

  return (
    <>
      <PreviewModal
        target={preview}
        open={!!preview}
        onClose={() => setPreview(null)}
        onApply={handleApply}
        applying={applyingId === preview?.rec.id}
      />

      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Heading */}
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Khuyến nghị cá nhân
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Dựa trên hồ sơ, mục tiêu và nhật ký ăn uống của bạn.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw
              className={cn('mr-1.5 size-3.5', loading && 'animate-spin')}
            />
            Tải lại
          </Button>
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-2'>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className='h-5 w-40 rounded bg-muted animate-pulse' />
                    <div className='h-3 w-24 rounded bg-muted animate-pulse' />
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <div className='h-4 w-full rounded bg-muted animate-pulse' />
                    <div className='h-4 w-3/4 rounded bg-muted animate-pulse' />
                    <div className='h-10 w-full rounded bg-muted animate-pulse' />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : !hasAnyData ? (
          /* ── Empty ── */
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center gap-4 py-16 text-center'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                <Bot className='size-8 text-primary' />
              </div>
              <div>
                <p className='text-lg font-semibold'>Chưa có khuyến nghị nào</p>
                <p className='mt-2 max-w-sm text-sm text-muted-foreground'>
                  Cần hoàn thành ít nhất hồ sơ và mục tiêu sức khỏe để nhận
                  khuyến nghị tự động.
                </p>
              </div>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <Button variant='outline' asChild>
                  <Link href='/nutrition/profile'>
                    <ClipboardList className='mr-2 size-4' />
                    Điền hồ sơ
                  </Link>
                </Button>
                <Button onClick={() => void loadData()}>
                  <RefreshCw className='mr-2 size-4' />
                  Tải lại
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ── Has data ── */
          <>
            {/* 4-card grid */}
            <div className='grid gap-4 lg:grid-cols-2'>
              {/* Card 1: Thực đơn trong ngày */}
              <Card>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2.5'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
                        <CalendarCheck className='size-4 text-primary' />
                      </div>
                      <div>
                        <CardTitle className='text-base'>Thực đơn trong ngày</CardTitle>
                        <CardDescription>
                          {data.dailyPlan?.tao_luc
                            ? `Cập nhật ${formatTime(data.dailyPlan.tao_luc)}`
                            : 'Chưa có'}
                        </CardDescription>
                      </div>
                    </div>
                    {data.dailyPlan?.trang_thai === 'da_ap_dung' && (
                      <Badge variant='default' className='bg-green-600'>
                        Đã áp dụng
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {data.dailyPlan?.ly_giai && (
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {data.dailyPlan.ly_giai}
                    </p>
                  )}

                  {data.dailyPlan?.canh_bao &&
                    data.dailyPlan.canh_bao.length > 0 && (
                      <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'>
                        <AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-600' />
                        <div className='min-w-0'>
                          {data.dailyPlan.canh_bao.map((w) => (
                            <p key={w} className='text-xs text-amber-700'>
                              {w}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Preview items */}
                  {(() => {
                    const d =
                      data.dailyPlan?.du_lieu_khuyen_nghi as Record<
                        string,
                        unknown
                      > | null
                    const chiTiet = Array.isArray(d?.chi_tiet)
                      ? (d.chi_tiet as Record<string, unknown>[])
                      : []
                    if (chiTiet.length === 0) {
                      return (
                        <p className='text-sm text-muted-foreground'>
                          Chưa có danh sách món.
                        </p>
                      )
                    }
                    return (
                      <div className='space-y-1.5'>
                        {chiTiet.slice(0, 4).map((item, i) => (
                          <div
                            key={i}
                            className='flex items-center justify-between rounded-lg border px-3 py-2'
                          >
                            <p className='text-sm font-medium'>
                              {String(item.ten_mon ?? item.ten ?? `Món ${i + 1}`)}
                            </p>
                            {item.calories != null && (
                              <p className='text-sm font-semibold'>
                                {Number(item.calories).toFixed(0)} kcal
                              </p>
                            )}
                          </div>
                        ))}
                        {chiTiet.length > 4 && (
                          <p className='text-center text-xs text-muted-foreground'>
                            +{chiTiet.length - 4} món khác
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {data.dailyPlan?.muc_tieu_calories && (
                    <div className='grid grid-cols-4 gap-2 rounded-lg border p-2.5 text-center text-xs'>
                      <div>
                        <p className='text-muted-foreground'>Calories</p>
                        <p className='mt-0.5 font-bold'>
                          {data.dailyPlan.muc_tieu_calories}
                        </p>
                      </div>
                      {data.dailyPlan.muc_tieu_protein_g && (
                        <div>
                          <p className='text-muted-foreground'>Protein</p>
                          <p className='mt-0.5 font-bold'>
                            {data.dailyPlan.muc_tieu_protein_g}g
                          </p>
                        </div>
                      )}
                      {data.dailyPlan.muc_tieu_carb_g && (
                        <div>
                          <p className='text-muted-foreground'>Carb</p>
                          <p className='mt-0.5 font-bold'>
                            {data.dailyPlan.muc_tieu_carb_g}g
                          </p>
                        </div>
                      )}
                      {data.dailyPlan.muc_tieu_fat_g && (
                        <div>
                          <p className='text-muted-foreground'>Fat</p>
                          <p className='mt-0.5 font-bold'>
                            {data.dailyPlan.muc_tieu_fat_g}g
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={() =>
                        data.dailyPlan &&
                        openPreview(
                          data.dailyPlan,
                          'Thực đơn trong ngày',
                          'Xem chi tiết thực đơn trước khi áp dụng.',
                        )
                      }
                    >
                      Xem chi tiết
                    </Button>
                    {isMealRec(data.dailyPlan) &&
                      data.dailyPlan?.trang_thai !== 'da_ap_dung' && (
                        <Button
                          className='flex-1'
                          onClick={() =>
                            data.dailyPlan &&
                            handleApply(data.dailyPlan)
                          }
                          disabled={applyingId === data.dailyPlan.id}
                        >
                          {applyingId === data.dailyPlan.id ? (
                            <>
                              <LoaderCircle className='mr-1.5 size-3.5 animate-spin' />
                              Đang áp dụng...
                            </>
                          ) : (
                            <>
                              <CalendarCheck className='mr-1.5 size-3.5' />
                              Áp dụng
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Bữa ăn tiếp theo */}
              <Card>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2.5'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10'>
                        <Utensils className='size-4 text-amber-600' />
                      </div>
                      <div>
                        <CardTitle className='text-base'>Bữa ăn tiếp theo</CardTitle>
                        <CardDescription>
                          {data.nextMeal?.tao_luc
                            ? `Cập nhật ${formatTime(data.nextMeal.tao_luc)}`
                            : 'Chưa có'}
                        </CardDescription>
                      </div>
                    </div>
                    {data.nextMeal?.trang_thai === 'da_ap_dung' && (
                      <Badge variant='default' className='bg-green-600'>
                        Đã áp dụng
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {data.nextMeal?.ly_giai && (
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {data.nextMeal.ly_giai}
                    </p>
                  )}

                  {data.nextMeal?.canh_bao &&
                    data.nextMeal.canh_bao.length > 0 && (
                      <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'>
                        <AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-600' />
                        <div className='min-w-0'>
                          {data.nextMeal.canh_bao.map((w) => (
                            <p key={w} className='text-xs text-amber-700'>
                              {w}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                  {(() => {
                    const d =
                      data.nextMeal?.du_lieu_khuyen_nghi as Record<
                        string,
                        unknown
                      > | null
                    const recipes = Array.isArray(d?.recipes)
                      ? (d.recipes as Record<string, unknown>[])
                      : []
                    if (recipes.length === 0) {
                      return (
                        <p className='text-sm text-muted-foreground'>
                          Chưa có gợi ý nào.
                        </p>
                      )
                    }
                    return (
                      <div className='space-y-1.5'>
                        {recipes.slice(0, 3).map((item, i) => (
                          <div
                            key={i}
                            className='flex items-center justify-between rounded-lg border px-3 py-2'
                          >
                            <div>
                              <p className='text-sm font-medium'>
                                {String(item.ten ?? item.name ?? `Món ${i + 1}`)}
                              </p>
                              {item.calories != null && (
                                <p className='text-xs text-muted-foreground'>
                                  {Number(item.calories).toFixed(0)} kcal
                                </p>
                              )}
                            </div>
                            <div className='text-right text-xs text-muted-foreground'>
                              <p>
                                P {Number(item.protein_g ?? 0).toFixed(0)}g · C{' '}
                                {Number(item.carb_g ?? 0).toFixed(0)}g · F{' '}
                                {Number(item.fat_g ?? 0).toFixed(0)}g
                              </p>
                            </div>
                          </div>
                        ))}
                        {recipes.length > 3 && (
                          <p className='text-center text-xs text-muted-foreground'>
                            +{recipes.length - 3} món khác
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={() =>
                        data.nextMeal &&
                        openPreview(
                          data.nextMeal,
                          'Bữa ăn tiếp theo',
                          'Xem chi tiết bữa ăn được gợi ý.',
                        )
                      }
                    >
                      Xem chi tiết
                    </Button>
                    {isMealRec(data.nextMeal) &&
                      data.nextMeal?.trang_thai !== 'da_ap_dung' && (
                        <Button
                          className='flex-1'
                          onClick={() => data.nextMeal && handleApply(data.nextMeal)}
                          disabled={applyingId === data.nextMeal.id}
                        >
                          {applyingId === data.nextMeal.id ? (
                            <>
                              <LoaderCircle className='mr-1.5 size-3.5 animate-spin' />
                              Đang áp dụng...
                            </>
                          ) : (
                            <>
                              <CalendarCheck className='mr-1.5 size-3.5' />
                              Áp dụng
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Khuyến nghị dinh dưỡng */}
              <Card>
                <CardHeader className='pb-3'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10'>
                      <Salad className='size-4 text-green-600' />
                    </div>
                    <div>
                      <CardTitle className='text-base'>Khuyến nghị dinh dưỡng</CardTitle>
                      <CardDescription>
                        {data.nutrition?.tao_luc
                          ? `Cập nhật ${formatTime(data.nutrition.tao_luc)}`
                          : 'Chưa có'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {data.nutrition?.ly_giai && (
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {data.nutrition.ly_giai}
                    </p>
                  )}

                  {(() => {
                    const d =
                      data.nutrition?.du_lieu_khuyen_nghi as Record<
                        string,
                        unknown
                      > | null
                    const gap = d?.calorie_gap as number | null
                    if (gap !== null && gap !== undefined) {
                      return (
                        <div
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm font-medium',
                            gap > 200
                              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30'
                              : gap < -200
                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30'
                                : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30',
                          )}
                        >
                          Chênh lệch calories:{' '}
                          {gap > 0
                            ? `+${Math.round(gap)} kcal`
                            : `${Math.round(gap)} kcal`}
                        </div>
                      )
                    }
                    return null
                  })()}

                  {(() => {
                    const d =
                      data.nutrition?.du_lieu_khuyen_nghi as Record<
                        string,
                        unknown
                      > | null
                    const foods = Array.isArray(d?.foods_uu_tien)
                      ? (d.foods_uu_tien as Record<string, unknown>[])
                      : []
                    const limitFoods = Array.isArray(d?.foods_han_che)
                      ? (d.foods_han_che as Record<string, unknown>[])
                      : []
                    if (foods.length === 0 && limitFoods.length === 0) {
                      return (
                        <p className='text-sm text-muted-foreground'>
                          Cần nhật ký ăn uống để nhận gợi ý.
                        </p>
                      )
                    }
                    return (
                      <div className='space-y-3'>
                        {foods.length > 0 && (
                          <div>
                            <p className='mb-1.5 text-xs font-medium text-green-700 dark:text-green-400'>
                              Nên ăn nhiều
                            </p>
                            <div className='flex flex-wrap gap-1.5'>
                              {foods.slice(0, 6).map((item, i) => (
                                <Badge
                                  key={i}
                                  variant='default'
                                  className='bg-green-600 text-xs'
                                >
                                  {String(item.ten ?? item.name ?? '')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {limitFoods.length > 0 && (
                          <div>
                            <p className='mb-1.5 text-xs font-medium text-red-600'>
                              Hạn chế
                            </p>
                            <div className='flex flex-wrap gap-1.5'>
                              {limitFoods.slice(0, 6).map((item, i) => (
                                <Badge key={i} variant='destructive' className='text-xs'>
                                  {String(item.ten ?? item.name ?? '')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() =>
                      data.nutrition &&
                      openPreview(
                        data.nutrition,
                        'Khuyến nghị dinh dưỡng',
                        'Xem đầy đủ thông tin dinh dưỡng và chỉ số.',
                      )
                    }
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>

              {/* Card 4: Hành động sức khỏe */}
              <Card>
                <CardHeader className='pb-3'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10'>
                      <Activity className='size-4 text-blue-600' />
                    </div>
                    <div>
                      <CardTitle className='text-base'>Hành động sức khỏe</CardTitle>
                      <CardDescription>
                        {data.health?.tao_luc
                          ? `Cập nhật ${formatTime(data.health.tao_luc)}`
                          : 'Chưa có'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {data.health?.ly_giai && (
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {data.health.ly_giai}
                    </p>
                  )}

                  {(() => {
                    const d =
                      data.health?.du_lieu_khuyen_nghi as Record<string, unknown> | null
                    const actions = Array.isArray(d?.actions)
                      ? (d.actions as string[])
                      : []
                    if (actions.length === 0) {
                      return (
                        <p className='text-sm text-muted-foreground'>
                          Cần đủ dữ liệu để nhận hành động.
                        </p>
                      )
                    }
                    return (
                      <div className='space-y-2'>
                        {actions.slice(0, 3).map((action, i) => (
                          <div
                            key={i}
                            className='flex items-start gap-2.5 rounded-lg border px-3 py-2'
                          >
                            <div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-900'>
                              {i + 1}
                            </div>
                            <p className='text-sm'>{action}</p>
                          </div>
                        ))}
                        {actions.length > 3 && (
                          <p className='text-center text-xs text-muted-foreground'>
                            +{actions.length - 3} hành động khác
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() =>
                      data.health &&
                      openPreview(
                        data.health,
                        'Hành động sức khỏe',
                        'Xem đầy đủ hành động và cảnh báo.',
                      )
                    }
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick links + Info */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm'>Thao tác nhanh</CardTitle>
                </CardHeader>
                <CardContent className='grid gap-2 sm:grid-cols-2'>
                  {[
                    {
                      href: '/nutrition/meal-logs',
                      icon: Utensils,
                      label: 'Ghi bữa ăn',
                      sub: 'Nhật ký hôm nay',
                    },
                    {
                      href: '/nutrition/foods',
                      icon: Salad,
                      label: 'Tìm thực phẩm',
                      sub: 'Tra cứu dinh dưỡng',
                    },
                    {
                      href: '/nutrition/health-metrics',
                      icon: ClipboardList,
                      label: 'Cập nhật chỉ số',
                      sub: 'Cân nặng, huyết áp...',
                    },
                    {
                      href: '/nutrition/meal-plans',
                      icon: CalendarCheck,
                      label: 'Xem thực đơn',
                      sub: 'Kế hoạch ăn cá nhân',
                    },
                  ].map((link) => (
                    <Button
                      key={link.href}
                      variant='outline'
                      className='h-auto justify-start py-3'
                      asChild
                    >
                      <Link href={link.href}>
                        <link.icon className='mr-3 size-4 text-primary' />
                        <div className='text-left'>
                          <p className='text-sm font-medium'>{link.label}</p>
                          <p className='text-xs text-muted-foreground'>{link.sub}</p>
                        </div>
                        <ChevronRight className='ml-auto size-4 text-muted-foreground' />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className='border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'>
                <CardContent className='flex items-start gap-3 p-4'>
                  <Info className='mt-0.5 size-4 shrink-0 text-blue-600' />
                  <div className='min-w-0 text-sm text-blue-700 dark:text-blue-300'>
                    <p className='font-medium'>Module khuyến nghị tự động</p>
                    <p className='mt-1 text-xs'>
                      Các gợi ý trên được tạo tự động từ dữ liệu hồ sơ, mục
                      tiêu và nhật ký ăn uống theo rule/scoring. Mỗi thẻ có{' '}
                      <strong>nút Xem chi tiết</strong> để xem đầy đủ trước
                      khi áp dụng.{' '}
                      <Link
                        href='/nutrition/ai-chat'
                        className='underline underline-offset-2'
                      >
                        Chat AI real-time
                      </Link>{' '}
                      là chức năng riêng để trò chuyện tự do.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
