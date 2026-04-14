'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NFood, getNutriFood } from '@/services/nutritionist/api'
import { Link } from '@/lib/router'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

type Props = { foodId: number }

export function NutritionStaffFoodDetail({ foodId }: Props) {
  const [food, setFood] = useState<NFood | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getNutriFood(foodId)
      setFood(data)
    } catch (e) {
      setFood(null)
      toast.error(e instanceof ApiError ? e.message : 'Không tải được thực phẩm')
    } finally {
      setLoading(false)
    }
  }, [foodId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <Button variant='outline' size='sm' className='w-fit rounded-sm' asChild>
          <Link to='/nutritionist/foods'>
            <ArrowLeft className='mr-1 size-4' />
            Quay lại danh sách
          </Link>
        </Button>
        <PageHeading
          title={
            loading
              ? 'Chi tiết thực phẩm'
              : food
                ? food.ten
                : 'Không tìm thấy'
          }
          description='Thông tin dinh dưỡng theo catalog hệ thống. Để đề xuất chỉnh sửa, dùng mục Yêu cầu duyệt thực phẩm.'
        />

        {loading ? (
          <div className='rounded-sm border bg-card px-6 py-16 text-center text-sm text-muted-foreground'>
            Đang tải dữ liệu…
          </div>
        ) : !food ? (
          <div className='rounded-sm border bg-card px-6 py-16 text-center text-sm text-muted-foreground'>
            Không tìm thấy thực phẩm hoặc bạn không có quyền xem.
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='overflow-hidden rounded-sm border bg-card'>
              <div className='border-b px-4 py-3'>
                <p className='text-sm text-muted-foreground'>
                  Nhóm: <span className='font-medium text-foreground'>{food.nhom_thuc_pham?.ten ?? '—'}</span>
                </p>
              </div>
              <div className='grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3'>
                <div className='rounded-sm border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>Khẩu phần tham chiếu</p>
                  <p className='mt-1 font-semibold tabular-nums'>
                    {food.khau_phan_tham_chieu} {food.don_vi_khau_phan}
                  </p>
                </div>
                <div className='rounded-sm border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>Calories / 100g</p>
                  <p className='mt-1 font-semibold tabular-nums'>{food.calories_100g ?? '—'} kcal</p>
                </div>
                <div className='rounded-sm border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>Protein / 100g</p>
                  <p className='mt-1 font-semibold tabular-nums'>{food.protein_100g ?? '—'} g</p>
                </div>
                <div className='rounded-sm border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>Carb / 100g</p>
                  <p className='mt-1 font-semibold tabular-nums'>{food.carb_100g ?? '—'} g</p>
                </div>
                <div className='rounded-sm border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>Fat / 100g</p>
                  <p className='mt-1 font-semibold tabular-nums'>{food.fat_100g ?? '—'} g</p>
                </div>
                <div className='rounded-sm border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>Trạng thái xác minh</p>
                  <div className='mt-2'>
                    <Badge variant={food.da_xac_minh ? 'secondary' : 'outline'}>
                      {food.da_xac_minh ? 'Đã xác minh' : 'Chưa xác minh'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' className='rounded-sm' asChild>
                <Link to='/nutritionist/food-review-requests'>Tạo yêu cầu chỉnh sửa</Link>
              </Button>
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
