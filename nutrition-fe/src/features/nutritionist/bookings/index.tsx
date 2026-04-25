'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import {
  CalendarRange,
  CheckCircle,
  Clock3,
  DollarSign,
  Eye,
  MessageSquare,
  Star,
  Video,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getNutriBookings,
  completeNutriBooking,
  cancelNutriBooking,
  type NBooking,
} from '@/services/nutritionist/api'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { openStandaloneCallWindow } from '@/features/consultation-call/open-window'

const PAGE_SIZE = 10

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

function getPaymentRefundBadge(paymentStatus: string | null, refundStatus: NBooking['refundStatus']) {
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

function formatDateVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function NutritionistBookings() {
  const [data, setData] = useState<NBooking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [actionId, setActionId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'complete' | 'cancel' | null>(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }
      if (statusFilter) params.trangThai = statusFilter

      const result = await getNutriBookings(params)
      setData(result.items)
      setTotal(result.pagination.total)
    } catch {
      toast.error('Không thể tải danh sách booking')
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, statusFilter])

  useEffect(() => { void loadData() }, [loadData])

  async function handleComplete() {
    if (!actionId || actionType !== 'complete') return
    setActionLoading(true)
    try {
      await completeNutriBooking(actionId, { ghiChu: note.trim() || undefined })
      toast.success('Đã hoàn thành tư vấn')
      setActionId(null)
      setActionType(null)
      setNote('')
      await loadData()
    } catch {
      toast.error('Không thể hoàn thành')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!actionId || actionType !== 'cancel') return
    if (!note.trim()) { toast.error('Vui lòng nhập lý do hủy'); return }
    setActionLoading(true)
    try {
      const updated = await cancelNutriBooking(actionId, { lyDoHuy: note.trim() })
      toast.success(updated.refundMessage ?? 'Đã hủy booking')
      setActionId(null)
      setActionType(null)
      setNote('')
      await loadData()
    } catch {
      toast.error('Không thể hủy booking')
    } finally {
      setActionLoading(false)
    }
  }

  function openCompleteDialog(id: number) {
    setActionId(id)
    setActionType('complete')
    setNote('')
  }

  function openCancelDialog(id: number) {
    setActionId(id)
    setActionType('cancel')
    setNote('')
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Quản lý Booking'
          description='Nhận và xử lý các lịch hẹn tư vấn từ người dùng.'
        />

        <div className='flex flex-wrap items-center gap-3'>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          >
            <SelectTrigger className='w-52'>
              <SelectValue placeholder='Tất cả trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='cho_thanh_toan'>Chờ thanh toán</SelectItem>
              <SelectItem value='da_xac_nhan'>Đã xác nhận</SelectItem>
              <SelectItem value='da_checkin'>Đã check-in</SelectItem>
              <SelectItem value='dang_tu_van'>Đang tư vấn</SelectItem>
              <SelectItem value='hoan_thanh'>Hoàn thành</SelectItem>
              <SelectItem value='da_huy'>Đã hủy</SelectItem>
              <SelectItem value='vo_hieu_hoa'>Vô hiệu hóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-52 animate-pulse rounded-xl border bg-muted/30' />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-16'>
            <CalendarRange className='size-8 text-muted-foreground/30' />
            <p className='mt-4 font-medium text-muted-foreground'>Chưa có booking nào</p>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {data.map((booking) => {
              const canAct =
                booking.trangThai === 'da_checkin' || booking.trangThai === 'dang_tu_van'
              return (
                <div
                  key={booking.id}
                  className='flex flex-col rounded-xl border p-4 transition hover:border-primary/30 hover:shadow-sm'
                >
                  <div className='mb-3 flex flex-wrap items-start justify-between gap-2'>
                    <div>
                      <p className='font-mono text-xs font-semibold text-muted-foreground'>
                        {booking.maLichHen}
                      </p>
                      <p className='mt-0.5 text-sm font-semibold'>{booking.tenUser}</p>
                    </div>
                    {getStatusBadge(booking.trangThai)}
                  </div>

                  <div className='mb-3 space-y-1.5'>
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <CalendarRange className='size-3.5 shrink-0' />
                      <span>{formatDateVN(booking.ngayHen)}</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <Clock3 className='size-3.5 shrink-0' />
                      <span>
                        {booking.gioBatDau.slice(0, 5)} – {booking.gioKetThuc.slice(0, 5)}
                      </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <Star className='size-3.5 shrink-0' />
                      <span>{booking.tenGoiTuVan}</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs font-medium text-foreground'>
                      <DollarSign className='size-3.5 shrink-0' />
                      <span className='text-emerald-600'>{formatCurrency(booking.giaGoi)}</span>
                    </div>
                  </div>

                  {getPaymentRefundBadge(booking.trangThaiThanhToan, booking.refundStatus) && (
                    <div className='mb-3'>
                      {getPaymentRefundBadge(booking.trangThaiThanhToan, booking.refundStatus)}
                    </div>
                  )}

                  <div className='mt-auto flex flex-wrap gap-1.5'>
                    <Button size='sm' variant='outline' asChild className='flex-1 text-xs'>
                      <Link to={`/nutritionist/bookings/${booking.id}`}>
                        <Eye className='mr-1 size-3' />
                        Chi tiết
                      </Link>
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      asChild
                      className='flex-1 text-xs'
                      title='Vào chat'
                    >
                      <Link to={`/nutritionist/bookings/${booking.id}/chat`}>
                        <MessageSquare className='mr-1 size-3' />
                        Chat
                      </Link>
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      type='button'
                      className='flex-1 text-xs'
                      title='Vào call'
                      onClick={() => openStandaloneCallWindow('nutritionist', booking.id)}
                    >
                      <Video className='mr-1 size-3' />
                      Call
                    </Button>
                    {canAct && (
                      <>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-8 w-8 p-0'
                          onClick={() => openCompleteDialog(booking.id)}
                          title='Hoàn thành'
                        >
                          <CheckCircle className='size-4 text-green-600' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-8 w-8 p-0'
                          onClick={() => openCancelDialog(booking.id)}
                          title='Hủy'
                        >
                          <XCircle className='size-4 text-red-600' />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && data.length > 0 && (
          <PaginationControls
            page={pagination.pageIndex + 1}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            onPageChange={(next) => setPagination((p) => ({ ...p, pageIndex: next - 1 }))}
          />
        )}
      </Main>

      {/* Complete Action Dialog */}
      <Dialog open={actionType === 'complete' && actionId !== null} onOpenChange={(v) => { if (!v) { setActionId(null); setActionType(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành tư vấn</DialogTitle>
            <DialogDescription>Nhập ghi chú sau tư vấn (nếu có).</DialogDescription>
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
            <Button variant='outline' onClick={() => { setActionId(null); setActionType(null) }}>Hủy</Button>
            <Button onClick={handleComplete} disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : 'Hoàn thành'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Action Dialog */}
      <Dialog open={actionType === 'cancel' && actionId !== null} onOpenChange={(v) => { if (!v) { setActionId(null); setActionType(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy booking</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn hủy booking này? Nếu booking đã thanh toán qua VNPay, hệ thống sẽ gửi yêu cầu hoàn tiền ngay khi hủy.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Lý do hủy <span className='text-destructive'>*</span></Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder='Nhập lý do hủy...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => { setActionId(null); setActionType(null) }}>Hủy</Button>
            <Button variant='destructive' onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : 'Hủy booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
