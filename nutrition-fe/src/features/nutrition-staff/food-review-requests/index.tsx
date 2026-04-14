'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ColumnDef, type PaginationState, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { CheckCircle, Clock, Eye, Plus, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NFoodReview, createNutriFoodReview, getNutriFoodReviews } from '@/services/nutritionist/api'
import { Link } from '@/lib/router'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

function getStatusBadge(s: string) {
  switch (s) {
    case 'cho_duyet': return <Badge variant='outline' className='gap-1'><Clock className='size-3' />Chờ duyệt</Badge>
    case 'da_duyet': return <Badge className='gap-1 bg-emerald-100 text-emerald-700'><CheckCircle className='size-3' />Đã duyệt</Badge>
    case 'tu_choi': return <Badge variant='destructive' className='gap-1'><XCircle className='size-3' />Từ chối</Badge>
    default: return <Badge variant='outline'>{s}</Badge>
  }
}

export function NutritionStaffFoodReviewRequests() {
  const [items, setItems] = useState<NFoodReview[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ thucPhamId: '', loaiYeuCau: 'chinh_sua', lyDo: '', duLieuDeXuat: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriFoodReviews({ trangThai: statusFilter === 'all' ? undefined : statusFilter, page: pagination.pageIndex + 1, limit: pagination.pageSize })
      setItems(res?.items ?? []); setPageCount(Math.max(Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)), 1))
    } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } finally { setLoading(false) }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      let parsed: Record<string, unknown> = {}
      try { parsed = JSON.parse(form.duLieuDeXuat) } catch { toast.error('Dữ liệu đề xuất không hợp lệ (JSON)'); setSaving(false); return }
      await createNutriFoodReview({
        thucPhamId: form.thucPhamId ? Number(form.thucPhamId) : undefined,
        loaiYeuCau: form.loaiYeuCau, duLieuDeXuat: parsed,
        lyDo: form.lyDo.trim() || undefined,
      })
      toast.success('Đã gửi đề xuất thành công. Admin sẽ được thông báo.')
      setDialogOpen(false); setForm({ thucPhamId: '', loaiYeuCau: 'chinh_sua', lyDo: '', duLieuDeXuat: '' }); await loadData()
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Thất bại') } finally { setSaving(false) }
  }

  const columns = useMemo<ColumnDef<NFoodReview>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <code className='text-xs'>#{row.original.id}</code> },
    { accessorKey: 'loai_yeu_cau', header: 'Loại', cell: ({ row }) => <Badge variant='outline' className='text-xs'>{row.original.loai_yeu_cau}</Badge> },
    { accessorKey: 'trang_thai', header: 'Trạng thái', cell: ({ row }) => getStatusBadge(row.original.trang_thai) },
    { id: 'reason', header: 'Lý do', cell: ({ row }) => <span className='text-sm line-clamp-1'>{row.original.ly_do ?? '—'}</span> },
    { id: 'note', header: 'Ghi chú duyệt', cell: ({ row }) => <span className='text-sm line-clamp-1 text-muted-foreground'>{row.original.ghi_chu_duyet ?? '—'}</span> },
    { id: 'date', header: 'Ngày tạo', cell: ({ row }) => <span className='text-xs text-muted-foreground'>{new Date(row.original.tao_luc).toLocaleDateString('vi-VN')}</span> },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <Button variant='outline' size='sm' className='rounded-sm' asChild>
          <Link to={`/nutritionist/food-review-requests/${row.original.id}`}>
            <Eye className='mr-1 size-4' />
            Xem chi tiết
          </Link>
        </Button>
      ),
    },
  ], [])

  const table = useReactTable({ data: items, columns, state: { pagination }, manualPagination: true, pageCount, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() })
  const rows = (() => { try { return table.getRowModel().rows } catch { return [] } })()

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <PageHeading title='Đề xuất sửa dữ liệu' description='Theo dõi trạng thái các đề xuất sửa dữ liệu thực phẩm đã gửi.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination(c => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='cho_duyet'>Chờ duyệt</SelectItem>
                <SelectItem value='da_duyet'>Đã duyệt</SelectItem>
                <SelectItem value='tu_choi'>Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <div className='ml-auto'><Button onClick={() => setDialogOpen(true)} className='rounded-sm'><Plus className='mr-1 size-4' />Tạo đề xuất</Button></div>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : rows.length > 0 ? rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có đề xuất nào.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
          <DialogHeader><DialogTitle>Tạo đề xuất sửa dữ liệu</DialogTitle><DialogDescription>Gửi đề xuất chỉnh sửa đến admin để duyệt.</DialogDescription></DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'><Label>ID thực phẩm</Label><Input type='number' value={form.thucPhamId} onChange={e => setForm(c => ({ ...c, thucPhamId: e.target.value }))} className='rounded-sm' placeholder='Để trống nếu tạo mới' /></div>
              <div className='space-y-2'><Label>Loại yêu cầu</Label><Input value={form.loaiYeuCau} onChange={e => setForm(c => ({ ...c, loaiYeuCau: e.target.value }))} className='rounded-sm' /></div>
            </div>
            <div className='space-y-2'><Label>Lý do</Label><Textarea value={form.lyDo} onChange={e => setForm(c => ({ ...c, lyDo: e.target.value }))} className='rounded-sm' /></div>
            <div className='space-y-2'><Label>Dữ liệu đề xuất (JSON) <span className='text-red-500'>*</span></Label><Textarea value={form.duLieuDeXuat} onChange={e => setForm(c => ({ ...c, duLieuDeXuat: e.target.value }))} className='min-h-[100px] font-mono text-xs rounded-sm' placeholder='{"ten":"Cá hồi","calories_100g":208}' /></div>
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)} className='rounded-sm'>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.duLieuDeXuat.trim()} className='rounded-sm'>{saving ? 'Đang gửi...' : 'Gửi đề xuất'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
