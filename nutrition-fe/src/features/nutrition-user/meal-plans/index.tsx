'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Copy, LoaderCircle, Plus } from 'lucide-react'
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
import { useNutritionStore } from '@/stores/nutrition-store'
import {
  copyMealPlanFromTemplate,
  getPublishedMealTemplates,
  type UserPublishedMealTemplate,
} from '@/services/content/api'

export function NutritionUserMealPlans() {
  const plans = useNutritionStore((state) => state.mealPlans)
  const goal = useNutritionStore((state) => state.goal)
  const addMealPlan = useNutritionStore((state) => state.addMealPlan)
  const [templates, setTemplates] = useState<UserPublishedMealTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [copying, setCopying] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState(plans[0]?.id ?? '')
  const selectedPlan = plans.find((plan) => plan.id === selectedId) ?? plans[0]
  const selectedTemplate = useMemo(
    () =>
      templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )

  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true)
      try {
        const response = await getPublishedMealTemplates({ page: 1, limit: 20 })
        setTemplates(response.items)
        setSelectedTemplateId(response.items[0]?.id ?? null)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Không tải được thực đơn mẫu đã publish.',
        )
      } finally {
        setLoadingTemplates(false)
      }
    }

    void loadTemplates()
  }, [])

  function handleCreatePlan() {
    addMealPlan({
      id: `PLAN-${Date.now()}`,
      title: `Kế hoạch ăn ${new Intl.DateTimeFormat('vi-VN').format(new Date())}`,
      planDate: new Intl.DateTimeFormat('vi-VN').format(new Date()),
      meals: ['Yến mạch + sữa chua', 'Ức gà + cơm gạo lứt', 'Salad cá hồi'],
      totalCalories: goal.dailyTargets.calories,
      status: 'Bản nháp',
    })
    toast.success('Đã tạo meal plan mới.')
  }

  async function handleCopyTemplate() {
    if (!selectedTemplate) {
      toast.error('Chưa có template để sao chép.')
      return
    }

    setCopying(true)
    try {
      const copied = await copyMealPlanFromTemplate(selectedTemplate.id)
      addMealPlan({
        id: String(copied.id),
        title: copied.tieu_de,
        planDate: new Date(copied.ngay_ap_dung).toLocaleDateString('vi-VN'),
        meals:
          copied.chi_tiet_tom_tat.map(
            (item) =>
              `${item.loai_bua_an.replaceAll('_', ' ')}: ${item.ten_mon ?? 'Món ăn'}`,
          ) ?? [],
        totalCalories: copied.tong_calories ?? 0,
        status: 'Bản nháp',
      })
      setSelectedId(String(copied.id))
      toast.success('Đã copy từ thực đơn mẫu.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể copy thực đơn mẫu.',
      )
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thực đơn cá nhân'
          description='Quản lý kế hoạch ăn uống theo ngày, có thể tạo thủ công hoặc copy từ template.'
          actions={[{ label: 'Tạo meal plan' }, { label: 'Copy từ template' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[0.85fr_1.15fr]'>
          <div className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              <Button onClick={handleCreatePlan}>
                <Plus className='mr-2 size-4' />
                Tạo meal plan
              </Button>
              <Button variant='outline' onClick={handleCopyTemplate}>
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
                {loadingTemplates ? (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <LoaderCircle className='size-4 animate-spin' />
                    Đang tải thực đơn mẫu...
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

            {plans.map((plan) => (
              <button
                key={plan.id}
                className='w-full text-left'
                onClick={() => setSelectedId(plan.id)}
                type='button'
              >
                <Card className={plan.id === selectedPlan?.id ? 'border-primary/40 shadow-sm' : ''}>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <CardTitle className='text-lg'>{plan.title}</CardTitle>
                        <CardDescription>Áp dụng cho {plan.planDate}</CardDescription>
                      </div>
                      <Badge variant={plan.status === 'Đang áp dụng' ? 'secondary' : 'outline'}>
                        {plan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='flex items-center justify-between gap-3 text-sm text-muted-foreground'>
                    <span>{plan.meals.length} nhóm bữa</span>
                    <span>{plan.totalCalories} kcal</span>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {selectedPlan ? (
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <CardTitle>{selectedPlan.title}</CardTitle>
                      <CardDescription>
                        Kế hoạch ngày {selectedPlan.planDate} đang được dùng để theo dõi dinh dưỡng.
                      </CardDescription>
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='outline' onClick={() => toast.success('Đã sao chép kế hoạch ăn.')}>
                        <Copy className='mr-2 size-4' />
                        Sao chép
                      </Button>
                      <Button onClick={() => toast.success('Đã thêm món vào kế hoạch ăn.')}>
                        <Plus className='mr-2 size-4' />
                        Thêm món
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    {selectedPlan.meals.map((meal) => (
                      <div key={meal} className='rounded-xl border p-4'>
                        <p className='font-medium'>{meal}</p>
                        <p className='mt-2 text-sm text-muted-foreground'>
                          Có thể chỉnh lại định lượng hoặc thay món trước khi áp dụng vào ngày thực tế.
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                    current={selectedPlan.totalCalories}
                    target={goal.dailyTargets.calories}
                    unit=' kcal'
                    tone='amber'
                  />
                  <MacroProgress
                    label='Protein dự kiến'
                    current={110}
                    target={goal.dailyTargets.protein}
                    tone='emerald'
                  />
                  <MacroProgress label='Carb dự kiến' current={175} target={goal.dailyTargets.carbs} />
                  <MacroProgress label='Fat dự kiến' current={50} target={goal.dailyTargets.fat} tone='amber' />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </Main>
    </>
  )
}
