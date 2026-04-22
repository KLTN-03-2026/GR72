'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Copy, LoaderCircle, Sparkles } from 'lucide-react'
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
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  copyMealPlanFromTemplate,
  getPublishedMealTemplates,
  getUserMealPlanDetail,
  getUserMealPlans,
  type UserMealPlan,
  type UserMealPlanDetail,
  type UserPublishedMealTemplate,
} from '@/services/content/api'
import { getCurrentGoal, type GoalApiResponse } from '@/services/goals/api'

const MEAL_TYPE_LABELS: Record<string, string> = {
  bua_sang: 'Bữa sáng',
  bua_trua: 'Bữa trưa',
  bua_toi: 'Bữa tối',
  bua_phu: 'Bữa phụ',
}

function formatPlanStatus(status: string) {
  switch (status) {
    case 'ban_nhap':
      return 'Bản nháp'
    case 'dang_ap_dung':
      return 'Đang áp dụng'
    case 'hoan_thanh':
      return 'Hoàn thành'
    case 'luu_tru':
      return 'Lưu trữ'
    default:
      return status
  }
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'dang_ap_dung') return 'default'
  if (status === 'hoan_thanh') return 'secondary'
  return 'outline'
}

export function NutritionUserMealPlans() {
  const [goal, setGoal] = useState<GoalApiResponse | null>(null)
  const [plans, setPlans] = useState<UserMealPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<UserMealPlanDetail | null>(null)
  const [templates, setTemplates] = useState<UserPublishedMealTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [copying, setCopying] = useState(false)

  const selectedTemplate = useMemo(
    () =>
      templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )

  async function loadPlans() {
    const response = await getUserMealPlans({ page: 1, limit: 50 })
    setPlans(response.items)
    if (response.items.length > 0 && !selectedPlanId) {
      setSelectedPlanId(response.items[0].id)
    }
    if (response.items.length === 0) {
      setSelectedPlanId(null)
      setSelectedPlanDetail(null)
    }
  }

  async function loadPlanDetail(id: number) {
    setLoadingDetail(true)
    try {
      const detail = await getUserMealPlanDetail(id)
      setSelectedPlanDetail(detail)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Không tải được chi tiết kế hoạch ăn.',
      )
      setSelectedPlanDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [templatesResponse, currentGoal] = await Promise.all([
          getPublishedMealTemplates({ page: 1, limit: 20 }),
          getCurrentGoal(),
        ])
        setTemplates(templatesResponse.items)
        setSelectedTemplateId(templatesResponse.items[0]?.id ?? null)
        setGoal(currentGoal)
        await loadPlans()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Không tải được dữ liệu thực đơn cá nhân.',
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedPlanId) return
    void loadPlanDetail(selectedPlanId)
  }, [selectedPlanId])

  async function handleCopyTemplate() {
    if (!selectedTemplate) {
      toast.error('Chưa có template để sao chép.')
      return
    }

    setCopying(true)
    try {
      const copied = await copyMealPlanFromTemplate(selectedTemplate.id)
      toast.success('Đã copy từ thực đơn mẫu.')
      await loadPlans()
      setSelectedPlanId(copied.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể copy thực đơn mẫu.',
      )
    } finally {
      setCopying(false)
    }
  }

  const groupedDetails = useMemo(() => {
    if (!selectedPlanDetail) return []
    const groups = new Map<string, UserMealPlanDetail['chi_tiet']>()
    selectedPlanDetail.chi_tiet.forEach((item) => {
      const key = item.loai_bua_an
      const current = groups.get(key) ?? []
      current.push(item)
      groups.set(key, current)
    })

    return Array.from(groups.entries()).map(([mealType, items]) => ({
      mealType,
      label: MEAL_TYPE_LABELS[mealType] ?? mealType,
      items,
    }))
  }, [selectedPlanDetail])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thực đơn cá nhân'
          description='Quản lý kế hoạch ăn uống từ dữ liệu API thật và đồng bộ với khuyến nghị.'
        />

        <div className='grid gap-6 xl:grid-cols-[0.85fr_1.15fr]'>
          <div className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' onClick={() => void loadPlans()} disabled={loading}>
                {loading ? (
                  <LoaderCircle className='mr-2 size-4 animate-spin' />
                ) : null}
                Làm mới kế hoạch
              </Button>
              <Button onClick={() => void handleCopyTemplate()} disabled={copying}>
                {copying ? (
                  <LoaderCircle className='mr-2 size-4 animate-spin' />
                ) : (
                  <Copy className='mr-2 size-4' />
                )}
                Copy template đã publish
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Thực đơn mẫu đã publish</CardTitle>
                <CardDescription>
                  Chọn một template để copy thành kế hoạch ăn cá nhân.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {templates.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Chưa có thực đơn mẫu nào được publish.
                  </p>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      type='button'
                      onClick={() => setSelectedTemplateId(template.id)}
                      className='w-full rounded-xl border p-3 text-left transition hover:border-primary/40'
                    >
                      <p className='font-medium'>{template.tieu_de}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {template.mo_ta ?? 'Không có mô tả'}
                      </p>
                      <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                        <Badge
                          variant={
                            selectedTemplate?.id === template.id
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {template.loai_muc_tieu_phu_hop ?? 'Tong hop'}
                        </Badge>
                        <span>
                          {template.calories_muc_tieu
                            ? `${template.calories_muc_tieu} kcal`
                            : 'Chưa có calories mục tiêu'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Kế hoạch đã tạo</CardTitle>
                <CardDescription>
                  Danh sách kế hoạch ăn lấy trực tiếp từ API.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {plans.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Bạn chưa có kế hoạch ăn nào. Hãy copy từ template hoặc áp dụng khuyến nghị.
                  </p>
                ) : (
                  plans.map((plan) => (
                    <button
                      key={plan.id}
                      type='button'
                      onClick={() => setSelectedPlanId(plan.id)}
                      className='w-full text-left'
                    >
                      <Card
                        className={
                          plan.id === selectedPlanId ? 'border-primary/40 shadow-sm' : ''
                        }
                      >
                        <CardHeader>
                          <div className='flex items-start justify-between gap-4'>
                            <div>
                              <CardTitle className='text-lg'>{plan.tieu_de}</CardTitle>
                              <CardDescription>
                                Áp dụng cho{' '}
                                {new Date(`${plan.ngay_ap_dung}T00:00:00`).toLocaleDateString(
                                  'vi-VN',
                                )}
                              </CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(plan.trang_thai)}>
                              {formatPlanStatus(plan.trang_thai)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className='text-sm text-muted-foreground'>
                          {plan.tong_calories ?? 0} kcal
                        </CardContent>
                      </Card>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className='space-y-6'>
            {loadingDetail ? (
              <Card className='h-64 animate-pulse bg-muted/30' />
            ) : !selectedPlanDetail ? (
              <Card>
                <CardHeader>
                  <CardTitle>Chưa có kế hoạch được chọn</CardTitle>
                  <CardDescription>
                    Chọn một kế hoạch từ danh sách bên trái để xem chi tiết.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <CardTitle>{selectedPlanDetail.tieu_de}</CardTitle>
                      <CardDescription>
                        Kế hoạch ngày{' '}
                        {new Date(
                          `${selectedPlanDetail.ngay_ap_dung}T00:00:00`,
                        ).toLocaleDateString('vi-VN')}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(selectedPlanDetail.trang_thai)}>
                      {formatPlanStatus(selectedPlanDetail.trang_thai)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {groupedDetails.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>
                      Kế hoạch này chưa có chi tiết bữa ăn.
                    </p>
                  ) : (
                    groupedDetails.map((group) => (
                      <div key={group.mealType} className='rounded-xl border p-4'>
                        <p className='font-medium'>{group.label}</p>
                        <div className='mt-2 space-y-2 text-sm text-muted-foreground'>
                          {group.items.map((item) => (
                            <p key={item.id}>
                              {item.ten_mon ?? 'Món ăn'} · {item.so_luong ?? 0}{' '}
                              {item.don_vi ?? ''} · {item.calories ?? 0} kcal
                            </p>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CalendarDays className='size-5 text-primary' />
                  So với mục tiêu trong ngày
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <MacroProgress
                  label='Calories kế hoạch'
                  current={selectedPlanDetail?.tong_calories ?? 0}
                  target={goal?.muc_tieu_calories_ngay ?? 0}
                  unit=' kcal'
                  tone='amber'
                />
                <MacroProgress
                  label='Protein dự kiến'
                  current={selectedPlanDetail?.tong_protein_g ?? 0}
                  target={goal?.muc_tieu_protein_g ?? 0}
                  tone='emerald'
                />
                <MacroProgress
                  label='Carb dự kiến'
                  current={selectedPlanDetail?.tong_carb_g ?? 0}
                  target={goal?.muc_tieu_carb_g ?? 0}
                />
                <MacroProgress
                  label='Fat dự kiến'
                  current={selectedPlanDetail?.tong_fat_g ?? 0}
                  target={goal?.muc_tieu_fat_g ?? 0}
                  tone='amber'
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Sparkles className='size-4 text-primary' />
                  Gợi ý
                </CardTitle>
                <CardDescription>
                  Nếu bạn cần hệ thống gợi ý kế hoạch ăn mới theo dữ liệu hiện tại, hãy vào màn khuyến nghị.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant='outline'>
                  <Link href='/nutrition/ai-advisor'>Mở khuyến nghị dinh dưỡng</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
