'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ColumnDef, type PaginationState, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NMealTemplate, createNutriMealTemplate, deleteNutriMealTemplate, getNutriMealTemplates, updateNutriMealTemplate } from '@/services/nutritionist/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
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

function statusBadge(s: string) {
  switch (s) { case 'ban_nhap': return <Badge variant='outline'>Bản nháp</Badge>; case 'xuat_ban': return <Badge className='bg-emerald-100 text-emerald-700'>Xuất bản</Badge>; case 'luu_tru': return <Badge variant='secondary'>Lưu trữ</Badge>; default: return <Badge variant='outline'>{s}</Badge> }
}
function goalLabel(g: string | null) {
  switch (g) { case 'giam_can': return 'Giảm cân'; case 'tang_can': return 'Tăng cân'; case 'giu_can': return 'Giữ cân'; default: return g ?? '—' }
}

type FormState = { tieuDe: string; moTa: string; loaiMucTieu: string; caloriesMucTieu: string }
const DEFAULT_FORM: FormState = { tieuDe: '', moTa: '', loaiMucTieu: '', caloriesMucTieu: '' }

export function NutritionStaffMealTemplates() {
  const [items, setItems] = useState<NMealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NMealTemplate | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NMealTemplate | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriMealTemplates({ trangThai: statusFilter === 'all' ? undefined : statusFilter, page: pagination.pageIndex + 1, limit: pagination.pageSize })
      setItems(res?.items ?? []); setPageCount(Math.max(Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)), 1))
    } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } finally { setLoading(false) }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const openCreate = () => { setEditing(null); setForm(DEFAULT_FORM); setDialogOpen(true) }
  const openEdit = (m: NMealTemplate) => { setEditing(m); setForm({ tieuDe: m.tieu_de, moTa: m.mo_ta ?? '', loaiMucTieu: m.loai_muc_tieu_phu_hop ?? '', caloriesMucTieu: m.calories_muc_tieu?.toString() ?? '' }); setDialogOpen(true) }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editing) {
        await updateNutriMealTemplate(editing.id, { tieuDe: form.tieuDe.trim(), moTa: form.moTa.trim() || undefined, loaiMucTieuPhuHop: form.loaiMucTieu || undefined, caloriesMucTieu: form.caloriesMucTieu ? Number(form.caloriesMucTieu) : undefined })
        toast.success('Đã cập nhật thực đơn mẫu.')
      } else {
        await createNutriMealTemplate({ tieuDe: form.tieuDe.trim(), moTa: form.moTa.trim() || undefined, loaiMucTieuPhuHop: form.loaiMucTieu || undefined, caloriesMucTieu: form.caloriesMucTieu ? Number(form.caloriesMucTieu) : undefined })
        toast.success('Đã tạo thực đơn mẫu.')
      }
      setDialogOpen(false); await loadData()
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Thất bại') } finally { setSaving(false) }
  }

  const handleStatusChange = async (m: NMealTemplate, newStatus: string) => {
    try { await updateNutriMealTemplate(m.id, { trangThai: newStatus }); toast.success('Đã cập nhật.'); await loadData() }
    catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) }
  }

  const handleDelete = async (m: NMealTemplate) => { try { await deleteNutriMealTemplate(m.id); toast.success('Đã xóa.'); setDeleteTarget(null); await loadData() } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } }

  const columns = useMemo<ColumnDef<NMealTemplate>[]>(() => [
    { accessorKey: 'tieu_de', header: 'Tiêu đề', cell: ({ row }) => <span className='font-medium'>{row.original.tieu_de}</span> },
    { id: 'goal', header: 'Mục tiêu', cell: ({ row }) => <Badge variant='outline' className='text-xs'>{goalLabel(row.original.loai_muc_tieu_phu_hop)}</Badge> },
    { id: 'cal', header: 'Kcal', cell: ({ row }) => <span className='text-sm tabular-nums'>{row.original.calories_muc_tieu ?? '—'}</span> },
    { id: 'details', header: 'Chi tiết', cell: ({ row }) => <span className='text-sm'>{row.original.chi_tiet?.length ?? 0} bữa</span> },
    { accessorKey: 'trang_thai', header: 'Trạng thái', cell: ({ row }) => (
      <Select value={row.original.trang_thai} onValueChange={v => handleStatusChange(row.original, v)}>
        <SelectTrigger className='h-7 w-[110px] text-xs rounded-sm'><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value='ban_nhap'>Bản nháp</SelectItem><SelectItem value='xuat_ban'>Xuất bản</SelectItem><SelectItem value='luu_tru'>Lưu trữ</SelectItem></SelectContent>
      </Select>
    )},
    { id: 'date', header: 'Ngày tạo', cell: ({ row }) => <span className='text-xs text-muted-foreground'>{new Date(row.original.tao_luc).toLocaleDateString('vi-VN')}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className='flex justify-end gap-1'>
        <Button variant='ghost' size='sm' onClick={() => openEdit(row.original)}><Pencil className='size-4' /></Button>
        <Button variant='ghost' size='sm' className='text-red-600' onClick={() => setDeleteTarget(row.original)}><Trash2 className='size-4' /></Button>
      </div>
    )},
  ], [])

  const table = useReactTable({ data: items, columns, state: { pagination }, manualPagination: true, pageCount, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() })
  const rows = (() => { try { return table.getRowModel().rows } catch { return [] } })()

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <PageHeading title='Quản lý thực đơn mẫu' description='Xây dựng thực đơn mẫu cho các mục tiêu dinh dưỡng.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPagination(c => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value='all'>Tất cả</SelectItem><SelectItem value='ban_nhap'>Bản nháp</SelectItem><SelectItem value='xuat_ban'>Xuất bản</SelectItem><SelectItem value='luu_tru'>Lưu trữ</SelectItem></SelectContent>
            </Select>
            <div className='ml-auto'><Button onClick={openCreate} className='rounded-sm'><Plus className='mr-1 size-4' />Tạo thực đơn mẫu</Button></div>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : rows.length > 0 ? rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có thực đơn mẫu.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setDialogOpen(false); setEditing(null) } }}>
        <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Sửa thực đơn mẫu' : 'Tạo thực đơn mẫu'}</DialogTitle><DialogDescription>Xây dựng thực đơn mẫu cho hệ thống.</DialogDescription></DialogHeader>
          <div className='grid gap-4'>
            <div className='space-y-2'><Label>Tiêu đề <span className='text-red-500'>*</span></Label><Input value={form.tieuDe} onChange={e => setForm(c => ({ ...c, tieuDe: e.target.value }))} className='rounded-sm' /></div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'><Label>Mục tiêu</Label>
                <Select value={form.loaiMucTieu} onValueChange={v => setForm(c => ({ ...c, loaiMucTieu: v }))}>
                  <SelectTrigger className='rounded-sm'><SelectValue placeholder='Chọn...' /></SelectTrigger>
                  <SelectContent><SelectItem value='giam_can'>Giảm cân</SelectItem><SelectItem value='tang_can'>Tăng cân</SelectItem><SelectItem value='giu_can'>Giữ cân</SelectItem></SelectContent>
                </Select>
              </div>
              <div className='space-y-2'><Label>Calories mục tiêu</Label><Input type='number' value={form.caloriesMucTieu} onChange={e => setForm(c => ({ ...c, caloriesMucTieu: e.target.value }))} className='rounded-sm' /></div>
            </div>
            <div className='space-y-2'><Label>Mô tả</Label><Textarea value={form.moTa} onChange={e => setForm(c => ({ ...c, moTa: e.target.value }))} className='rounded-sm' /></div>
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)} className='rounded-sm'>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.tieuDe.trim()} className='rounded-sm'>{editing ? 'Lưu' : 'Tạo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog open={deleteTarget !== null} title='Xóa thực đơn mẫu' description={deleteTarget ? `Xóa "${deleteTarget.tieu_de}"?` : ''} confirmLabel='Xóa' loading={saving} onOpenChange={o => { if (!o) setDeleteTarget(null) }} onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget) }} />
    </>
  )
}
