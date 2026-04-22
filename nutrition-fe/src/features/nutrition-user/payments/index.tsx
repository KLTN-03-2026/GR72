'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import {
  getConsultationPayments,
  type ConsultationPayment,
} from '@/services/consultation/api'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getPaymentStatusLabel(status: string, refundStatus?: string | null) {
  if (refundStatus === 'processing') return 'Đang xử lý hoàn tiền'
  if (refundStatus === 'bank_sent') return 'Đã gửi yêu cầu hoàn tiền'
  if (refundStatus === 'failed') return 'Hoàn tiền chưa thành công'
  if (refundStatus === 'success') return 'Đã hoàn tiền'

  switch (status) {
    case 'cho_thanh_toan':
      return 'Chờ thanh toán'
    case 'thanh_cong':
      return 'Thanh toán thành công'
    case 'that_bai':
      return 'Thanh toán thất bại'
    case 'dang_xu_ly':
      return 'Đang xử lý'
    case 'da_hoan_tien':
      return 'Đã hoàn tiền'
    default:
      return status
  }
}

function getPaymentBadge(status: string, refundStatus?: string | null) {
  const label = getPaymentStatusLabel(status, refundStatus)
  if (refundStatus === 'success' || status === 'da_hoan_tien') {
    return <Badge className='bg-sky-100 text-sky-700'>{label}</Badge>
  }
  if (refundStatus === 'processing' || status === 'dang_xu_ly') {
    return <Badge className='bg-amber-100 text-amber-700'>{label}</Badge>
  }
  if (status === 'thanh_cong') {
    return <Badge className='bg-emerald-100 text-emerald-700'>{label}</Badge>
  }
  if (status === 'that_bai' || refundStatus === 'failed') {
    return <Badge className='bg-red-100 text-red-700'>{label}</Badge>
  }
  return <Badge variant='outline'>{label}</Badge>
}

export function NutritionUserPayments() {
  const [items, setItems] = useState<ConsultationPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadData = useCallback(async (targetPage = page) => {
    setLoading(true)
    try {
      const response = await getConsultationPayments({
        page: targetPage,
        limit: 10,
      })
      setItems(response.data.items)
      const total = response.data.pagination.total
      setTotalPages(Math.max(1, Math.ceil(total / response.data.pagination.limit)))
      setPage(response.data.pagination.page)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể tải lịch sử thanh toán',
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void loadData(1)
  }, [loadData])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Thanh toán tư vấn'
          description='Theo dõi toàn bộ giao dịch thanh toán booking của bạn ở một nơi.'
        />

        {loading ? (
          <div className='grid gap-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className='h-36 animate-pulse bg-muted/30' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Chưa có giao dịch thanh toán nào</p>
              <p className='mt-2 text-sm text-muted-foreground'>
                Các giao dịch sẽ hiển thị tại đây sau khi bạn tạo booking và thanh toán.
              </p>
              <Button asChild className='mt-4'>
                <Link href='/nutrition/bookings'>Đi tới booking</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4'>
            {items.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <CardTitle className='text-base'>{payment.ma_giao_dich}</CardTitle>
                    {getPaymentBadge(payment.trang_thai, payment.refund_status)}
                  </div>
                  <CardDescription>
                    Booking #{payment.booking_id} · tạo lúc{' '}
                    {new Date(payment.tao_luc).toLocaleString('vi-VN')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-3 md:grid-cols-4'>
                  <div className='rounded-lg border bg-muted/20 p-3'>
                    <p className='text-xs text-muted-foreground'>Số tiền</p>
                    <p className='mt-1 font-semibold'>{formatCurrency(payment.so_tien)}</p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-3'>
                    <p className='text-xs text-muted-foreground'>Phương thức</p>
                    <p className='mt-1 font-semibold uppercase'>{payment.phuong_thuc}</p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-3'>
                    <p className='text-xs text-muted-foreground'>Nutritionist</p>
                    <p className='mt-1 font-semibold'>{payment.nutritionist?.ho_ten ?? '—'}</p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-3'>
                    <p className='text-xs text-muted-foreground'>Gói tư vấn</p>
                    <p className='mt-1 font-semibold'>{payment.goi_tu_van?.ten ?? '—'}</p>
                  </div>

                  {payment.refund_message && (
                    <div className='rounded-lg border bg-muted/20 p-3 md:col-span-4'>
                      <p className='text-xs text-muted-foreground'>Trạng thái hoàn tiền</p>
                      <p className='mt-1 text-sm'>{payment.refund_message}</p>
                    </div>
                  )}

                  <div className='flex flex-wrap gap-2 md:col-span-4'>
                    <Button variant='outline' asChild>
                      <Link href={`/nutrition/bookings/${payment.booking_id}`}>
                        <CreditCard className='mr-1.5 size-4' />
                        Xem booking
                      </Link>
                    </Button>
                    {payment.payment_url && payment.trang_thai === 'cho_thanh_toan' && (
                      <Button asChild>
                        <a href={payment.payment_url} target='_blank' rel='noreferrer'>
                          <ExternalLink className='mr-1.5 size-4' />
                          Tiếp tục thanh toán
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={(nextPage) => void loadData(nextPage)}
        />
      </Main>
    </>
  )
}
