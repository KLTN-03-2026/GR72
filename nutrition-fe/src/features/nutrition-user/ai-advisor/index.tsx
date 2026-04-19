'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, CheckCircle2, LoaderCircle, Sparkles, TriangleAlert } from 'lucide-react'
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
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  applyRecommendation,
  getDailyMealPlanRecommendation,
  getHealthManagementRecommendation,
  getNextMealRecommendation,
  getNutritionRecommendation,
  type Recommendation,
} from '@/services/recommendations/api'

type RecommendationState = {
  nutrition: Recommendation | null
  nextMeal: Recommendation | null
  dailyPlan: Recommendation | null
  health: Recommendation | null
}

function recommendationTitle(type: string) {
  switch (type) {
    case 'nutrition':
      return 'Khuyến nghị dinh dưỡng'
    case 'meal_next':
      return 'Gợi ý bữa ăn tiếp theo'
    case 'meal_plan_daily':
      return 'Gợi ý thực đơn trong ngày'
    case 'health_management':
      return 'Gợi ý quản lý sức khỏe'
    default:
      return 'Khuyến nghị'
  }
}

function extractPreview(rec: Recommendation | null) {
  if (!rec) return null
  const payload = rec.du_lieu_khuyen_nghi ?? {}

  if (Array.isArray(payload.recommendedFoods)) {
    return (payload.recommendedFoods as Array<Record<string, unknown>>)
      .slice(0, 4)
      .map((item) => String(item.ten ?? item.name ?? 'Món ăn'))
  }

  if (Array.isArray(payload.recipes)) {
    return (payload.recipes as Array<Record<string, unknown>>)
      .slice(0, 4)
      .map((item) => String(item.ten ?? item.name ?? 'Công thức'))
  }

  if (Array.isArray(payload.chi_tiet)) {
    return (payload.chi_tiet as Array<Record<string, unknown>>)
      .slice(0, 4)
      .map((item) => String(item.ten_mon ?? item.ten ?? 'Món ăn'))
  }

  if (Array.isArray(payload.actions)) {
    return (payload.actions as unknown[]).slice(0, 4).map((item) => String(item))
  }

  return null
}

function RecommendationCard({
  recommendation,
  loading,
  onApply,
  applying,
}: {
  recommendation: Recommendation | null
  loading: boolean
  applying: boolean
  onApply: (rec: Recommendation) => Promise<void>
}) {
  const preview = useMemo(() => extractPreview(recommendation), [recommendation])
  const canApply =
    !!recommendation &&
    (recommendation.loai_khuyen_nghi === 'meal_next' ||
      recommendation.loai_khuyen_nghi === 'meal_plan_daily') &&
    recommendation.trang_thai !== 'da_ap_dung'

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <CardTitle className='text-base'>
            {recommendationTitle(recommendation?.loai_khuyen_nghi ?? '')}
          </CardTitle>
          {recommendation ? (
            <Badge variant={recommendation.trang_thai === 'da_ap_dung' ? 'default' : 'secondary'}>
              {recommendation.trang_thai === 'da_ap_dung' ? 'Đã áp dụng' : 'Mới'}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          {recommendation?.tao_luc
            ? `Cập nhật ${new Date(recommendation.tao_luc).toLocaleString('vi-VN')}`
            : 'Chưa có dữ liệu'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {loading ? (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <LoaderCircle className='size-4 animate-spin' />
            Đang tải khuyến nghị...
          </div>
        ) : !recommendation ? (
          <p className='text-sm text-muted-foreground'>Không có khuyến nghị phù hợp.</p>
        ) : (
          <>
            {recommendation.ly_giai && (
              <p className='text-sm leading-6 text-muted-foreground'>
                {recommendation.ly_giai}
              </p>
            )}

            {recommendation.canh_bao?.length > 0 && (
              <div className='space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3'>
                <p className='flex items-center gap-2 text-sm font-medium text-amber-700'>
                  <TriangleAlert className='size-4' />
                  Lưu ý
                </p>
                {recommendation.canh_bao.map((warning) => (
                  <p key={warning} className='text-xs text-amber-700'>
                    - {warning}
                  </p>
                ))}
              </div>
            )}

            {preview && preview.length > 0 && (
              <div className='space-y-2'>
                <p className='text-sm font-medium'>Gợi ý nổi bật</p>
                <div className='flex flex-wrap gap-2'>
                  {preview.map((item) => (
                    <Badge key={item} variant='outline'>
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {canApply && (
              <Button
                onClick={() => void onApply(recommendation)}
                disabled={applying}
                className='w-full'
              >
                {applying ? (
                  <>
                    <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                    Đang áp dụng...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='mr-1.5 size-4' />
                    Áp dụng vào kế hoạch ăn
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function NutritionUserAiAdvisor() {
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [items, setItems] = useState<RecommendationState>({
    nutrition: null,
    nextMeal: null,
    dailyPlan: null,
    health: null,
  })

  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        getNutritionRecommendation(),
        getNextMealRecommendation(),
        getDailyMealPlanRecommendation(),
        getHealthManagementRecommendation(),
      ])

      setItems({
        nutrition: results[0].status === 'fulfilled' ? results[0].value : null,
        nextMeal: results[1].status === 'fulfilled' ? results[1].value : null,
        dailyPlan: results[2].status === 'fulfilled' ? results[2].value : null,
        health: results[3].status === 'fulfilled' ? results[3].value : null,
      })

      const rejectedCount = results.filter((result) => result.status === 'rejected').length
      if (rejectedCount > 0) {
        toast.warning(`Có ${rejectedCount} loại khuyến nghị chưa tải được.`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không tải được khuyến nghị.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecommendations()
  }, [loadRecommendations])

  async function handleApply(rec: Recommendation) {
    setApplyingId(rec.id)
    try {
      const result = await applyRecommendation(rec.id)
      toast.success(
        result.ke_hoach_an
          ? `Đã tạo kế hoạch ăn "${result.ke_hoach_an.tieu_de}".`
          : 'Đã áp dụng khuyến nghị thành công.',
      )
      await loadRecommendations()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không áp dụng được khuyến nghị.',
      )
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Khuyến nghị dinh dưỡng & sức khỏe'
          description='Hệ thống tự động phân tích dữ liệu để gợi ý thực phẩm, bữa ăn và hành động quản lý sức khỏe.'
        />

        <div className='flex flex-wrap items-center gap-3'>
          <Button variant='outline' onClick={() => void loadRecommendations()} disabled={loading}>
            {loading ? (
              <LoaderCircle className='mr-1.5 size-4 animate-spin' />
            ) : (
              <Sparkles className='mr-1.5 size-4' />
            )}
            Tải lại khuyến nghị
          </Button>
        </div>

        <div className='grid gap-6 xl:grid-cols-2'>
          <RecommendationCard
            recommendation={items.nutrition}
            loading={loading}
            applying={applyingId === items.nutrition?.id}
            onApply={handleApply}
          />
          <RecommendationCard
            recommendation={items.nextMeal}
            loading={loading}
            applying={applyingId === items.nextMeal?.id}
            onApply={handleApply}
          />
          <RecommendationCard
            recommendation={items.dailyPlan}
            loading={loading}
            applying={applyingId === items.dailyPlan?.id}
            onApply={handleApply}
          />
          <RecommendationCard
            recommendation={items.health}
            loading={loading}
            applying={applyingId === items.health?.id}
            onApply={handleApply}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bot className='size-5 text-primary' />
              Lưu ý hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm leading-6 text-muted-foreground'>
            Đây là module khuyến nghị tự động theo rule/scoring từ dữ liệu hồ sơ, mục tiêu,
            nhật ký ăn uống và chỉ số sức khỏe. Chat AI real-time là chức năng riêng (C11/C12).
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
