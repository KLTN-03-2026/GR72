'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, Clock, FileText, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type NFoodReviewDetail,
  getNutriFoodReview,
} from '@/services/nutritionist/api'
import { Link } from '@/lib/router'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

type Props = { reviewId: number }

function getStatusBadge(status: NFoodReviewDetail['trang_thai']) {
  switch (status) {
    case 'cho_duyet':
      return (
        <Badge variant='outline' className='gap-1'>
          <Clock className='size-3' />
          Chờ duyệt
        </Badge>
      )
    case 'da_duyet':
      return (
        <Badge className='gap-1 bg-emerald-100 text-emerald-700'>
          <CheckCircle className='size-3' />
          Đã duyệt
        </Badge>
      )
    case 'tu_choi':
      return (
        <Badge variant='destructive' className='gap-1'>
          <XCircle className='size-3' />
          Từ chối
        </Badge>
      )
  }
}

function JsonCard({
  title,
  data,
}: {
  title: string
  data: Record<string, unknown> | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <pre className='max-h-[26rem] overflow-auto rounded-sm border bg-muted/30 p-4 text-xs leading-relaxed whitespace-pre-wrap break-all'>
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className='rounded-sm border bg-muted/30 px-4 py-8 text-sm text-muted-foreground'>
            Không có dữ liệu.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function NutritionStaffFoodReviewDetail({ reviewId }: Props) {
  const [review, setReview] = useState<NFoodReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReview = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getNutriFoodReview(reviewId)
      setReview(data)
    } catch (error) {
      setReview(null)
      toast.error(
        error instanceof ApiError ? error.message : 'Không tải được chi tiết đề xuất'
      )
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  useEffect(() => {
    void loadReview()
  }, [loadReview])

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <Button variant='outline' size='sm' className='w-fit rounded-sm' asChild>
          <Link to='/nutritionist/food-review-requests'>
            <ArrowLeft className='mr-1 size-4' />
            Quay lại danh sách
          </Link>
        </Button>

        <PageHeading
          title={
            loading
              ? 'Chi tiết đề xuất'
              : review
                ? `Đề xuất #${review.id}`
                : 'Không tìm thấy đề xuất'
          }
          description='Xem đầy đủ dữ liệu đã gửi, trạng thái duyệt và ghi chú phản hồi từ admin.'
        />

        {loading ? (
          <div className='rounded-sm border bg-card px-6 py-16 text-center text-sm text-muted-foreground'>
            Đang tải dữ liệu…
          </div>
        ) : !review ? (
          <div className='rounded-sm border bg-card px-6 py-16 text-center text-sm text-muted-foreground'>
            Không tìm thấy đề xuất hoặc bạn không có quyền xem.
          </div>
        ) : (
          <div className='space-y-5'>
            <Card>
              <CardHeader>
                <CardTitle className='flex flex-wrap items-center gap-3 text-base'>
                  <span>Thông tin đề xuất</span>
                  {getStatusBadge(review.trang_thai)}
                </CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                <div className='rounded-sm border bg-muted/20 p-4'>
                  <p className='text-xs text-muted-foreground'>Loại yêu cầu</p>
                  <p className='mt-1 font-medium'>{review.loai_yeu_cau}</p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4'>
                  <p className='text-xs text-muted-foreground'>Người đề xuất</p>
                  <p className='mt-1 font-medium'>
                    {review.nguoi_de_xuat?.ho_ten ?? '—'}
                  </p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4'>
                  <p className='text-xs text-muted-foreground'>Ngày tạo</p>
                  <p className='mt-1 font-medium'>{formatDateTime(review.tao_luc)}</p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4'>
                  <p className='text-xs text-muted-foreground'>Duyệt lúc</p>
                  <p className='mt-1 font-medium'>{formatDateTime(review.duyet_luc)}</p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4'>
                  <p className='text-xs text-muted-foreground'>Thực phẩm liên quan</p>
                  <p className='mt-1 font-medium'>
                    {review.thuc_pham?.ten ?? 'Đề xuất tạo mới'}
                  </p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4'>
                  <p className='text-xs text-muted-foreground'>Mã nguồn</p>
                  <p className='mt-1 font-medium'>{review.ma_nguon ?? '—'}</p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4 sm:col-span-2 xl:col-span-3'>
                  <p className='text-xs text-muted-foreground'>Lý do đề xuất</p>
                  <p className='mt-1 font-medium'>{review.ly_do ?? '—'}</p>
                </div>
                <div className='rounded-sm border bg-muted/20 p-4 sm:col-span-2 xl:col-span-3'>
                  <p className='text-xs text-muted-foreground'>Ghi chú duyệt</p>
                  <p className='mt-1 font-medium'>{review.ghi_chu_duyet ?? '—'}</p>
                </div>
              </CardContent>
            </Card>

            {review.thuc_pham && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Thông tin thực phẩm hiện tại</CardTitle>
                </CardHeader>
                <CardContent className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
                  <div className='rounded-sm border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Tên thực phẩm</p>
                    <p className='mt-1 font-medium'>{review.thuc_pham.ten}</p>
                  </div>
                  <div className='rounded-sm border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Calories/100g</p>
                    <p className='mt-1 font-medium'>{review.thuc_pham.calories_100g ?? '—'}</p>
                  </div>
                  <div className='rounded-sm border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Protein/100g</p>
                    <p className='mt-1 font-medium'>{review.thuc_pham.protein_100g ?? '—'}</p>
                  </div>
                  <div className='rounded-sm border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Carb/100g</p>
                    <p className='mt-1 font-medium'>{review.thuc_pham.carb_100g ?? '—'}</p>
                  </div>
                  <div className='rounded-sm border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Fat/100g</p>
                    <p className='mt-1 font-medium'>{review.thuc_pham.fat_100g ?? '—'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className='grid gap-5 xl:grid-cols-2'>
              <JsonCard title='Dữ liệu hiện tại' data={review.du_lieu_hien_tai} />
              <JsonCard title='Dữ liệu đề xuất' data={review.du_lieu_de_xuat} />
            </div>

            <div className='rounded-sm border border-dashed bg-card px-4 py-5 text-sm text-muted-foreground'>
              <div className='flex items-start gap-3'>
                <FileText className='mt-0.5 size-4' />
                <p>
                  Nếu đề xuất bị từ chối, bạn có thể tạo một đề xuất mới từ danh sách và
                  chỉnh lại dữ liệu theo ghi chú của admin.
                </p>
              </div>
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
