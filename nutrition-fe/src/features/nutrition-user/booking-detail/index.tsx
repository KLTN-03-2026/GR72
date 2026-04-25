'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  UserRound,
  Video,
  XCircle,
} from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { openStandaloneCallWindow } from '@/features/consultation-call/open-window'
import {
  cancelUserBooking,
  checkUserBookingRefundStatus,
  getUserBooking,
  type UserBooking,
} from '@/services/consultation/api'

type Props = {
  bookingId: number
}

const STATUS_STEPS = [
  { key: 'cho_thanh_toan', label: 'Chờ thanh toán' },
  { key: 'da_xac_nhan', label: 'Đã xác nhận' },
  { key: 'da_checkin', label: 'Đã check-in' },
  { key: 'dang_tu_van', label: 'Đang tư vấn' },
  { key: 'hoan_thanh', label: 'Hoàn thành' },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'cho_thanh_toan':
      return <Badge variant='outline'>Chờ thanh toán</Badge>
    case 'da_xac_nhan':
      return <Badge className='bg-blue-100 text-blue-700'>Đã xác nhận</Badge>
    case 'da_checkin':
      return <Badge className='bg-purple-100 text-purple-700'>Đã check-in</Badge>
    case 'dang_tu_van':
      return <Badge className='bg-yellow-100 text-yellow-700'>Đang tư vấn</Badge>
    case 'hoan_thanh':
      return <Badge className='bg-emerald-100 text-emerald-700'>Hoàn thành</Badge>
    case 'da_huy':
      return <Badge className='bg-red-100 text-red-700'>Đã hủy</Badge>
    case 'vo_hieu_hoa':
      return <Badge variant='secondary'>Vô hiệu hóa</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getStepStatus(stepKey: string, currentStatus: string) {
  if (currentStatus === 'da_huy' || currentStatus === 'vo_hieu_hoa') return 'cancelled'
  const order = STATUS_STEPS.map((s) => s.key)
  const currentIdx = order.indexOf(currentStatus)
  const stepIdx = order.indexOf(stepKey)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

function StatusTimeline({ status }: { status: string }) {
  return (
    <div className='flex items-center gap-1'>
      {STATUS_STEPS.map((step, idx) => {
        const stepStatus = getStepStatus(step.key, status)
        return (
          <div key={step.key} className='flex items-center'>
            <div className='flex flex-col items-center'>
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  stepStatus === 'done'
                    ? 'bg-emerald-500 text-white'
                    : stepStatus === 'active'
                      ? 'bg-primary text-primary-foreground'
                      : stepStatus === 'cancelled'
                        ? 'bg-red-400 text-white'
                        : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepStatus === 'done' || stepStatus === 'cancelled' ? (
                  stepStatus === 'cancelled' ? (
                    <XCircle className='size-4' />
                  ) : (
                    <CheckCircle2 className='size-4' />
                  )
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`mt-1.5 whitespace-nowrap text-xs font-medium ${
                  stepStatus === 'done' || stepStatus === 'active'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-6 ${
                  getStepStatus(STATUS_STEPS[idx + 1].key, status) !== 'pending' &&
                  status !== 'da_huy' &&
                  status !== 'vo_hieu_hoa'
                    ? 'bg-emerald-400'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function getPaymentStatusLabel(status: string, refundStatus?: string | null) {
  if (refundStatus === 'processing') return 'Đang xử lý hoàn tiền'
  if (refundStatus === 'bank_sent') return 'Đã gửi yêu cầu hoàn tiền'
  if (refundStatus === 'failed') return 'Hoàn tiền chưa thành công'
  if (refundStatus === 'success') return 'Đã hoàn tiền'

  if (status === 'dang_xu_ly') return 'Đang xử lý hoàn tiền'
  if (status === 'da_hoan_tien') return 'Đã hoàn tiền'

  switch (status) {
    case 'cho_thanh_toan':
      return 'Chờ thanh toán'
    case 'thanh_cong':
      return 'Thanh toán thành công'
    case 'that_bai':
      return 'Thanh toán thất bại'
    case 'da_hoan_tien':
      return 'Đã hoàn tiền'
    default:
      return status
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function NutritionUserBookingDetail({ bookingId }: Props) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<UserBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [openCancel, setOpenCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [refundCheckLoading, setRefundCheckLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUserBooking(bookingId)
      setData(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải chi tiết booking')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const status = searchParams.get('payment_status')
    const message = searchParams.get('message')
    if (!status || !message) return

    if (status === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }, [searchParams])

  async function handleCancel() {
    if (!data) return
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy')
      return
    }

    setCancelLoading(true)
    try {
      const response = await cancelUserBooking(data.id, { lyDoHuy: cancelReason.trim() })
      toast.success(response.message)
      setOpenCancel(false)
      setCancelReason('')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hủy booking')
    } finally {
      setCancelLoading(false)
    }
  }

  async function handleRefundCheck() {
    if (!data) return

    setRefundCheckLoading(true)
    try {
      const response = await checkUserBookingRefundStatus(data.id)
      setData(response.data)
      toast.success(response.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể kiểm tra trạng thái hoàn tiền')
    } finally {
      setRefundCheckLoading(false)
    }
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href='/nutrition/bookings'>
            <ChevronLeft className='mr-1 size-4' />
            Quay lại booking
          </Link>
        </Button>

        <PageHeading
          title={loading ? 'Đang tải booking...' : data?.ma_lich_hen ?? 'Không tìm thấy booking'}
          description='Xem tiến trình booking, trạng thái thanh toán và các hành động bạn có thể thực hiện.'
        />

        {loading ? (
          <Card className='h-80 animate-pulse bg-muted/30' />
        ) : !data ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Không tìm thấy booking</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {data.trang_thai === 'cho_thanh_toan' && data.co_the_tiep_tuc_thanh_toan && (
              <Card className='border-amber-200 bg-amber-50'>
                <CardContent className='flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <p className='font-medium text-amber-900'>Bạn có một thanh toán chưa hoàn tất</p>
                    <p className='mt-1 text-sm text-amber-800'>
                      Hãy hoàn tất trong vòng {data.so_phut_con_lai} phút để giữ chỗ cho lịch hẹn này.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/nutrition/bookings/${data.id}/payment`}>
                      <CreditCard className='mr-1.5 size-4' />
                      Tiếp tục thanh toán
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <span className='font-semibold'>Tiến trình booking</span>
                    {getStatusBadge(data.trang_thai)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto pb-2'>
                  <StatusTimeline status={data.trang_thai} />
                </div>
                {(data.trang_thai === 'da_huy' || data.trang_thai === 'vo_hieu_hoa') && (
                  <div className='mt-4 rounded-xl border border-red-100 bg-red-50 p-3'>
                    <p className='text-sm text-red-800'>
                      Booking này đã bị{' '}
                      {data.trang_thai === 'da_huy' ? 'hủy' : 'vô hiệu hóa'} và không thể tiếp tục xử lý.
                    </p>
                    {data.ly_do_huy && (
                      <p className='mt-1 text-sm text-red-700'>
                        Lý do: {data.ly_do_huy}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin booking</CardTitle>
                  <CardDescription>
                    Mã lịch hẹn <span className='font-mono font-medium text-foreground'>{data.ma_lich_hen}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='flex items-center gap-3 rounded-xl border p-3'>
                      <CalendarClock className='size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Ngày hẹn</p>
                        <p className='text-sm font-semibold'>{new Date(data.ngay_hen).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 rounded-xl border p-3'>
                      <CalendarClock className='size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Khung giờ</p>
                        <p className='text-sm font-semibold'>
                          {data.gio_bat_dau.slice(0, 5)} – {data.gio_ket_thuc.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='rounded-xl border p-3'>
                    <p className='text-xs text-muted-foreground'>Mục đích tư vấn</p>
                    <p className='mt-1 text-sm leading-relaxed'>
                      {data.muc_dich ?? 'Bạn chưa bổ sung mục đích tư vấn cho booking này.'}
                    </p>
                  </div>
                  {data.ly_do_huy && (
                    <div className='rounded-xl border border-red-100 bg-red-50 p-3'>
                      <p className='text-xs text-red-700'>Lý do hủy</p>
                      <p className='mt-1 text-sm text-red-800'>{data.ly_do_huy}</p>
                    </div>
                  )}
                  {data.thanh_toan_moi_nhat?.refund_status === 'processing' && (
                    <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs font-medium text-amber-700'>Hoàn tiền đang xử lý</p>
                        <RefreshCw className='size-3.5 text-amber-500' />
                      </div>
                      <p className='mt-1 text-xs text-amber-800'>
                        {data.thanh_toan_moi_nhat.refund_message ?? 'VNPay đang xử lý yêu cầu hoàn tiền cho booking này.'}
                      </p>
                      <Button
                        size='sm'
                        variant='outline'
                        className='mt-2'
                        onClick={() => void handleRefundCheck()}
                        disabled={refundCheckLoading}
                      >
                        {refundCheckLoading ? (
                          <>
                            <LoaderCircle className='mr-1 size-3.5 animate-spin' />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='mr-1 size-3.5' />
                            Kiểm tra trạng thái
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {data.thanh_toan_moi_nhat?.refund_status === 'bank_sent' && (
                    <div className='rounded-xl border border-sky-200 bg-sky-50 p-3'>
                      <p className='text-xs font-medium text-sky-700'>Yêu cầu hoàn tiền đã gửi ngân hàng</p>
                      <p className='mt-1 text-xs text-sky-800'>
                        {data.thanh_toan_moi_nhat.refund_message ?? 'VNPay đã gửi yêu cầu hoàn tiền sang ngân hàng.'}
                      </p>
                      <Button
                        size='sm'
                        variant='outline'
                        className='mt-2'
                        onClick={() => void handleRefundCheck()}
                        disabled={refundCheckLoading}
                      >
                        {refundCheckLoading ? (
                          <>
                            <LoaderCircle className='mr-1 size-3.5 animate-spin' />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='mr-1 size-3.5' />
                            Kiểm tra trạng thái
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {data.thanh_toan_moi_nhat?.refund_status === 'success' && (
                    <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
                      <p className='text-xs font-medium text-emerald-700'>Hoàn tiền thành công</p>
                      <p className='mt-1 text-xs text-emerald-800'>
                        {data.thanh_toan_moi_nhat.refund_message ?? 'Khoản hoàn tiền đã được xác nhận qua VNPay.'}
                      </p>
                    </div>
                  )}
                  {data.thanh_toan_moi_nhat?.refund_status === 'failed' && (
                    <div className='rounded-xl border border-red-200 bg-red-50 p-3'>
                      <p className='text-xs font-medium text-red-700'>Hoàn tiền chưa thành công</p>
                      <p className='mt-1 text-xs text-red-800'>
                        {data.thanh_toan_moi_nhat.refund_message ?? 'Yêu cầu hoàn tiền chưa thành công. Hệ thống sẽ cần xử lý thêm.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Nutritionist & gói tư vấn</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-start gap-3 rounded-xl border p-3'>
                      <UserRound className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Nutritionist</p>
                        <p className='text-sm font-semibold'>{data.nutritionist?.ho_ten ?? '—'}</p>
                        <p className='text-xs text-muted-foreground'>
                          {data.nutritionist?.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3 rounded-xl border p-3'>
                      <CalendarClock className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Gói tư vấn</p>
                        <p className='text-sm font-semibold'>{data.goi_tu_van?.ten ?? '—'}</p>
                        <p className='text-xs text-muted-foreground'>
                          {data.goi_tu_van?.thoi_luong_phut ?? 0} phút ·{' '}
                          {data.goi_tu_van ? formatCurrency(data.goi_tu_van.gia) : '—'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Thanh toán gần nhất</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {data.thanh_toan_moi_nhat ? (
                      <>
                        <div className='rounded-xl border p-3'>
                          <p className='text-xs text-muted-foreground'>Mã giao dịch</p>
                          <p className='font-mono text-xs font-semibold'>{data.thanh_toan_moi_nhat.ma_giao_dich}</p>
                        </div>
                        <div className='rounded-xl border p-3'>
                          <p className='text-xs text-muted-foreground'>Trạng thái</p>
                          <p className='mt-0.5 text-sm'>
                            {getStatusBadge(data.thanh_toan_moi_nhat.trang_thai)} · {formatCurrency(data.thanh_toan_moi_nhat.so_tien)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className='text-xs text-muted-foreground'>Chưa có giao dịch thanh toán nào cho booking này.</p>
                    )}
                    <div className='flex flex-col gap-2 pt-1'>
                      {data.trang_thai === 'cho_thanh_toan' && (
                        <Button size='sm' asChild>
                          <Link href={`/nutrition/bookings/${data.id}/payment`}>
                            <CreditCard className='mr-1.5 size-3.5' />
                            Tiếp tục thanh toán
                          </Link>
                        </Button>
                      )}
                      {['cho_thanh_toan', 'da_xac_nhan'].includes(data.trang_thai) && (
                        <Button size='sm' variant='destructive' onClick={() => setOpenCancel(true)}>
                          <XCircle className='mr-1.5 size-3.5' />
                          Hủy booking
                        </Button>
                      )}
                      {data.trang_thai === 'hoan_thanh' && (
                        <Button size='sm' variant='outline' asChild>
                          <Link href={`/nutrition/bookings/${data.id}/review`}>
                            Đánh giá chuyên gia
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <Card className='border-dashed'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <MessageSquare className='size-4 text-muted-foreground' />
                    Phòng chat với Nutritionist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='mb-3 text-sm text-muted-foreground'>
                    Mở room chat riêng để trao đổi. Phòng chỉ mở khi booking đã check-in và sẽ khóa sau giờ kết thúc.
                  </p>
                  <Button size='sm' variant='outline' asChild className='w-full'>
                    <Link href={`/nutrition/bookings/${data.id}/chat`}>
                      <MessageSquare className='mr-1.5 size-3.5' />
                      Vào phòng chat
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className='border-dashed'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Video className='size-4 text-muted-foreground' />
                    Phòng gọi video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='mb-3 text-sm text-muted-foreground'>
                    Gọi video realtime bằng WebRTC. Chỉ booking đã check-in và chưa quá giờ kết thúc mới có thể vào call.
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    type='button'
                    className='w-full'
                    onClick={() => openStandaloneCallWindow('nutrition', data.id)}
                  >
                    <Video className='mr-1.5 size-3.5' />
                    Vào call video
                  </Button>
                </CardContent>
              </Card>
            </div>

            {data.lich_su_thanh_toan && data.lich_su_thanh_toan.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Lịch sử thanh toán</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {data.lich_su_thanh_toan.map((payment) => (
                    <div key={payment.id} className='rounded-xl border p-3'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='font-mono text-xs font-semibold'>{payment.ma_giao_dich}</p>
                        <Badge variant='outline'>
                          {getPaymentStatusLabel(payment.trang_thai, payment.refund_status)}
                        </Badge>
                      </div>
                      {payment.refund_message && (
                        <p className='mt-1.5 text-xs text-muted-foreground'>{payment.refund_message}</p>
                      )}
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {formatCurrency(payment.so_tien)} · {new Date(payment.tao_luc).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Main>

      <Dialog open={openCancel} onOpenChange={setOpenCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy booking</DialogTitle>
            <DialogDescription>
              Nếu booking đã thanh toán qua VNPay, hệ thống sẽ xét chính sách hoàn tiền và chỉ hoàn khi
              còn cách giờ hẹn từ 24 giờ trở lên.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-4'>
            <Label>Lý do hủy</Label>
            <Textarea
              rows={5}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder='Mô tả ngắn lý do bạn muốn hủy booking này...'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenCancel(false)}>
              Đóng
            </Button>
            <Button variant='destructive' disabled={cancelLoading} onClick={handleCancel}>
              {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
