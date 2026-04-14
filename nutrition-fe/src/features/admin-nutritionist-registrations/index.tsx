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
import { Check, Eye, X } from 'lucide-react'
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
  type NutritionistRegistration,
  type NutritionistRegistrationDetail,
  approveRegistration,
  getRegistrationDetail,
  getRegistrations,
  rejectRegistration,
} from '@/services/admin-nutritionist/api'

const PAGE_SIZE = 10
const FIELD_CLASSNAME = 'h-10 rounded-sm'

function getStatusLabel(status: string) {
  switch (status) {
    case 'cho_duyet': return 'Chờ duyệt'
    case 'hoat_dong': return 'Đã duyệt'
    case 'tu_choi': return 'Từ chối'
    default: return status
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'cho_duyet': return 'outline'
    case 'hoat_dong': return 'default'
    case 'tu_choi': return 'destructive'
    default: return 'outline'
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(value))
}

export function AdminNutritionistRegistrations() {
  const [items, setItems] = useState<NutritionistRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<NutritionistRegistrationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRegistrations({
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
    void getRegistrationDetail(selectedId)
      .then((d) => { if (mounted) setDetail(d) })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : 'Lỗi tải chi tiết'))
      .finally(() => { if (mounted) setDetailLoading(false) })
    return () => { mounted = false }
  }, [selectedId])

  const handleApprove = async (id: number) => {
    setActionLoading(true)
    try {
      await approveRegistration(id)
      toast.success('Đã duyệt đơn đăng ký.')
      setSelectedId(null)
      await loadData()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Duyệt thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await rejectRegistration(rejectingId, rejectReason.trim())
      toast.success('Đã từ chối đơn.')
      setRejectDialogOpen(false)
      setRejectReason('')
      setRejectingId(null)
      setSelectedId(null)
      await loadData()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Từ chối thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<NutritionistRegistration>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className='font-mono text-sm text-muted-foreground'>{row.original.id}</span> },
    { id: 'ho_ten', header: 'Họ tên', cell: ({ row }) => <p className='font-medium'>{row.original.tai_khoan?.ho_ten ?? '—'}</p> },
    { id: 'email', header: 'Email', cell: ({ row }) => <span className='text-sm'>{row.original.tai_khoan?.email ?? '—'}</span> },
    { accessorKey: 'chuyen_mon', header: 'Chuyên môn', cell: ({ row }) => <span className='text-sm line-clamp-1 max-w-[200px]'>{row.original.chuyen_mon ?? '—'}</span> },
    { id: 'status', header: 'Trạng thái', cell: ({ row }) => <Badge variant={getStatusVariant(row.original.trang_thai) as 'default' | 'outline' | 'destructive'}>{getStatusLabel(row.original.trang_thai)}</Badge> },
    { id: 'tao_luc', header: 'Ngày đăng ký', cell: ({ row }) => <span className='text-xs text-muted-foreground'>{formatDateTime(row.original.tao_luc)}</span> },
    { id: 'actions', header: '', enableSorting: false, cell: ({ row }) => (
      <div className='flex gap-1 justify-end'>
        <Button variant='ghost' size='sm' onClick={() => { setSelectedId(row.original.id); setDetail(null) }}><Eye className='size-4' /></Button>
        {row.original.trang_thai === 'cho_duyet' && (
          <>
            <Button variant='outline' size='sm' className='text-emerald-600' onClick={() => void handleApprove(row.original.id)}><Check className='size-4' /></Button>
            <Button variant='ghost' size='sm' className='text-red-600' onClick={() => { setRejectingId(row.original.id); setRejectDialogOpen(true) }}><X className='size-4' /></Button>
          </>
        )}
      </div>
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
        <PageHeading title='Duyệt đơn đăng ký Nutritionist' description='Xem và duyệt/từ chối đơn đăng ký trở thành nhà cung cấp dịch vụ tư vấn dinh dưỡng.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Input placeholder='Tìm theo họ tên hoặc email...' value={search} onChange={(e) => { setSearch(e.target.value); setPagination((c) => ({ ...c, pageIndex: 0 })) }} className='w-full max-w-sm' />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((c) => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Lọc trạng thái' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='cho_duyet'>Chờ duyệt</SelectItem>
                <SelectItem value='hoat_dong'>Đã duyệt</SelectItem>
                <SelectItem value='tu_choi'>Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Không có đơn đăng ký nào.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>

      <Dialog open={selectedId !== null} onOpenChange={(open) => { if (!open) { setSelectedId(null); setDetail(null) } }}>
        <DialogContent className='rounded-sm p-4 sm:max-w-xl max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
            <DialogDescription>Xem thông tin chuyên môn và credentials của ứng viên.</DialogDescription>
          </DialogHeader>
          {detailLoading ? <div className='py-10 text-center text-sm text-muted-foreground'>Đang tải...</div>
          : detail ? (
            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'><Label>ID</Label><Input value={String(detail.id)} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Ngày đăng ký</Label><Input value={formatDateTime(detail.tao_luc)} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Họ tên</Label><Input value={detail.tai_khoan?.ho_ten ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Email</Label><Input value={detail.tai_khoan?.email ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2 sm:col-span-2'><Label>Chuyên môn</Label><Input value={detail.chuyen_mon ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2 sm:col-span-2'><Label>Mô tả</Label><Textarea value={detail.mo_ta ?? '—'} disabled rows={3} className='rounded-sm' /></div>
                <div className='space-y-2 sm:col-span-2'><Label>Kinh nghiệm</Label><Textarea value={detail.kinh_nghiem ?? '—'} disabled rows={3} className='rounded-sm' /></div>
                <div className='space-y-2'><Label>Học vị</Label><Input value={detail.hoc_vi ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2'><Label>Chứng chỉ</Label><Input value={detail.chung_chi ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                <div className='space-y-2 sm:col-span-2'><Label>Giờ làm việc</Label><Input value={detail.gio_lam_viec ?? '—'} disabled className={FIELD_CLASSNAME} /></div>
                {detail.ly_do_tu_choi && <div className='space-y-2 sm:col-span-2'><Label>Lý do từ chối</Label><Textarea value={detail.ly_do_tu_choi} disabled rows={2} className='rounded-sm text-red-600' /></div>}
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setSelectedId(null)} className='rounded-sm'>Đóng</Button>
                {detail.trang_thai === 'cho_duyet' && (
                  <>
                    <Button variant='outline' className='rounded-sm text-red-600' onClick={() => { setRejectingId(detail.id); setRejectDialogOpen(true); setSelectedId(null) }}><X className='mr-1 size-4' />Từ chối</Button>
                    <Button className='rounded-sm' onClick={() => void handleApprove(detail.id)} disabled={actionLoading}><Check className='mr-1 size-4' />Duyệt</Button>
                  </>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={(open) => { if (!open) { setRejectDialogOpen(false); setRejectReason(''); setRejectingId(null) } }}>
        <DialogContent className='rounded-sm p-4 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Từ chối đơn đăng ký</DialogTitle>
            <DialogDescription>Vui lòng nhập lý do từ chối. Lý do này sẽ được gửi cho người đăng ký.</DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label>Lý do từ chối <span className='text-red-500'>*</span></Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder='VD: Thông tin chuyên môn chưa đầy đủ...' rows={4} className='rounded-sm' />
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => { setRejectDialogOpen(false); setRejectReason(''); setRejectingId(null) }} className='rounded-sm'>Hủy</Button>
            <Button variant='destructive' onClick={() => void handleReject()} disabled={actionLoading || !rejectReason.trim()} className='rounded-sm'>Xác nhận từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
