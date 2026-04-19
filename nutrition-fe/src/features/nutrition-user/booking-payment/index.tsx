'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  CircleAlert,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  createConsultationPayment,
  getPendingConsultationPayment,
  getUserBooking,
  type ConsultationPayment,
  type UserBooking,
} from '@/services/consultation/api'

type Props = {
  bookingId: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getPaymentBadge(status: string, refundStatus?: string | null) {
  if (refundStatus === 'processing' || status === 'dang_xu_ly') {
    return <Badge className='bg-amber-100 text-amber-700'>Đang xử lý hoàn tiền</Badge>
  }
  if (refundStatus === 'bank_sent') {
    return <Badge className='bg-sky-100 text-sky-700'>Đã gửi yêu cầu hoàn tiền</Badge>
  }
  if (refundStatus === 'failed') {
    return <Badge className='bg-red-100 text-red-700'>Hoàn tiền chưa thành công</Badge>
  }
  if (refundStatus === 'success') {
    return <Badge className='bg-sky-100 text-sky-700'>Đã hoàn tiền</Badge>
  }

  switch (status) {
    case 'cho_thanh_toan':
      return <Badge variant='outline'>Chờ thanh toán</Badge>
    case 'thanh_cong':
      return <Badge className='bg-emerald-100 text-emerald-700'>Đã thanh toán</Badge>
    case 'da_hoan_tien':
      return <Badge className='bg-sky-100 text-sky-700'>Đã hoàn tiền</Badge>
    case 'that_bai':
      return <Badge className='bg-red-100 text-red-700'>Thanh toán thất bại</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export function NutritionUserBookingPayment({ bookingId }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState<UserBooking | null>(null)
  const [payment, setPayment] = useState<ConsultationPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingResponse, pendingPaymentResponse] = await Promise.all([
        getUserBooking(bookingId),
        getPendingConsultationPayment(bookingId),
      ])

      setBooking(bookingResponse.data)
      setPayment(pendingPaymentResponse.data)

      if (bookingResponse.data.trang_thai === 'da_xac_nhan') {
        toast.success('Booking này đã được thanh toán thành công.')
        router.replace(`/nutrition/bookings/${bookingId}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải thông tin thanh toán')
      setBooking(null)
      setPayment(null)
    } finally {
      setLoading(false)
    }
  }, [bookingId, router])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleCreateOrReusePayment() {
    setCreating(true)
    try {
      const response = await createConsultationPayment(bookingId)
      setPayment(response.data)
      toast.success(response.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo giao dịch thanh toán')
    } finally {
      setCreating(false)
    }
  }

  function handleOpenGateway() {
    if (!payment?.payment_url) {
      toast.error('Chưa có đường dẫn thanh toán khả dụng')
      return
    }
    window.location.assign(payment.payment_url)
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href={`/nutrition/bookings/${bookingId}`}>
            <ChevronLeft className='mr-1 size-4' />
            Quay lại chi tiết booking
          </Link>
        </Button>

        <PageHeading
          title='Thanh toán booking'
          description='Hoàn tất thanh toán qua VNPay để giữ chỗ lịch hẹn. Hệ thống giữ booking trong 1 giờ kể từ lúc tạo.'
        />

        {loading ? (
          <Card className='h-80 animate-pulse bg-muted/30' />
        ) : !booking ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Không tìm thấy booking cần thanh toán</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <CreditCard className='size-4' />
                  Trạng thái giao dịch
                </CardTitle>
                <CardDescription>
                  Kiểm tra giao dịch hiện tại và tiếp tục thanh toán để xác nhận lịch hẹn.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {booking.trang_thai === 'cho_thanh_toan' && booking.co_the_tiep_tuc_thanh_toan ? (
                  <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4'>
                    <div className='flex items-start gap-3'>
                      <CircleAlert className='mt-0.5 size-4 text-amber-700' />
                      <div className='space-y-1'>
                        <p className='font-medium text-amber-900'>Bạn đang giữ chỗ tạm thời cho lịch hẹn này</p>
                        <p className='text-sm text-amber-800'>
                          Hoàn tất thanh toán trong vòng {booking.so_phut_con_lai} phút để booking được xác nhận chính thức.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground'>
                    Booking này không còn ở trạng thái chờ thanh toán. Hãy quay lại chi tiết booking để xem bước tiếp theo.
                  </div>
                )}

                {payment ? (
                  <div className='space-y-4'>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div className='rounded-2xl border bg-muted/20 p-4'>
                        <p className='text-xs text-muted-foreground'>Mã giao dịch</p>
                        <p className='mt-1 font-mono text-sm'>{payment.ma_giao_dich}</p>
                      </div>
                      <div className='rounded-2xl border bg-muted/20 p-4'>
                        <p className='text-xs text-muted-foreground'>Trạng thái</p>
                        <div className='mt-1'>{getPaymentBadge(payment.trang_thai, payment.refund_status)}</div>
                      </div>
                      <div className='rounded-2xl border bg-muted/20 p-4'>
                        <p className='text-xs text-muted-foreground'>Số tiền</p>
                        <p className='mt-1 font-semibold'>{formatCurrency(payment.so_tien)}</p>
                      </div>
                      <div className='rounded-2xl border bg-muted/20 p-4'>
                        <p className='text-xs text-muted-foreground'>Giữ chỗ đến</p>
                        <p className='mt-1 font-semibold'>
                          {new Date(payment.giu_cho_den_luc).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-3'>
                    <Button onClick={handleOpenGateway} disabled={!payment.payment_url}>
                      <ExternalLink className='mr-1.5 size-4' />
                      Tiếp tục thanh toán
                    </Button>
                      <Button
                        variant='outline'
                        onClick={() => void handleCreateOrReusePayment()}
                        disabled={creating}
                      >
                        {creating ? (
                          <>
                            <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                            Đang làm mới...
                          </>
                        ) : (
                          'Làm mới link thanh toán'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : booking.trang_thai === 'cho_thanh_toan' && booking.so_phut_con_lai > 0 ? (
                  <div className='space-y-4 rounded-2xl border border-dashed p-5'>
                    <p className='text-sm text-muted-foreground'>
                      Hệ thống chưa tạo giao dịch nào cho booking này hoặc link cũ đã hết hiệu lực. Bạn có thể tạo mới ngay bây giờ.
                    </p>
                    <Button onClick={() => void handleCreateOrReusePayment()} disabled={creating}>
                      {creating ? (
                        <>
                          <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                          Đang tạo giao dịch...
                        </>
                      ) : (
                        'Thanh toán ngay'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className='rounded-2xl border border-dashed p-5 text-sm text-muted-foreground'>
                    Booking này không còn đủ điều kiện để tạo giao dịch mới. Hãy quay lại chi tiết booking để xem trạng thái hiện tại.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background'>
              <CardHeader>
                <CardTitle className='text-base'>Tóm tắt booking</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='rounded-2xl border bg-background/80 p-4'>
                  <p className='text-xs text-muted-foreground'>Nutritionist</p>
                  <p className='mt-1 font-semibold'>{booking.nutritionist?.ho_ten ?? '—'}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {booking.nutritionist?.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
                  </p>
                </div>
                <div className='rounded-2xl border bg-background/80 p-4'>
                  <p className='text-xs text-muted-foreground'>Gói tư vấn</p>
                  <p className='mt-1 font-semibold'>{booking.goi_tu_van?.ten ?? '—'}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {booking.goi_tu_van?.thoi_luong_phut ?? 0} phút
                  </p>
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-2xl border bg-background/80 p-4'>
                    <p className='text-xs text-muted-foreground'>Ngày hẹn</p>
                    <p className='mt-1 font-semibold'>
                      {new Date(booking.ngay_hen).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className='rounded-2xl border bg-background/80 p-4'>
                    <p className='text-xs text-muted-foreground'>Khung giờ</p>
                    <p className='mt-1 font-semibold'>
                      {booking.gio_bat_dau.slice(0, 5)} - {booking.gio_ket_thuc.slice(0, 5)}
                    </p>
                  </div>
                </div>
                <div className='rounded-2xl border bg-background/80 p-4'>
                  <p className='text-xs text-muted-foreground'>Tổng thanh toán</p>
                  <p className='mt-1 text-2xl font-semibold'>
                    {booking.goi_tu_van ? formatCurrency(booking.goi_tu_van.gia) : '—'}
                  </p>
                </div>
                <div className='rounded-2xl border border-dashed bg-background/70 p-4 text-sm text-muted-foreground'>
                  <div className='flex items-start gap-2'>
                    <ShieldCheck className='mt-0.5 size-4 text-primary' />
                    <p>
                      Tiền được thanh toán qua VNPay. Nếu nutritionist hoặc hệ thống hủy booking theo đúng chính sách, khoản hoàn tiền sẽ được xử lý về giao dịch gốc.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
