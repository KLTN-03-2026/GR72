'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ColumnDef, type PaginationState, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NRecipe, createNutriRecipe, deleteNutriRecipe, getNutriRecipes, updateNutriRecipe } from '@/services/nutritionist/api'
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

type FormState = { ten: string; moTa: string; huongDan: string; soKhauPhan: string }
const DEFAULT_FORM: FormState = { ten: '', moTa: '', huongDan: '', soKhauPhan: '' }

export function NutritionStaffRecipes() {
  const [items, setItems] = useState<NRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NRecipe | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NRecipe | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriRecipes({ trangThai: statusFilter === 'all' ? undefined : statusFilter, page: pagination.pageIndex + 1, limit: pagination.pageSize })
      setItems(res?.items ?? []); setPageCount(Math.max(Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)), 1))
    } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } finally { setLoading(false) }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const openCreate = () => { setEditing(null); setForm(DEFAULT_FORM); setDialogOpen(true) }
  const openEdit = (r: NRecipe) => { setEditing(r); setForm({ ten: r.ten, moTa: r.mo_ta ?? '', huongDan: r.huong_dan ?? '', soKhauPhan: r.so_khau_phan?.toString() ?? '' }); setDialogOpen(true) }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editing) {
        await updateNutriRecipe(editing.id, { ten: form.ten.trim(), moTa: form.moTa.trim() || undefined, huongDan: form.huongDan || undefined, soKhauPhan: form.soKhauPhan ? Number(form.soKhauPhan) : undefined })
        toast.success('Đã cập nhật công thức.')
      } else {
        await createNutriRecipe({ ten: form.ten.trim(), moTa: form.moTa.trim() || undefined, huongDan: form.huongDan || undefined, soKhauPhan: form.soKhauPhan ? Number(form.soKhauPhan) : undefined })
        toast.success('Đã tạo công thức.')
      }
      setDialogOpen(false); await loadData()
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Thất bại') } finally { setSaving(false) }
  }

  const handleStatusChange = async (r: NRecipe, newStatus: string) => {
    try { await updateNutriRecipe(r.id, { trangThai: newStatus }); toast.success('Đã cập nhật trạng thái.'); await loadData() }
    catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) }
  }

  const handleDelete = async (r: NRecipe) => { try { await deleteNutriRecipe(r.id); toast.success('Đã xóa.'); setDeleteTarget(null); await loadData() } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } }

  const columns = useMemo<ColumnDef<NRecipe>[]>(() => [
    { accessorKey: 'ten', header: 'Tên công thức', cell: ({ row }) => <span className='font-medium'>{row.original.ten}</span> },
    { id: 'macros', header: 'Macros', cell: ({ row }) => <span className='text-xs tabular-nums'>{row.original.tong_calories ?? 0} kcal · {row.original.tong_protein_g ?? 0}P · {row.original.tong_carb_g ?? 0}C · {row.original.tong_fat_g ?? 0}F</span> },
    { id: 'ingredients', header: 'NL', cell: ({ row }) => <span className='text-sm'>{row.original.thanh_phan?.length ?? 0}</span> },
    { accessorKey: 'trang_thai', header: 'Trạng thái', cell: ({ row }) => (
      <Select value={row.original.trang_thai} onValueChange={(v) => handleStatusChange(row.original, v)}>
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
        <PageHeading title='Quản lý công thức' description='Tạo và quản lý recipe chuẩn cho hệ thống.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPagination(c => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value='all'>Tất cả</SelectItem><SelectItem value='ban_nhap'>Bản nháp</SelectItem><SelectItem value='xuat_ban'>Xuất bản</SelectItem><SelectItem value='luu_tru'>Lưu trữ</SelectItem></SelectContent>
            </Select>
            <div className='ml-auto'><Button onClick={openCreate} className='rounded-sm'><Plus className='mr-1 size-4' />Tạo công thức</Button></div>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : rows.length > 0 ? rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có công thức.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) { setDialogOpen(false); setEditing(null) } }}>
        <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Sửa công thức' : 'Tạo công thức'}</DialogTitle><DialogDescription>Quản lý recipe chuẩn hệ thống.</DialogDescription></DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'><Label>Tên <span className='text-red-500'>*</span></Label><Input value={form.ten} onChange={e => setForm(c => ({ ...c, ten: e.target.value }))} className='rounded-sm' /></div>
              <div className='space-y-2'><Label>Số khẩu phần</Label><Input type='number' value={form.soKhauPhan} onChange={e => setForm(c => ({ ...c, soKhauPhan: e.target.value }))} className='rounded-sm' /></div>
            </div>
            <div className='space-y-2'><Label>Mô tả</Label><Textarea value={form.moTa} onChange={e => setForm(c => ({ ...c, moTa: e.target.value }))} className='rounded-sm' /></div>
            <div className='space-y-2'><Label>Hướng dẫn</Label><Textarea value={form.huongDan} onChange={e => setForm(c => ({ ...c, huongDan: e.target.value }))} className='min-h-[100px] rounded-sm' /></div>
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)} className='rounded-sm'>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.ten.trim()} className='rounded-sm'>{editing ? 'Lưu' : 'Tạo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog open={deleteTarget !== null} title='Xóa công thức' description={deleteTarget ? `Xóa "${deleteTarget.ten}"?` : ''} confirmLabel='Xóa' loading={saving} onOpenChange={o => { if (!o) setDeleteTarget(null) }} onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget) }} />
    </>
  )
}
