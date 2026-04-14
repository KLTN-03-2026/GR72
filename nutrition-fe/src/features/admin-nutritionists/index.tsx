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
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Ban, CheckCircle2, Eye, RefreshCcw, Star } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  type Nutritionist,
  type NutritionistDetail,
  activateNutritionist,
  banNutritionist,
  getNutritionistDetail,
  getNutritionists,
} from '@/services/admin-nutritionist/api'

const PAGE_SIZE = 10
const FIELD_CLASSNAME = 'h-10 rounded-sm'

function getStatusLabel(status: string) {
  switch (status) {
    case 'hoat_dong': return 'Hoạt động'
    case 'bi_khoa': return 'Bị khóa'
    default: return status
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'hoat_dong': return 'default'
    case 'bi_khoa': return 'destructive'
    default: return 'outline'
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(value))
}

export function AdminNutritionists() {
  const [items, setItems] = useState<Nutritionist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<NutritionistDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banTarget, setBanTarget] = useState<Nutritionist | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutritionists({
        trang_thai: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setItems(res.items)
      setPageCount(Math.max(Math.ceil(res.pagination.total / res.pagination.limit), 1))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lỗi tải dữ liệu')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(() => {
    if (!selectedId) return
    let mounted = true
    setDetailLoading(true)
    void getNutritionistDetail(selectedId)
      .then((d) => { if (mounted) setDetail(d) })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : 'Lỗi tải chi tiết'))
      .finally(() => { if (mounted) setDetailLoading(false) })
    return () => { mounted = false }
  }, [selectedId])

  const handleBan = async () => {
    if (!banTarget || !banReason.trim()) return
    setActionLoading(true)
    try {
      await banNutritionist(banTarget.id, banReason.trim())
      toast.success('Đã khóa tài khoản Nutritionist.')
      setBanDialogOpen(false)
      setBanReason('')
      setBanTarget(null)
      setSelectedId(null)
      await loadData()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Khóa thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async (id: number) => {
    setActionLoading(true)
    try {
      await activateNutritionist(id)
      toast.success('Đã kích hoạt lại tài khoản.')
      setSelectedId(null)
      await loadData()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Kích hoạt thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<Nutritionist>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className='font-mono text-sm text-muted-foreground'>{row.original.id}</span> },
    { id: 'ho_ten', header: 'Họ tên', cell: ({ row }) => <p className='font-medium'>{row.original.tai_khoan?.ho_ten ?? '—'}</p> },
    { id: 'email', header: 'Email', cell: ({ row }) => <span className='text-sm'>{row.original.tai_khoan?.email ?? '—'}</span> },
    { accessorKey: 'chuyen_mon', header: 'Chuyên môn', cell: ({ row }) => <span className='text-sm line-clamp-1 max-w-[180px]'>{row.original.chuyen_mon ?? '—'}</span> },
    { id: 'status', header: 'Trạng thái', cell: ({ row }) => <Badge variant={getStatusVariant(row.original.trang_thai) as 'default' | 'outline' | 'destructive'}>{getStatusLabel(row.original.trang_thai)}</Badge> },
    { id: 'rating', header: 'Đánh giá', cell: ({ row }) => (
      <div className='flex items-center gap-1'>
        <Star className='size-3 fill-yellow-400 text-yellow-400' />
        <span className='text-sm font-medium'>{row.original.diem_danh_gia_trung_binh > 0 ? row.original.diem_danh_gia_trung_binh.toFixed(1) : '—'}</span>
        {row.original.so_luot_danh_gia > 0 && <span className='text-xs text-muted-foreground'>({row.original.so_luot_danh_gia})</span>}
      </div>
    )},
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild><Button variant='ghost' className='size-8 p-0'><DotsHorizontalIcon className='size-4' /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuItem onClick={() => { setSelectedId(row.original.id); setDetail(null) }}><Eye className='mr-2 size-4' />Xem chi tiết</DropdownMenuItem>
          <DropdownMenuSeparator />
          {row.original.trang_thai === 'hoat_dong' ? (
            <DropdownMenuItem className='text-red-600' onClick={() => { setBanTarget(row.original); setBanDialogOpen(true); setSelectedId(null) }}><Ban className='mr-2 size-4' />Khóa tài khoản</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => void handleActivate(row.original.id)}><RefreshCcw className='mr-2 size-4' />Kích hoạt lại</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ], [loadData])

  const table = useReactTable({
    data: items, columns,
    state: { pagination },
    manualPagination: true, pageCount,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading title='Quản lý Nutritionist' description='Xem danh sách, khóa hoặc kích hoạt tài khoản Chuyên gia Dinh dưỡng đã được duyệt.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Input placeholder='Tìm theo họ tên hoặc email...' value={search} onChange={(e) => { setSearch(e.target.value); setPagination((c) => ({ ...c, pageIndex: 0 })) }} className='w-full max-w-sm' />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((c) => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Lọc trạng thái' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='hoat_dong'>Hoạt động</SelectItem>
                <SelectItem value='bi_khoa'>Bị khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Không có Nutritionist nào.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>

      <Dialog open={selectedId !== null} onOpenChange={(open) => { if (!open) { setSelectedId(null); setDetail(null) } }}>
        <DialogContent className='rounded-sm p-4 sm:max-w-xl max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Chi tiết Nutritionist</DialogTitle>
            <DialogDescription>Thông tin chuyên môn và thống kê hoạt động.</DialogDescription>
          </DialogHeader>
          {detailLoading ? <div className='py-10 text-center text-sm text-muted-foreground'>Đang tải...</div>
          : detail ? (
            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'><Label>Họ tên</Label><Input value={detail.tai_khoan?.ho_ten ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Email</Label><Input value={detail.tai_khoan?.email ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Trạng thái</Label><Input value={getStatusLabel(detail.trang_thai)} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Số booking</Label><Input value={String(detail.so_booking ?? 0)} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Booking hoàn thành</Label><Input value={String(detail.so_booking_hoan_thanh ?? 0)} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Điểm đánh giá TB</Label><Input value={detail.diem_trung_binh > 0 ? detail.diem_trung_binh.toFixed(2) : '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2 sm:col-span-2'><Label>Chuyên môn</Label><Input value={detail.chuyen_mon ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2 sm:col-span-2'><Label>Mô tả</Label><Textarea value={detail.mo_ta ?? '—'} disabled rows={3} className='rounded-sm' /></div>
                {detail.ngay_duyet && <div className='space-y-2'><Label>Ngày duyệt</Label><Input value={formatDateTime(detail.ngay_duyet)} disabled className={FIELD_CLASSNAME} /></div>}
                {detail.ngay_bi_khoa && <div className='space-y-2'><Label>Ngày khóa</Label><Input value={formatDateTime(detail.ngay_bi_khoa)} disabled className={FIELD_CLASSNAME} /></div>}
                {detail.ly_do_bi_khoa && <div className='space-y-2 sm:col-span-2'><Label>Lý do khóa</Label><Textarea value={detail.ly_do_bi_khoa} disabled rows={2} className='rounded-sm text-red-600' /></div>}
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setSelectedId(null)} className='rounded-sm'>Đóng</Button>
                {detail.trang_thai === 'hoat_dong' && (
                  <Button variant='destructive' className='rounded-sm' onClick={() => { setBanTarget(detail); setBanDialogOpen(true); setSelectedId(null) }}><Ban className='mr-1 size-4' />Khóa tài khoản</Button>
                )}
                {detail.trang_thai === 'bi_khoa' && (
                  <Button className='rounded-sm' onClick={() => void handleActivate(detail.id)}><RefreshCcw className='mr-1 size-4' />Kích hoạt lại</Button>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={banDialogOpen} title='Khóa tài khoản Nutritionist'
        description={`Khóa tài khoản "${banTarget?.tai_khoan?.ho_ten ?? ''}"? Nutritionist sẽ không thể nhận booking mới.`}
        confirmLabel='Khóa tài khoản' loading={actionLoading}
        onOpenChange={(open) => { if (!open) { setBanDialogOpen(false); setBanReason(''); setBanTarget(null) } }}
        onConfirm={() => void handleBan()}
      />

      <Dialog open={banDialogOpen} onOpenChange={(open) => { if (!open) { setBanDialogOpen(false); setBanReason(''); setBanTarget(null) } }}>
        <DialogContent className='rounded-sm p-4 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản Nutritionist</DialogTitle>
            <DialogDescription>Nhập lý do khóa tài khoản. Lý do này sẽ được gửi cho Nutritionist.</DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label>Lý do khóa <span className='text-red-500'>*</span></Label>
            <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder='VD: Vi phạm điều khoản sử dụng...' rows={4} className='rounded-sm' />
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => { setBanDialogOpen(false); setBanReason(''); setBanTarget(null) }} className='rounded-sm'>Hủy</Button>
            <Button variant='destructive' onClick={() => void handleBan()} disabled={actionLoading || !banReason.trim()} className='rounded-sm'>Xác nhận khóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
