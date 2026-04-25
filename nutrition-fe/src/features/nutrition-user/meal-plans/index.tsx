'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Copy, Loader2, Sparkles, Utensils, CheckCircle2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { MacroProgress } from '@/features/nutrition/components/macro-progress'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  copyMealPlanFromTemplate,
  getPublishedMealTemplates,
  getPublishedMealTemplateById,
  getUserMealPlanDetail,
  getUserMealPlans,
  type UserMealPlan,
  type UserMealPlanDetail,
  type UserPublishedMealTemplate,
  type UserPublishedMealTemplateDetail,
} from '@/services/content/api'
import { getCurrentGoal, type GoalApiResponse } from '@/services/goals/api'

const MEAL_TYPE_LABELS: Record<string, string> = {
  bua_sang: 'Bữa sáng',
  bua_trua: 'Bữa trưa',
  bua_toi: 'Bữa tối',
  bua_phu: 'Bữa phụ',
}

const MEAL_TYPE_ACCENT: Record<string, { bg: string; text: string }> = {
  bua_sang: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600' },
  bua_trua: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600' },
  bua_toi: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600' },
  bua_phu: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600' },
}

function formatPlanStatus(status: string) {
  switch (status) {
    case 'ban_nhap': return 'Bản nháp'
    case 'dang_ap_dung': return 'Đang áp dụng'
    case 'hoan_thanh': return 'Hoàn thành'
    case 'luu_tru': return 'Lưu trữ'
    default: return status
  }
}

function PlanStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    dang_ap_dung: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300',
    ban_nhap: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    hoan_thanh: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300',
    luu_tru: 'bg-neutral-200 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground border-transparent'}`}>
      {formatPlanStatus(status)}
    </span>
  )
}

export function NutritionUserMealPlans() {
  const [goal, setGoal] = useState<GoalApiResponse | null>(null)
  const [plans, setPlans] = useState<UserMealPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<UserMealPlanDetail | null>(null)
  const [templates, setTemplates] = useState<UserPublishedMealTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<UserPublishedMealTemplateDetail | null>(null)
  const [loadingTemplateDetail, setLoadingTemplateDetail] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [copying, setCopying] = useState(false)
  const [leftTab, setLeftTab] = useState<'templates' | 'plans'>('templates')

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null,
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được chi tiết kế hoạch ăn.')
      setSelectedPlanDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function loadTemplateDetail(id: number) {
    setLoadingTemplateDetail(true)
    try {
      const detail = await getPublishedMealTemplateById(id)
      setSelectedTemplateDetail(detail)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được chi tiết thực đơn mẫu.')
      setSelectedTemplateDetail(null)
    } finally {
      setLoadingTemplateDetail(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [templatesRes, currentGoal] = await Promise.all([
          getPublishedMealTemplates({ page: 1, limit: 20 }),
          getCurrentGoal().catch(() => null),
        ])
        setTemplates(templatesRes.items)
        setSelectedTemplateId(templatesRes.items[0]?.id ?? null)
        setGoal(currentGoal)
        await loadPlans()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không tải được dữ liệu thực đơn cá nhân.')
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

  useEffect(() => {
    if (leftTab !== 'templates' || !selectedTemplateId) return
    void loadTemplateDetail(selectedTemplateId)
  }, [leftTab, selectedTemplateId])

  async function handleCopyTemplate() {
    if (!selectedTemplate) {
      toast.error('Chưa có template để sao chép.')
      return
    }
    setCopying(true)
    try {
      const copied = await copyMealPlanFromTemplate(selectedTemplate.id)
      toast.success('Đã tạo kế hoạch ăn từ thực đơn mẫu.')
      await loadPlans()
      setSelectedPlanId(copied.id)
      setLeftTab('plans')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể copy thực đơn mẫu.')
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

  const planMacros = useMemo(() => ({
    calories: selectedPlanDetail?.tong_calories ?? 0,
    protein: selectedPlanDetail?.tong_protein_g ?? 0,
    carb: selectedPlanDetail?.tong_carb_g ?? 0,
    fat: selectedPlanDetail?.tong_fat_g ?? 0,
  }), [selectedPlanDetail])

  const templateMacros = useMemo(() => {
    if (!selectedTemplateDetail) return { calories: 0, protein: 0, carb: 0, fat: 0 }
    return {
      calories: selectedTemplateDetail.calories_muc_tieu ?? 0,
      protein: 0,
      carb: 0,
      fat: 0,
    }
  }, [selectedTemplateDetail])

  const templateGroupedDetails = useMemo(() => {
    if (!selectedTemplateDetail) return []
    const groups = new Map<string, typeof selectedTemplateDetail.chi_tiet>()
    selectedTemplateDetail.chi_tiet.forEach((item) => {
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
  }, [selectedTemplateDetail])

  const hasGoal = goal && (goal.muc_tieu_calories_ngay || goal.muc_tieu_protein_g)
  const hasPlan = !!selectedPlanDetail

  const tabActiveCls = 'bg-background shadow-sm text-foreground'
  const tabInactiveCls = 'text-muted-foreground hover:text-foreground'

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thực đơn cá nhân'
          description='Quản lý kế hoạch ăn uống, so sánh với mục tiêu và ghi nhận bữa ăn hằng ngày.'
        />

        <div className='grid gap-6 xl:grid-cols-[320px_1fr]'>
          {/* Left sidebar */}
          <div className='space-y-4'>
            {/* Tab switcher */}
            <div className='flex rounded-lg border bg-muted p-0.5'>
              <button
                onClick={() => setLeftTab('templates')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${leftTab === 'templates' ? tabActiveCls : tabInactiveCls}`}
              >
                Template
              </button>
              <button
                onClick={() => setLeftTab('plans')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${leftTab === 'plans' ? tabActiveCls : tabInactiveCls}`}
              >
                Kế hoạch của tôi
                {plans.length > 0 && (
                  <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs text-primary'>
                    {plans.length}
                  </span>
                )}
              </button>
            </div>

            {/* Templates tab */}
            {leftTab === 'templates' && (
              <div className='space-y-3'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm'>Chọn thực đơn mẫu</CardTitle>
                    <CardDescription>Template đã được nutritionist biên soạn.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {loading ? (
                      <div className='space-y-2'>
                        {[1,2,3].map(i => (
                          <div key={i} className='h-16 rounded-lg bg-muted animate-pulse' />
                        ))}
                      </div>
                    ) : templates.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>
                        Chưa có thực đơn mẫu nào được publish.
                      </p>
                    ) : (
                      templates.map((template) => (
                        <button
                          key={template.id}
                          type='button'
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`w-full rounded-xl border p-3 text-left transition-all ${selectedTemplate?.id === template.id ? 'border-primary/40 bg-primary/5 shadow-sm' : 'hover:border-primary/30'}`}
                        >
                          <p className='text-sm font-medium'>{template.tieu_de}</p>
                          <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                            <Badge variant={selectedTemplate?.id === template.id ? 'default' : 'secondary'} className='text-xs'>
                              {template.loai_muc_tieu_phu_hop ?? 'Tổng hợp'}
                            </Badge>
                            {template.calories_muc_tieu && (
                              <span className='text-xs text-muted-foreground'>
                                {template.calories_muc_tieu} kcal
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Button onClick={() => void handleCopyTemplate()} disabled={copying || !selectedTemplate} className='w-full'>
                  {copying ? (
                    <><Loader2 className='mr-2 size-4 animate-spin' /> Đang tạo...</>
                  ) : (
                    <><Copy className='mr-2 size-4' /> Tạo kế hoạch từ template</>
                  )}
                </Button>

                <Button variant='outline' asChild className='w-full'>
                  <Link href='/nutrition/ai-advisor'>
                    <Sparkles className='mr-2 size-4' />
                    Khuyến nghị từ AI
                  </Link>
                </Button>
              </div>
            )}

            {/* Plans tab */}
            {leftTab === 'plans' && (
              <div className='space-y-3'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm'>Kế hoạch của tôi</CardTitle>
                    <CardDescription>{plans.length} kế hoạch đã tạo.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {loading ? (
                      <div className='space-y-2'>
                        {[1,2].map(i => (
                          <div key={i} className='h-14 rounded-lg bg-muted animate-pulse' />
                        ))}
                      </div>
                    ) : plans.length === 0 ? (
                      <div className='space-y-3 py-2 text-center'>
                        <p className='text-sm text-muted-foreground'>
                          Chưa có kế hoạch nào.
                        </p>
                        <Button variant='outline' size='sm' onClick={() => setLeftTab('templates')}>
                          Chọn từ template
                        </Button>
                      </div>
                    ) : (
                      plans.map((plan) => (
                        <button
                          key={plan.id}
                          type='button'
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`w-full rounded-xl border p-3 text-left transition-all ${selectedPlanId === plan.id ? 'border-primary/40 bg-primary/5 shadow-sm' : 'hover:border-primary/30'}`}
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div className='min-w-0 flex-1'>
                              <p className='text-sm font-medium truncate'>{plan.tieu_de}</p>
                              <p className='text-xs text-muted-foreground'>
                                {new Date(plan.ngay_ap_dung + 'T00:00:00').toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <PlanStatusBadge status={plan.trang_thai} />
                          </div>
                          <p className='mt-1.5 text-xs text-muted-foreground'>
                            {plan.tong_calories ?? 0} kcal
                          </p>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right: Plan or Template detail */}
          <div className='space-y-5'>
            {leftTab === 'templates' ? (
              /* ---- TEMPLATE PREVIEW ---- */
              loadingTemplateDetail ? (
                <div className='space-y-4'>
                  <div className='h-48 rounded-xl bg-muted animate-pulse' />
                  <div className='h-64 rounded-xl bg-muted animate-pulse' />
                </div>
              ) : !selectedTemplateDetail ? (
                <Card className='border-dashed'>
                  <CardContent className='flex flex-col items-center justify-center gap-4 py-16 text-center'>
                    <div className='flex size-16 items-center justify-center rounded-full bg-muted'>
                      <Utensils className='size-8 text-muted-foreground/50' />
                    </div>
                    <div>
                      <p className='font-medium'>Chọn thực đơn mẫu để xem trước</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Click vào template bên trái để xem chi tiết món ăn.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Template header */}
                  <Card className='border-2 border-primary/20'>
                    <CardContent className='p-5'>
                      <div className='flex flex-wrap items-start justify-between gap-4'>
                        <div className='space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h2 className='text-xl font-bold'>{selectedTemplateDetail.tieu_de}</h2>
                            {selectedTemplateDetail.loai_muc_tieu_phu_hop && (
                              <Badge variant='secondary'>{selectedTemplateDetail.loai_muc_tieu_phu_hop}</Badge>
                            )}
                          </div>
                          {selectedTemplateDetail.mo_ta && (
                            <p className='text-sm text-muted-foreground'>{selectedTemplateDetail.mo_ta}</p>
                          )}
                          {selectedTemplateDetail.tac_gia && (
                            <p className='text-xs text-muted-foreground'>
                              Biên soạn bởi: {selectedTemplateDetail.tac_gia.ho_ten}
                            </p>
                          )}
                        </div>
                        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                          {[
                            { label: 'Calories', value: String(templateMacros.calories), unit: 'kcal' },
                            { label: 'Protein', value: String(templateMacros.protein), unit: 'g' },
                            { label: 'Carb', value: String(templateMacros.carb), unit: 'g' },
                            { label: 'Fat', value: String(templateMacros.fat), unit: 'g' },
                          ].map((item) => (
                            <div key={item.label} className='rounded-lg border bg-muted/30 p-2.5 text-center'>
                              <p className='text-xs text-muted-foreground'>{item.label}</p>
                              <p className='text-base font-bold'>{item.value}</p>
                              <p className='text-xs text-muted-foreground'>{item.unit}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Template meal sections */}
                  {templateGroupedDetails.length === 0 ? (
                    <Card>
                      <CardContent className='py-12 text-center text-muted-foreground'>
                        Thực đơn mẫu này chưa có chi tiết bữa ăn.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2'>
                        <Utensils className='size-4 text-primary' />
                        <h3 className='text-sm font-semibold'>Chi tiết bữa ăn</h3>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {templateGroupedDetails.map((group) => {
                          const accent = MEAL_TYPE_ACCENT[group.mealType] ?? { bg: 'bg-muted', text: 'text-muted-foreground' }
                          return (
                            <Card key={group.mealType} className='overflow-hidden'>
                              <div className={accent.bg + ' px-4 py-3'}>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <Utensils className={'size-4 ' + accent.text} />
                                    <span className={'text-sm font-semibold ' + accent.text}>{group.label}</span>
                                </div>
                              </div>
                              <CardContent className='p-0'>
                                {group.items.map((item, idx) => (
                                  <div
                                    key={item.id ?? idx}
                                    className={'flex items-center justify-between px-4 py-2.5' + (idx < group.items.length - 1 ? ' border-b' : '')}
                                  >
                                    <div className='min-w-0 flex-1'>
                                      <p className='text-sm font-medium truncate'>Món ăn</p>
                                      <p className='text-xs text-muted-foreground'>
                                        {item.so_luong ?? 0} {item.don_vi ?? ''}
                                        {item.ghi_chu ? ` · ${item.ghi_chu}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                <div className='flex items-center justify-between border-t bg-muted/30 px-4 py-2'>
                                  <span className='text-xs font-medium text-muted-foreground'>Tổng template</span>
                                  <span className='text-xs font-semibold'>{templateMacros.calories > 0 ? `${templateMacros.calories} kcal` : '-'}</span>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className='rounded-xl border border-dashed bg-primary/5 p-4 text-center'>
                    <p className='text-sm font-medium'>Bạn thấy thực đơn mẫu này phù hợp?</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Tạo thành kế hoạch ăn cá nhân để áp dụng cho ngày của bạn.
                    </p>
                    <Button className='mt-3' disabled={copying || !selectedTemplate} onClick={() => void handleCopyTemplate()}>
                      {copying ? (
                        <><Loader2 className='mr-2 size-4 animate-spin' /> Đang tạo...</>
                      ) : (
                        <><Copy className='mr-2 size-4' /> Tạo kế hoạch từ template</>
                      )}
                    </Button>
                  </div>
                </>
              )
            ) : (
              /* ---- PLAN DETAIL ---- */
              loadingDetail ? (
                <div className='space-y-4'>
                  <div className='h-48 rounded-xl bg-muted animate-pulse' />
                  <div className='h-64 rounded-xl bg-muted animate-pulse' />
                </div>
              ) : !hasPlan ? (
                <Card className='border-dashed'>
                  <CardContent className='flex flex-col items-center justify-center gap-4 py-16 text-center'>
                    <div className='flex size-16 items-center justify-center rounded-full bg-muted'>
                      <Utensils className='size-8 text-muted-foreground/50' />
                    </div>
                    <div>
                      <p className='font-medium'>Chưa có kế hoạch nào được chọn</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Chọn một kế hoạch từ danh sách bên trái, hoặc tạo mới từ template.
                      </p>
                    </div>
                    <div className='flex gap-3'>
                      <Button variant='outline' onClick={() => setLeftTab('templates')}>
                        <Copy className='mr-2 size-4' />
                        Tạo từ template
                      </Button>
                      <Button variant='outline' asChild>
                        <Link href='/nutrition/foods'>Tìm thực phẩm</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Plan header card */}
                  <Card className='border-2 border-primary/20'>
                    <CardContent className='p-5'>
                      <div className='flex flex-wrap items-start justify-between gap-4'>
                        <div className='space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h2 className='text-xl font-bold'>{selectedPlanDetail.tieu_de}</h2>
                            <PlanStatusBadge status={selectedPlanDetail.trang_thai} />
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            Áp dụng ngày{' '}
                            {new Date(selectedPlanDetail.ngay_ap_dung + 'T00:00:00').toLocaleDateString('vi-VN', {
                              weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                          {[
                            { label: 'Calories', value: String(planMacros.calories), unit: 'kcal' },
                            { label: 'Protein', value: String(planMacros.protein), unit: 'g' },
                            { label: 'Carb', value: String(planMacros.carb), unit: 'g' },
                            { label: 'Fat', value: String(planMacros.fat), unit: 'g' },
                          ].map((item) => (
                            <div key={item.label} className='rounded-lg border bg-muted/30 p-2.5 text-center'>
                              <p className='text-xs text-muted-foreground'>{item.label}</p>
                              <p className='text-base font-bold'>{item.value}</p>
                              <p className='text-xs text-muted-foreground'>{item.unit}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {hasGoal && (
                        <>
                          <Separator className='my-4' />
                          <div className='space-y-3'>
                            <p className='text-xs font-medium text-muted-foreground'>SO VỚI MỤC TIÊU HIỆN TẠI</p>
                            <div className='grid gap-2 sm:grid-cols-2'>
                              {planMacros.calories > 0 && goal.muc_tieu_calories_ngay ? (
                                <MacroProgress
                                  label={`Calories (${planMacros.calories} / ${goal.muc_tieu_calories_ngay} kcal)`}
                                  current={planMacros.calories}
                                  target={goal.muc_tieu_calories_ngay}
                                  unit=' kcal'
                                  tone={planMacros.calories > goal.muc_tieu_calories_ngay ? 'amber' : 'emerald'}
                                />
                              ) : null}
                              {planMacros.protein > 0 && goal.muc_tieu_protein_g ? (
                                <MacroProgress
                                  label={`Protein (${planMacros.protein} / ${goal.muc_tieu_protein_g}g)`}
                                  current={planMacros.protein}
                                  target={goal.muc_tieu_protein_g}
                                  tone='emerald'
                                />
                              ) : null}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Meal sections */}
                  {groupedDetails.length === 0 ? (
                    <Card>
                      <CardContent className='py-12 text-center text-muted-foreground'>
                        Kế hoạch này chưa có chi tiết bữa ăn.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2'>
                        <Utensils className='size-4 text-primary' />
                        <h3 className='text-sm font-semibold'>Chi tiết bữa ăn</h3>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {groupedDetails.map((group) => {
                          const accent = MEAL_TYPE_ACCENT[group.mealType] ?? { bg: 'bg-muted', text: 'text-muted-foreground' }
                          const groupCalories = group.items.reduce((s, i) => s + (i.calories ?? 0), 0)
                          return (
                            <Card key={group.mealType} className='overflow-hidden'>
                              <div className={accent.bg + ' px-4 py-3'}>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <Utensils className={'size-4 ' + accent.text} />
                                    <span className={'text-sm font-semibold ' + accent.text}>{group.label}</span>
                                  </div>
                                  <span className={'text-sm font-medium ' + accent.text}>
                                    {groupCalories} kcal
                                  </span>
                                </div>
                              </div>
                              <CardContent className='p-0'>
                                {group.items.map((item, idx) => (
                                  <div
                                    key={item.id ?? idx}
                                    className={'flex items-center justify-between px-4 py-2.5' + (idx < group.items.length - 1 ? ' border-b' : '')}
                                  >
                                    <div className='min-w-0 flex-1'>
                                      <p className='text-sm font-medium truncate'>{item.ten_mon ?? 'Món ăn'}</p>
                                      <p className='text-xs text-muted-foreground'>
                                        {item.so_luong ?? 0} {item.don_vi ?? ''}
                                      </p>
                                    </div>
                                    <div className='ml-4 text-right shrink-0'>
                                      <p className='text-sm font-semibold'>{item.calories ?? 0} kcal</p>
                                      <p className='text-xs text-muted-foreground'>
                                        P {item.protein_g?.toFixed(1) ?? 0} · C {item.carb_g?.toFixed(1) ?? 0} · F {item.fat_g?.toFixed(1) ?? 0}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                <div className='flex items-center justify-between border-t bg-muted/30 px-4 py-2'>
                                  <span className='text-xs font-medium text-muted-foreground'>Tổng bữa</span>
                                  <span className='text-xs font-semibold'>{groupCalories} kcal</span>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className='flex flex-wrap gap-3'>
                    <Button variant='outline' asChild>
                      <Link href='/nutrition/meal-logs'>
                        <CheckCircle2 className='mr-2 size-4' />
                        Ghi nhận vào nhật ký hôm nay
                      </Link>
                    </Button>
                    <Button variant='outline' asChild>
                      <Link href='/nutrition/foods'>
                        <Utensils className='mr-2 size-4' />
                        Tìm thêm thực phẩm
                      </Link>
                    </Button>
                    <Button variant='outline' asChild>
                      <Link href='/nutrition/ai-advisor'>
                        <Sparkles className='mr-2 size-4' />
                        Gợi ý cải thiện
                      </Link>
                    </Button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </Main>
    </>
  )
}
