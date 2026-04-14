'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { BadgeCheck, CreditCard, User } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type Payment,
  type PaymentStatus,
  confirmPayment,
  getPayments,
} from '@/services/admin-payments/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

const PAGE_SIZE = 10

function getStatusLabel(s: PaymentStatus) {
  switch (s) {
    case 'cho_thanh_toan': return 'Chờ thanh toán'
    case 'thanh_cong': return 'Thành công'
    case 'that_bai': return 'Thất bại'
    case 'da_hoan_tien': return 'Đã hoàn tiền'
    default: return s
  }
}

function getStatusVariant(s: PaymentStatus) {
  switch (s) {
    case 'cho_thanh_toan': return 'outline' as const
    case 'thanh_cong': return 'secondary' as const
    case 'that_bai': return 'destructive' as const
    case 'da_hoan_tien': return 'destructive' as const
    default: return 'outline' as const
  }
}

function getMethodLabel(m: string) {
  switch (m) {
    case 'chuyen_khoan': return 'Chuyển khoản'
    case 'vi_dien_tu': return 'Ví điện tử'
    case 'cong_thanh_toan': return 'Cổng thanh toán'
    case 'thu_cong': return 'Thủ công'
    case 'mien_phi': return 'Miễn phí'
    default: return m
  }
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null)
  const [confirming, setConfirming] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPayments({
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setPayments(res.items)
      setPageCount(Math.max(Math.ceil(res.pagination.total / res.pagination.limit), 1))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadPayments() }, [loadPayments])

  const handleConfirm = async (payment: Payment) => {
    setConfirming(true)
    try {
      await confirmPayment(payment.id)
      toast.success('Xác nhận thanh toán thành công. Gói đã được kích hoạt.')
      setConfirmTarget(null)
      await loadPayments()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Xác nhận thất bại')
    } finally {
      setConfirming(false)
    }
  }

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    {
      accessorKey: 'ma_giao_dich',
      header: 'Mã giao dịch',
      cell: ({ row }) => (
        <code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono'>
          {row.original.ma_giao_dich}
        </code>
      ),
    },
    {
      id: 'user',
      header: 'Người dùng',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <User className='size-4 text-muted-foreground shrink-0' />
          <div>
            <p className='font-medium text-sm'>{row.original.tai_khoan?.ho_ten ?? '—'}</p>
            <p className='text-xs text-muted-foreground'>{row.original.tai_khoan?.email ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'package',
      header: 'Gói',
      cell: ({ row }) => <span className='font-medium text-sm'>{row.original.goi_dich_vu?.ten_goi ?? '—'}</span>,
    },
    {
      accessorKey: 'so_tien',
      header: 'Số tiền',
      cell: ({ row }) => <span className='font-semibold'>{formatCurrency(row.original.so_tien)}</span>,
    },
    {
      accessorKey: 'phuong_thuc_thanh_toan',
      header: 'Phương thức',
      cell: ({ row }) => <Badge variant='outline' className='text-xs'>{getMethodLabel(row.original.phuong_thuc_thanh_toan)}</Badge>,
    },
    {
      accessorKey: 'trang_thai',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.trang_thai)}>
          {getStatusLabel(row.original.trang_thai)}
        </Badge>
      ),
    },
    {
      id: 'date',
      header: 'Ngày tạo',
      cell: ({ row }) => <span className='text-xs text-muted-foreground'>{formatDate(row.original.tao_luc)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const p = row.original
        if (p.trang_thai === 'cho_thanh_toan' && ['chuyen_khoan', 'thu_cong'].includes(p.phuong_thuc_thanh_toan)) {
          return (
            <Button size='sm' variant='outline' className='rounded-sm text-xs' onClick={() => setConfirmTarget(p)}>
              <BadgeCheck className='mr-1 size-3.5' />
              Xác nhận
            </Button>
          )
        }
        return null
      },
    },
  ], [])

  const table = useReactTable({
    data: payments, columns,
    state: { pagination }, manualPagination: true, pageCount,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading title='Quản lý thanh toán' description='Theo dõi giao dịch thanh toán gói dịch vụ và xác nhận thủ công cho chuyển khoản.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as 'all' | PaymentStatus); setPagination((c) => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[200px] rounded-sm'><SelectValue placeholder='Lọc trạng thái' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='cho_thanh_toan'>Chờ thanh toán</SelectItem>
                <SelectItem value='thanh_cong'>Thành công</SelectItem>
                <SelectItem value='that_bai'>Thất bại</SelectItem>
                <SelectItem value='da_hoan_tien'>Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (<TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>)
                : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>
                )) : (<TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có giao dịch nào.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
      <ConfirmActionDialog
        open={confirmTarget !== null}
        title='Xác nhận thanh toán'
        description={confirmTarget ? `Xác nhận giao dịch "${confirmTarget.ma_giao_dich}" — ${formatCurrency(confirmTarget.so_tien)}? Gói sẽ được kích hoạt tự động.` : ''}
        confirmLabel='Xác nhận'
        loading={confirming}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}
        onConfirm={() => { if (confirmTarget) void handleConfirm(confirmTarget) }}
      />
    </>
  )
}
