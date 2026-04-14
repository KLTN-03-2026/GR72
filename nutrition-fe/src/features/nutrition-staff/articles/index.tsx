'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ColumnDef, type PaginationState, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Archive, Eye, Globe, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NArticle, archiveNutriArticle, createNutriArticle, deleteNutriArticle, getNutriArticles, publishNutriArticle, updateNutriArticle } from '@/services/nutritionist/api'
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
  switch (s) {
    case 'ban_nhap': return <Badge variant='outline'>Bản nháp</Badge>
    case 'xuat_ban': return <Badge className='bg-emerald-100 text-emerald-700'>Xuất bản</Badge>
    case 'luu_tru': return <Badge variant='secondary'>Lưu trữ</Badge>
    default: return <Badge variant='outline'>{s}</Badge>
  }
}

type FormState = { tieuDe: string; noiDung: string; danhMuc: string; tomTat: string; huongDanAi: string }
const DEFAULT_FORM: FormState = { tieuDe: '', noiDung: '', danhMuc: '', tomTat: '', huongDanAi: '' }

export function NutritionStaffArticles() {
  const [items, setItems] = useState<NArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NArticle | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NArticle | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriArticles({ trangThai: statusFilter === 'all' ? undefined : statusFilter, page: pagination.pageIndex + 1, limit: pagination.pageSize })
      setItems(res?.items ?? []); setPageCount(Math.max(Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)), 1))
    } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } finally { setLoading(false) }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const openCreate = () => { setEditing(null); setForm(DEFAULT_FORM); setDialogOpen(true) }
  const openEdit = (a: NArticle) => { setEditing(a); setForm({ tieuDe: a.tieu_de, noiDung: a.noi_dung, danhMuc: a.danh_muc ?? '', tomTat: a.tom_tat ?? '', huongDanAi: a.huong_dan_ai ? JSON.stringify(a.huong_dan_ai, null, 2) : '' }); setDialogOpen(true) }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const huongDanAi = form.huongDanAi.trim() ? JSON.parse(form.huongDanAi) : undefined
      if (editing) {
        await updateNutriArticle(editing.id, { tieuDe: form.tieuDe.trim(), noiDung: form.noiDung, danhMuc: form.danhMuc.trim() || undefined, tomTat: form.tomTat.trim() || undefined, huongDanAi })
        toast.success('Đã cập nhật bài viết.')
      } else {
        await createNutriArticle({ tieuDe: form.tieuDe.trim(), noiDung: form.noiDung, danhMuc: form.danhMuc.trim() || undefined, tomTat: form.tomTat.trim() || undefined, huongDanAi })
        toast.success('Đã tạo bài viết.')
      }
      setDialogOpen(false); await loadData()
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Thất bại') } finally { setSaving(false) }
  }

  const handlePublish = async (a: NArticle) => { try { await publishNutriArticle(a.id); toast.success('Đã xuất bản.'); await loadData() } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } }
  const handleArchive = async (a: NArticle) => { try { await archiveNutriArticle(a.id); toast.success('Đã lưu trữ.'); await loadData() } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } }
  const handleDelete = async (a: NArticle) => { try { await deleteNutriArticle(a.id); toast.success('Đã xóa.'); setDeleteTarget(null); await loadData() } catch (e) { toast.error(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Lỗi không xác định')) } }

  const columns = useMemo<ColumnDef<NArticle>[]>(() => [
    { accessorKey: 'tieu_de', header: 'Tiêu đề', cell: ({ row }) => <span className='font-medium'>{row.original.tieu_de}</span> },
    { accessorKey: 'danh_muc', header: 'Danh mục', cell: ({ row }) => <span className='text-sm'>{row.original.danh_muc ?? '—'}</span> },
    { accessorKey: 'trang_thai', header: 'Trạng thái', cell: ({ row }) => statusBadge(row.original.trang_thai) },
    { id: 'ai', header: 'Guideline AI', cell: ({ row }) => row.original.huong_dan_ai ? <Badge variant='secondary' className='text-xs'>Có</Badge> : <span className='text-xs text-muted-foreground'>—</span> },
    { id: 'date', header: 'Ngày tạo', cell: ({ row }) => <span className='text-xs text-muted-foreground'>{new Date(row.original.tao_luc).toLocaleDateString('vi-VN')}</span> },
    { id: 'actions', header: '', cell: ({ row }) => {
      const a = row.original
      return (
        <div className='flex justify-end gap-1'>
          <Button variant='ghost' size='sm' onClick={() => openEdit(a)}><Pencil className='size-4' /></Button>
          {a.trang_thai === 'ban_nhap' && <Button variant='ghost' size='sm' onClick={() => handlePublish(a)} title='Xuất bản'><Globe className='size-4 text-emerald-600' /></Button>}
          {a.trang_thai === 'xuat_ban' && <Button variant='ghost' size='sm' onClick={() => handleArchive(a)} title='Lưu trữ'><Archive className='size-4 text-amber-600' /></Button>}
          <Button variant='ghost' size='sm' className='text-red-600' onClick={() => setDeleteTarget(a)}><Trash2 className='size-4' /></Button>
        </div>
      )
    }},
  ], [])

  const table = useReactTable({ data: items, columns, state: { pagination }, manualPagination: true, pageCount, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() })
  const rows = (() => { try { return table.getRowModel().rows } catch { return [] } })()

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <PageHeading title='Quản lý bài viết & Guideline AI' description='Tạo bài viết chuyên môn, quản lý nội dung xuất bản và guideline tri thức nền cho AI.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination(c => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value='all'>Tất cả</SelectItem><SelectItem value='ban_nhap'>Bản nháp</SelectItem><SelectItem value='xuat_ban'>Xuất bản</SelectItem><SelectItem value='luu_tru'>Lưu trữ</SelectItem></SelectContent>
            </Select>
            <div className='ml-auto'><Button onClick={openCreate} className='rounded-sm'><Plus className='mr-1 size-4' />Tạo bài viết</Button></div>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : rows.length > 0 ? rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có bài viết.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(null) } }}>
        <DialogContent className='rounded-sm p-5 sm:max-w-2xl max-h-[90vh] overflow-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Sửa bài viết' : 'Tạo bài viết'}</DialogTitle><DialogDescription>{editing ? 'Cập nhật nội dung bài viết.' : 'Tạo bài viết mới cho hệ thống.'}</DialogDescription></DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'><Label>Tiêu đề <span className='text-red-500'>*</span></Label><Input value={form.tieuDe} onChange={e => setForm(c => ({ ...c, tieuDe: e.target.value }))} className='rounded-sm' /></div>
              <div className='space-y-2'><Label>Danh mục</Label><Input value={form.danhMuc} onChange={e => setForm(c => ({ ...c, danhMuc: e.target.value }))} className='rounded-sm' placeholder='dinh_duong, suc_khoe...' /></div>
            </div>
            <div className='space-y-2'><Label>Tóm tắt</Label><Textarea value={form.tomTat} onChange={e => setForm(c => ({ ...c, tomTat: e.target.value }))} className='rounded-sm' /></div>
            <div className='space-y-2'><Label>Nội dung <span className='text-red-500'>*</span></Label><Textarea value={form.noiDung} onChange={e => setForm(c => ({ ...c, noiDung: e.target.value }))} className='min-h-[120px] rounded-sm' /></div>
            <div className='space-y-2'><Label>Guideline AI (JSON, tùy chọn)</Label><Textarea value={form.huongDanAi} onChange={e => setForm(c => ({ ...c, huongDanAi: e.target.value }))} className='min-h-[80px] font-mono text-xs rounded-sm' placeholder='{"rule":"...","context":"..."}' /></div>
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)} className='rounded-sm'>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.tieuDe.trim() || !form.noiDung.trim()} className='rounded-sm'>{editing ? 'Lưu' : 'Tạo bài viết'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog open={deleteTarget !== null} title='Xóa bài viết' description={deleteTarget ? `Xóa "${deleteTarget.tieu_de}"?` : ''} confirmLabel='Xóa' loading={saving} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }} onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget) }} />
    </>
  )
}
