'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, LoaderCircle, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  createUserReview,
  getUserBooking,
  getUserReviews,
  updateUserReview,
  type UserBooking,
  type UserReview,
} from '@/services/consultation/api'

type Props = {
  bookingId: number
}

function StarInput({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type='button'
          onClick={() => onChange(score)}
          className='rounded-sm p-1'
          aria-label={`Chọn ${score} sao`}
        >
          <Star
            className={`size-6 ${score <= value ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`}
          />
        </button>
      ))}
    </div>
  )
}

export function NutritionUserBookingReview({ bookingId }: Props) {
  const [booking, setBooking] = useState<UserBooking | null>(null)
  const [review, setReview] = useState<UserReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [diem, setDiem] = useState(5)
  const [noiDung, setNoiDung] = useState('')

  const canSubmit = useMemo(() => diem >= 1 && diem <= 5, [diem])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingResponse, reviewResponse] = await Promise.all([
        getUserBooking(bookingId),
        getUserReviews({ bookingId, page: 1, limit: 1 }),
      ])

      const current = reviewResponse.data.items[0] ?? null
      setBooking(bookingResponse.data)
      setReview(current)
      if (current) {
        setDiem(current.diem)
        setNoiDung(current.noi_dung ?? '')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu đánh giá')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleSubmit() {
    if (!canSubmit) {
      toast.error('Vui lòng chọn số sao hợp lệ')
      return
    }

    setSaving(true)
    try {
      if (review) {
        const response = await updateUserReview(review.id, {
          diem,
          noiDung: noiDung.trim(),
        })
        setReview(response.data)
        toast.success(response.message)
      } else {
        const response = await createUserReview({
          bookingId,
          diem,
          noiDung: noiDung.trim(),
        })
        setReview(response.data)
        toast.success(response.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi đánh giá')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href={`/nutrition/bookings/${bookingId}`}>
            <ChevronLeft className='mr-1 size-4' />
            Quay lại booking
          </Link>
        </Button>

        <PageHeading
          title='Đánh giá nutritionist'
          description='Gửi đánh giá sau buổi tư vấn để giúp cộng đồng chọn chuyên gia phù hợp.'
        />

        {loading ? (
          <Card className='h-72 animate-pulse bg-muted/30' />
        ) : !booking ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Không tìm thấy booking</p>
            </CardContent>
          </Card>
        ) : booking.trang_thai !== 'hoan_thanh' ? (
          <Card className='border-amber-200 bg-amber-50'>
            <CardContent className='py-8 text-sm text-amber-900'>
              Chỉ có thể đánh giá khi booking đã hoàn thành.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {booking.nutritionist?.ho_ten ?? 'Chuyên gia dinh dưỡng'} - {booking.goi_tu_van?.ten ?? 'Gói tư vấn'}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='space-y-2'>
                <Label>Số sao</Label>
                <StarInput value={diem} onChange={setDiem} />
              </div>
              <div className='space-y-2'>
                <Label>Nhận xét</Label>
                <Textarea
                  rows={5}
                  value={noiDung}
                  onChange={(event) => setNoiDung(event.target.value)}
                  placeholder='Chia sẻ trải nghiệm của bạn sau buổi tư vấn...'
                />
              </div>
              {review && !review.co_the_chinh_sua && (
                <p className='text-sm text-muted-foreground'>
                  Đánh giá đã quá thời gian chỉnh sửa ({new Date(review.co_the_chinh_sua_den_luc).toLocaleString('vi-VN')}).
                </p>
              )}
              <Button
                onClick={() => void handleSubmit()}
                disabled={saving || (review ? !review.co_the_chinh_sua : false)}
              >
                {saving ? (
                  <>
                    <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                    Đang lưu...
                  </>
                ) : review ? (
                  'Cập nhật đánh giá'
                ) : (
                  'Gửi đánh giá'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}

