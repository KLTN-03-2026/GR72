'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@/lib/router'
import {
  type ColumnDef,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { CalendarRange, CheckCircle, Eye, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  getNutriBookings,
  completeNutriBooking,
  cancelNutriBooking,
  type NBooking,
} from '@/services/nutritionist/api'
import { DataTablePagination } from '@/components/data-table'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

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

function formatDateVN(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':')
  return `${h}:${m}`
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

  const columns: ColumnDef<NBooking>[] = useMemo(() => [
    {
      accessorKey: 'ngayHen',
      header: 'Ngày',
      cell: ({ row }) => formatDateVN(row.original.ngayHen),
    },
    {
      accessorKey: 'gioBatDau',
      header: 'Giờ',
      cell: ({ row }) => `${formatTime(row.original.gioBatDau)} - ${formatTime(row.original.gioKetThuc)}`,
    },
    {
      accessorKey: 'tenUser',
      header: 'User',
      cell: ({ row }) => row.original.tenUser,
    },
    {
      accessorKey: 'tenGoiTuVan',
      header: 'Gói',
      cell: ({ row }) => (
        <div>
          <p className='font-medium'>{row.original.tenGoiTuVan}</p>
          <p className='text-xs text-muted-foreground'>{row.original.thoiLuongPhut} phút</p>
        </div>
      ),
    },
    {
      accessorKey: 'trangThai',
      header: 'Trạng thái',
      cell: ({ row }) => getStatusBadge(row.original.trangThai),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const booking = row.original
        const canAct = booking.trangThai === 'da_checkin' || booking.trangThai === 'dang_tu_van'
        return (
          <div className='flex items-center gap-1'>
            <Button size='icon' variant='ghost' asChild>
              <Link to={`/nutritionist/bookings/${booking.id}`}>
                <Eye className='size-4' />
              </Link>
            </Button>
            {canAct && (
              <>
                <Button size='icon' variant='ghost' onClick={() => openCompleteDialog(booking.id)} title='Hoàn thành'>
                  <CheckCircle className='size-4 text-green-600' />
                </Button>
                <Button size='icon' variant='ghost' onClick={() => openCancelDialog(booking.id)} title='Hủy'>
                  <XCircle className='size-4 text-red-600' />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / PAGE_SIZE),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  })

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Quản lý Booking'
          description='Nhận và xử lý các lịch hẹn tư vấn từ người dùng.'
        />

        {/* Status Filter */}
        <div className='flex items-center gap-4'>
          <Select value={statusFilter} onValueChange={(v) => {
            setStatusFilter(v === 'all' ? '' : v)
            setPagination(p => ({ ...p, pageIndex: 0 }))
          }}>
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

        <div className='rounded-lg border'>
          <table className='w-full'>
            <thead>
              <tr className='border-b bg-muted/50'>
                {table.getHeaderGroups().map((hg) =>
                  hg.headers.map((header) => (
                    <th key={header.id} className='px-4 py-3 text-left text-sm font-medium'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-12 text-center'>
                    <div className='mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-12 text-center text-muted-foreground'>
                    <CalendarRange className='mx-auto mb-2 size-8 opacity-30' />
                    <p>Chưa có booking nào.</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className='border-b hover:bg-muted/50'>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className='px-4 py-3 text-sm'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination table={table} />
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
