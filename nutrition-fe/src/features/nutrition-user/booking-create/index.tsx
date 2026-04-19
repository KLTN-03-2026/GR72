'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronLeft, Clock3, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { createUserBooking, getPublicNutritionist, type NutritionistDetail } from '@/services/consultation/api'

const MIN_SESSION_DURATION = 15
const MAX_SESSION_DURATION = 240

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function NutritionUserBookingCreate() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nutritionistId = Number(searchParams.get('nutritionistId'))
  const packageId = Number(searchParams.get('packageId'))

  const [nutritionist, setNutritionist] = useState<NutritionistDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    ngayHen: '',
    gioBatDau: '',
    mucDich: '',
  })

  useEffect(() => {
    async function load() {
      if (!nutritionistId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await getPublicNutritionist(nutritionistId)
        setNutritionist(response.data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu đặt lịch')
        setNutritionist(null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [nutritionistId])

  const selectedPackage = useMemo(
    () => nutritionist?.goi_tu_van.find((item) => item.id === packageId) ?? null,
    [nutritionist, packageId],
  )

  const hasInvalidPackageDuration = useMemo(() => {
    if (!selectedPackage) return false
    return (
      !Number.isInteger(selectedPackage.thoi_luong_phut) ||
      selectedPackage.thoi_luong_phut < MIN_SESSION_DURATION ||
      selectedPackage.thoi_luong_phut > MAX_SESSION_DURATION
    )
  }, [selectedPackage])

  async function handleSubmit() {
    if (!nutritionistId || !selectedPackage) {
      toast.error('Thiếu thông tin nutritionist hoặc gói tư vấn')
      return
    }

    if (hasInvalidPackageDuration) {
      toast.error('Gói tư vấn đang có thời lượng mỗi buổi không hợp lệ, vui lòng chọn gói khác hoặc liên hệ nutritionist')
      return
    }

    if (!formData.ngayHen || !formData.gioBatDau) {
      toast.error('Vui lòng chọn ngày và giờ bắt đầu')
      return
    }

    setSubmitting(true)
    try {
      const response = await createUserBooking({
        nutritionistId,
        goiTuVanId: selectedPackage.id,
        ngayHen: formData.ngayHen,
        gioBatDau: formData.gioBatDau,
        mucDich: formData.mucDich.trim() || undefined,
      })
      toast.success(response.message)
      router.push(`/nutrition/bookings/${response.data.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href={nutritionistId ? `/nutrition/nutritionists/${nutritionistId}` : '/nutrition/nutritionists'}>
            <ChevronLeft className='mr-1 size-4' />
            Quay lại profile
          </Link>
        </Button>

        <PageHeading
          title='Đặt lịch tư vấn'
          description='Xác nhận gói tư vấn, chọn ngày giờ phù hợp và mô tả ngắn mục tiêu của bạn.'
        />

        {loading ? (
          <Card className='h-80 animate-pulse bg-muted/30' />
        ) : !nutritionist || !selectedPackage ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Không tìm thấy gói tư vấn hợp lệ</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Thông tin buổi tư vấn</CardTitle>
                <CardDescription>
                  Hệ thống sẽ kiểm tra trùng lịch và giờ làm việc trước khi tạo booking chờ thanh toán.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Ngày tư vấn</Label>
                    <Input
                      type='date'
                      value={formData.ngayHen}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(event) => setFormData((current) => ({ ...current, ngayHen: event.target.value }))}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Giờ bắt đầu</Label>
                    <Input
                      type='time'
                      value={formData.gioBatDau}
                      onChange={(event) => setFormData((current) => ({ ...current, gioBatDau: event.target.value }))}
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Mục đích tư vấn</Label>
                  <Textarea
                    rows={6}
                    value={formData.mucDich}
                    onChange={(event) => setFormData((current) => ({ ...current, mucDich: event.target.value }))}
                    placeholder='Ví dụ: mình muốn giảm mỡ bụng, cải thiện chế độ ăn để ngủ ngon hơn, hoặc xây dựng kế hoạch ăn cho người tiền tiểu đường...'
                  />
                </div>
                {hasInvalidPackageDuration && (
                  <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800'>
                    Gói tư vấn này đang được cấu hình thời lượng mỗi buổi không hợp lệ ({selectedPackage.thoi_luong_phut} phút).
                    Hiện hệ thống chỉ hỗ trợ booking theo buổi trong khoảng {MIN_SESSION_DURATION}-{MAX_SESSION_DURATION} phút.
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || hasInvalidPackageDuration}
                  className='w-full sm:w-auto'
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                      Đang tạo booking...
                    </>
                  ) : (
                    'Tạo booking & chuyển sang thanh toán'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background'>
              <CardHeader>
                <CardTitle className='text-base'>Tóm tắt booking</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='rounded-2xl border bg-background/80 p-4'>
                  <p className='text-xs text-muted-foreground'>Nutritionist</p>
                  <p className='mt-1 font-semibold'>{nutritionist.ho_ten}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {nutritionist.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
                  </p>
                </div>
                <div className='rounded-2xl border bg-background/80 p-4'>
                  <p className='text-xs text-muted-foreground'>Gói tư vấn</p>
                  <p className='mt-1 font-semibold'>{selectedPackage.ten}</p>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    {selectedPackage.mo_ta ?? 'Gói tư vấn cá nhân hóa theo nhu cầu của bạn.'}
                  </p>
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-2xl border bg-background/80 p-4'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Clock3 className='size-3.5' />
                      Thời lượng mỗi buổi
                    </div>
                    <p className='mt-1 font-semibold'>{selectedPackage.thoi_luong_phut} phút</p>
                  </div>
                  <div className='rounded-2xl border bg-background/80 p-4'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <CalendarDays className='size-3.5' />
                      Giá tư vấn
                    </div>
                    <p className='mt-1 font-semibold'>{formatCurrency(selectedPackage.gia)}</p>
                  </div>
                </div>
                <div className='rounded-2xl border border-dashed p-4 text-sm text-muted-foreground'>
                  Sau khi tạo booking, hệ thống sẽ giữ chỗ trong 1 giờ để bạn hoàn tất thanh toán qua VNPay.
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
