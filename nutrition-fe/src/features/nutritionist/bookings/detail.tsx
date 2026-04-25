'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  Clock3,
  DollarSign,
  LoaderCircle,
  MapPin,
  NotebookPen,
  MessageSquare,
  RefreshCw,
  UserRound,
  Video,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type NBooking,
  cancelNutriBooking,
  checkNutriBookingRefundStatus,
  completeNutriBooking,
  confirmNutriBooking,
  getNutriBooking,
} from '@/services/nutritionist/api'
import { Link } from '@/lib/router'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { openStandaloneCallWindow } from '@/features/consultation-call/open-window'

type Props = { bookingId: number }

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
      return <Badge className='bg-green-100 text-green-700'>Hoàn thành</Badge>
    case 'da_huy':
      return <Badge className='bg-red-100 text-red-700'>Đã hủy</Badge>
    case 'vo_hieu_hoa':
      return <Badge variant='secondary'>Vô hiệu hóa</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getRefundBadge(paymentStatus: string | null, refundStatus: NBooking['refundStatus']) {
  if (paymentStatus === 'dang_xu_ly' || refundStatus === 'processing') {
    return <Badge className='bg-amber-100 text-amber-700'>Đang xử lý hoàn tiền</Badge>
  }
  if (refundStatus === 'bank_sent') {
    return <Badge className='bg-sky-100 text-sky-700'>Đã gửi yêu cầu hoàn tiền</Badge>
  }
  if (paymentStatus === 'da_hoan_tien' || refundStatus === 'success') {
    return <Badge className='bg-sky-100 text-sky-700'>Đã hoàn tiền</Badge>
  }
  if (refundStatus === 'failed') {
    return <Badge className='bg-red-100 text-red-700'>Hoàn tiền chưa thành công</Badge>
  }
  return null
}

function getStatusDescription(status: string) {
  switch (status) {
    case 'da_xac_nhan':
      return 'Booking đã được thanh toán. Chuyên gia có thể xác nhận đã nhận lịch để chuyển sang trạng thái đã check-in.'
    case 'da_checkin':
      return 'Booking đã được chuyên gia xác nhận. Từ đây có thể hoàn thành tư vấn hoặc hủy nếu phát sinh sự cố.'
    case 'dang_tu_van':
      return 'Booking đang ở trạng thái tư vấn. Chuyên gia vẫn có thể hoàn thành hoặc hủy theo luồng hiện tại.'
    case 'hoan_thanh':
      return 'Buổi tư vấn đã kết thúc thành công.'
    case 'da_huy':
      return 'Booking đã bị hủy và không thể tiếp tục thao tác.'
    case 'cho_thanh_toan':
      return 'Booking chưa thanh toán xong nên chưa vào luồng xử lý của chuyên gia.'
    case 'vo_hieu_hoa':
      return 'Booking đã bị vô hiệu hóa bởi hệ thống hoặc quản trị.'
    default:
      return 'Trạng thái hiện tại của booking.'
  }
}

function formatDateVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':')
  return `${h}:${m}`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getIncomeLabel(status: string) {
  if (status === 'hoan_thanh') return 'Thu nhập thực nhận'
  if (status === 'da_huy' || status === 'vo_hieu_hoa') return 'Thu nhập thực nhận'
  return 'Thu nhập dự kiến'
}

export function NutritionistBookingDetail({ bookingId }: Props) {
  const [booking, setBooking] = useState<NBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'complete' | 'cancel' | null>(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [refundCheckLoading, setRefundCheckLoading] = useState(false)

  const loadBooking = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getNutriBooking(bookingId)
      setBooking(data)
    } catch (error) {
      setBooking(null)
      toast.error(
        error instanceof ApiError ? error.message : 'Không thể tải chi tiết booking'
      )
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void loadBooking()
  }, [loadBooking])

  async function handleConfirm() {
    if (!booking) return

    try {
      const updated = await confirmNutriBooking(booking.id)
      setBooking(updated)
      toast.success('Đã xác nhận booking')
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Không thể xác nhận booking'
      )
    }
  }

  async function handleComplete() {
    if (!actionId || actionType !== 'complete') return

    setActionLoading(true)
    try {
      const updated = await completeNutriBooking(actionId, {
        ghiChu: note.trim() || undefined,
      })
      setBooking(updated)
      setActionId(null)
      setActionType(null)
      setNote('')
      toast.success('Đã hoàn thành tư vấn')
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Không thể hoàn thành booking'
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!actionId || actionType !== 'cancel') return
    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do hủy')
      return
    }

    setActionLoading(true)
    try {
      const updated = await cancelNutriBooking(actionId, { lyDoHuy: note.trim() })
      setBooking(updated)
      setActionId(null)
      setActionType(null)
      setNote('')
      toast.success(updated.refundMessage ?? 'Đã hủy booking')
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Không thể hủy booking'
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRefundCheck() {
    if (!booking) return

    setRefundCheckLoading(true)
    try {
      const updated = await checkNutriBookingRefundStatus(booking.id)
      setBooking(updated)
      toast.success('Đã cập nhật trạng thái hoàn tiền')
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Không thể kiểm tra trạng thái hoàn tiền'
      )
    } finally {
      setRefundCheckLoading(false)
    }
  }

  function openCompleteDialog() {
    if (!booking) return
    setActionId(booking.id)
    setActionType('complete')
    setNote(booking.ghiChuNutritionist ?? '')
  }

  function openCancelDialog() {
    if (!booking) return
    setActionId(booking.id)
    setActionType('cancel')
    setNote('')
  }

  const canCompleteOrCancel =
    booking?.trangThai === 'da_checkin' || booking?.trangThai === 'dang_tu_van'

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit rounded-sm' asChild>
          <Link to='/nutritionist/bookings'>
            <ArrowLeft className='mr-1 size-4' />
            Quay lại danh sách booking
          </Link>
        </Button>

        <PageHeading
          title={
            loading
              ? 'Chi tiết booking'
              : booking
                ? `Booking ${booking.maLichHen}`
                : 'Không tìm thấy booking'
          }
          description='Theo dõi đầy đủ trạng thái, thông tin người dùng và thao tác xử lý của chuyên gia.'
        />

        {loading ? (
          <div className='rounded-lg border bg-card px-6 py-16 text-center'>
            <div className='mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        ) : !booking ? (
          <div className='rounded-lg border bg-card px-6 py-16 text-center text-sm text-muted-foreground'>
            Không tìm thấy booking hoặc bạn không có quyền xem booking này.
          </div>
        ) : (
          <div className='grid gap-6 xl:grid-cols-[1.4fr_0.9fr]'>
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex flex-wrap items-center gap-3'>
                    <span>Thông tin lịch hẹn</span>
                    {getStatusBadge(booking.trangThai)}
                  </CardTitle>
                  <CardDescription>
                    Mã lịch hẹn <span className='font-mono font-medium text-foreground'>{booking.maLichHen}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='flex items-center gap-3 rounded-xl border p-3'>
                      <CalendarClock className='size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Ngày hẹn</p>
                        <p className='text-sm font-semibold'>{formatDateVN(booking.ngayHen)}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 rounded-xl border p-3'>
                      <CalendarClock className='size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Khung giờ</p>
                        <p className='text-sm font-semibold'>
                          {formatTime(booking.gioBatDau)} – {formatTime(booking.gioKetThuc)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {booking.diaDiem && (
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Địa điểm / Link tư vấn</p>
                      <p className='mt-1 text-sm break-all'>{booking.diaDiem}</p>
                    </div>
                  )}
                  {booking.mucDich && (
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Mục đích tư vấn</p>
                      <p className='mt-1 text-sm leading-relaxed'>{booking.mucDich}</p>
                    </div>
                  )}
                  <div className='rounded-xl border border-blue-50 bg-blue-50 p-3'>
                    <p className='text-xs text-blue-700'>Mô tả trạng thái</p>
                    <p className='mt-1 text-sm text-blue-900'>{getStatusDescription(booking.trangThai)}</p>
                  </div>
                  {booking.ghiChuNutritionist && (
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Ghi chú sau tư vấn</p>
                      <p className='mt-1 text-sm leading-relaxed'>{booking.ghiChuNutritionist}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Xử lý booking</CardTitle>
                </CardHeader>
                <CardContent className='flex flex-wrap gap-2'>
                  {booking.trangThai === 'da_xac_nhan' && (
                    <Button size='sm' onClick={handleConfirm}>
                      <CheckCircle className='mr-1.5 size-3.5' />
                      Xác nhận đã nhận lịch
                    </Button>
                  )}
                  {canCompleteOrCancel && (
                    <>
                      <Button size='sm' variant='outline' onClick={openCompleteDialog}>
                        <NotebookPen className='mr-1.5 size-3.5' />
                        Hoàn thành tư vấn
                      </Button>
                      <Button size='sm' variant='destructive' onClick={openCancelDialog}>
                        <XCircle className='mr-1.5 size-3.5' />
                        Hủy booking
                      </Button>
                    </>
                  )}
                  {!canCompleteOrCancel && booking.trangThai !== 'da_xac_nhan' && (
                    <p className='text-xs text-muted-foreground'>
                      Booking hiện không có thao tác trực tiếp nào thêm từ màn hình chuyên gia.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Doanh thu booking</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center gap-3 rounded-xl border p-3'>
                    <DollarSign className='size-4 shrink-0 text-muted-foreground' />
                    <div>
                      <p className='text-xs text-muted-foreground'>Giá gói</p>
                      <p className='text-sm font-semibold'>{formatCurrency(booking.giaGoi)}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 rounded-xl border p-3'>
                    <div className='flex size-8 items-center justify-center rounded-full bg-amber-50'>
                      <p className='text-xs font-semibold text-amber-600'>5%</p>
                    </div>
                    <div>
                      <p className='text-xs text-muted-foreground'>Hoa hồng hệ thống</p>
                      <p className='text-sm font-semibold text-amber-600'>
                        {formatCurrency(booking.hoaHongHeThong)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3'>
                    <div className='flex size-8 items-center justify-center rounded-full bg-emerald-100'>
                      <DollarSign className='size-4 text-emerald-600' />
                    </div>
                    <div>
                      <p className='text-xs text-emerald-700'>{getIncomeLabel(booking.trangThai)}</p>
                      <p className='text-base font-bold text-emerald-700'>
                        {formatCurrency(
                          booking.trangThai === 'hoan_thanh'
                            ? booking.thuNhapThucNhan
                            : booking.thuNhapDuKien
                        )}
                      </p>
                      <p className='text-xs text-emerald-600'>
                        {booking.trangThai === 'hoan_thanh'
                          ? 'Đã ghi nhận vào thu nhập'
                          : booking.trangThai === 'da_huy' || booking.trangThai === 'vo_hieu_hoa'
                            ? 'Không phát sinh thu nhập'
                            : 'Ghi nhận khi hoàn thành'}
                      </p>
                    </div>
                  </div>
                  <div className='rounded-xl border p-3'>
                    <p className='text-xs text-muted-foreground'>Trạng thái thanh toán / phân bổ</p>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        {booking.trangThaiThanhToan
                          ? `Thanh toán: ${booking.trangThaiThanhToan}`
                          : 'Chưa có thanh toán'}
                      </Badge>
                      <Badge variant='outline' className='text-xs'>
                        {booking.trangThaiPhanBoDoanhThu
                          ? `Phân bổ: ${booking.trangThaiPhanBoDoanhThu}`
                          : 'Chưa ghi nhận'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(booking.trangThaiThanhToan === 'dang_xu_ly' ||
                booking.trangThaiThanhToan === 'da_hoan_tien' ||
                booking.refundStatus !== 'not_required') && (
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <RefreshCw className='size-4 text-muted-foreground' />
                      Hoàn tiền
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {getRefundBadge(booking.trangThaiThanhToan, booking.refundStatus)}
                    {booking.refundMessage && (
                      <p className='text-xs text-muted-foreground'>{booking.refundMessage}</p>
                    )}
                    {(booking.refundStatus === 'processing' || booking.refundStatus === 'bank_sent') && (
                      <Button
                        size='sm'
                        variant='outline'
                        className='w-full'
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
                            Kiểm tra trạng thái hoàn tiền
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Người dùng đặt lịch</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-start gap-3 rounded-xl border p-3'>
                    <UserRound className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                    <div>
                      <p className='text-xs text-muted-foreground'>Họ tên</p>
                      <p className='text-sm font-semibold'>{booking.tenUser}</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 rounded-xl border p-3'>
                    <Clock3 className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                    <div>
                      <p className='text-xs text-muted-foreground'>Thời lượng gói</p>
                      <p className='text-sm font-semibold'>{booking.thoiLuongPhut} phút</p>
                    </div>
                  </div>
                  {booking.diaDiem && (
                    <div className='flex items-start gap-3 rounded-xl border p-3'>
                      <MapPin className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                      <div>
                        <p className='text-xs text-muted-foreground'>Địa điểm / Link</p>
                        <p className='text-xs break-all'>{booking.diaDiem}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Gói tư vấn</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='rounded-xl border p-3'>
                    <p className='text-xs text-muted-foreground'>Tên gói</p>
                    <p className='mt-1 text-sm font-semibold'>{booking.tenGoiTuVan}</p>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Tạo lúc</p>
                      <p className='mt-1 text-xs'>
                        {new Date(booking.taLuc).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className='rounded-xl border p-3'>
                      <p className='text-xs text-muted-foreground'>Cập nhật cuối</p>
                      <p className='mt-1 text-xs'>
                        {new Date(booking.capNhatLuc).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <Card className='border-dashed'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <MessageSquare className='size-4 text-muted-foreground' />
                    Phòng chat với User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='mb-3 text-sm text-muted-foreground'>
                    Mở room chat riêng để trao đổi. Phòng chỉ mở khi booking đã check-in và sẽ khóa sau giờ kết thúc.
                  </p>
                  <Button size='sm' variant='outline' asChild className='w-full'>
                    <Link to={`/nutritionist/bookings/${booking.id}/chat`}>
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
                    onClick={() => openStandaloneCallWindow('nutritionist', booking.id)}
                  >
                    <Video className='mr-1.5 size-3.5' />
                    Vào call video
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Main>

      <Dialog
        open={actionType === 'complete' && actionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionId(null)
            setActionType(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành tư vấn</DialogTitle>
            <DialogDescription>Nhập ghi chú sau tư vấn nếu cần.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Ghi chú</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder='Ghi chú về buổi tư vấn...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setActionId(null)
                setActionType(null)
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleComplete} disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : 'Hoàn thành'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={actionType === 'cancel' && actionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionId(null)
            setActionType(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy booking</DialogTitle>
            <DialogDescription>
              Hành động này sẽ chuyển booking sang trạng thái đã hủy và gửi yêu cầu hoàn tiền qua VNPay nếu booking đã thanh toán.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>
                Lý do hủy <span className='text-destructive'>*</span>
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder='Nhập lý do hủy...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setActionId(null)
                setActionType(null)
              }}
            >
              Đóng
            </Button>
            <Button variant='destructive' onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : 'Hủy booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
