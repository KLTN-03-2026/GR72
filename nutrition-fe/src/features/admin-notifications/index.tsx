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
import { Bell, BellOff, Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type CreateNotificationPayload,
  type Notification,
  createNotification,
  deleteNotification,
  getNotifications,
  updateNotification,
} from '@/services/admin-notifications/api'
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

const PAGE_SIZE = 10

type FormState = { taiKhoanId: string; loai: string; tieuDe: string; noiDung: string; duongDanHanhDong: string }
const DEFAULT_FORM: FormState = { taiKhoanId: '', loai: 'he_thong', tieuDe: '', noiDung: '', duongDanHanhDong: '' }

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'chua_doc' | 'da_doc'>('all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'nhan' | 'gui'>('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotif, setEditingNotif] = useState<Notification | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotifications({
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        huong: directionFilter === 'all' ? undefined : directionFilter,
        page: pagination.pageIndex + 1, limit: pagination.pageSize,
      })
      setNotifications(res.items)
      setPageCount(Math.max(Math.ceil(res.pagination.total / res.pagination.limit), 1))
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Lỗi tải dữ liệu') } finally { setLoading(false) }
  }, [statusFilter, directionFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const openCreate = () => { setEditingNotif(null); setForm(DEFAULT_FORM); setDialogOpen(true) }
  const openEdit = (n: Notification) => { setEditingNotif(n); setForm({ taiKhoanId: String(n.tai_khoan_id), loai: n.loai, tieuDe: n.tieu_de, noiDung: n.noi_dung, duongDanHanhDong: n.duong_dan_hanh_dong ?? '' }); setDialogOpen(true) }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingNotif) {
        await updateNotification(editingNotif.id, { tieuDe: form.tieuDe.trim(), noiDung: form.noiDung.trim(), duongDanHanhDong: form.duongDanHanhDong.trim() || undefined })
        toast.success('Đã cập nhật thông báo.')
      } else {
        const payload: CreateNotificationPayload = { taiKhoanId: Number(form.taiKhoanId), loai: form.loai, tieuDe: form.tieuDe.trim(), noiDung: form.noiDung.trim(), duongDanHanhDong: form.duongDanHanhDong.trim() || undefined }
        await createNotification(payload)
        toast.success('Đã tạo thông báo.')
      }
      setDialogOpen(false); await loadData()
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Thất bại') } finally { setSaving(false) }
  }

  const handleDelete = async (n: Notification) => {
    try { await deleteNotification(n.id); toast.success('Đã xóa thông báo.'); setDeleteTarget(null); await loadData() }
    catch (e) { toast.error(e instanceof ApiError ? e.message : 'Xóa thất bại') }
  }

  const columns = useMemo<ColumnDef<Notification>[]>(() => [
    {
      id: 'recipient',
      header: 'Người nhận',
      cell: ({ row }) => (
        <div><p className='font-medium text-sm'>{row.original.tai_khoan?.ho_ten ?? '—'}</p>
        <p className='text-xs text-muted-foreground'>{row.original.tai_khoan?.email ?? ''}</p></div>
      ),
    },
    {
      id: 'sender',
      header: 'Người gửi',
      cell: ({ row }) => (
        <div>
          {row.original.nguoi_gui ? (
            <p className='font-medium text-sm'>{row.original.nguoi_gui.ho_ten}</p>
          ) : row.original.nguoi_gui_id ? (
            <p className='text-xs text-muted-foreground'>ID: {row.original.nguoi_gui_id}</p>
          ) : (
            <p className='text-xs text-muted-foreground italic'>Hệ thống</p>
          )}
        </div>
      ),
    },
    { accessorKey: 'loai', header: 'Loại', cell: ({ row }) => <Badge variant='outline' className='text-xs'>{row.original.loai}</Badge> },
    { accessorKey: 'tieu_de', header: 'Tiêu đề', cell: ({ row }) => <span className='font-medium'>{row.original.tieu_de}</span> },
    {
      accessorKey: 'trang_thai', header: 'Trạng thái',
      cell: ({ row }) => row.original.trang_thai === 'da_doc'
        ? <Badge className='gap-1 bg-emerald-100 text-emerald-700'><Bell className='size-3' />Đã đọc</Badge>
        : <Badge variant='outline' className='gap-1'><BellOff className='size-3' />Chưa đọc</Badge>,
    },
    { id: 'date', header: 'Ngày tạo', cell: ({ row }) => <span className='text-xs text-muted-foreground'>{new Date(row.original.tao_luc).toLocaleDateString('vi-VN')}</span> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className='flex justify-end gap-1'>
          <Button variant='ghost' size='sm' onClick={() => openEdit(row.original)}><Pencil className='size-4' /></Button>
          <Button variant='ghost' size='sm' className='text-red-600 hover:text-red-700' onClick={() => setDeleteTarget(row.original)}><Trash2 className='size-4' /></Button>
        </div>
      ),
    },
  ], [])

  const table = useReactTable({ data: notifications, columns, state: { pagination }, manualPagination: true, pageCount, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() })

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading title='Quản lý thông báo' description='Tạo và quản lý thông báo hệ thống gửi đến người dùng.' />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={directionFilter} onValueChange={(v) => { setDirectionFilter(v as typeof directionFilter); setPagination((c) => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Hướng' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='nhan'>Đã nhận</SelectItem>
                <SelectItem value='gui'>Đã gửi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPagination((c) => ({ ...c, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='chua_doc'>Chưa đọc</SelectItem>
                <SelectItem value='da_doc'>Đã đọc</SelectItem>
              </SelectContent>
            </Select>
            <div className='ml-auto'><Button onClick={openCreate} className='rounded-sm'><Plus className='mr-1 size-4' />Tạo thông báo</Button></div>
          </div>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có thông báo nào.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingNotif(null) } }}>
        <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>{editingNotif ? <><Pencil className='size-5' />Sửa thông báo</> : <><Mail className='size-5' />Tạo thông báo</>}</DialogTitle>
            <DialogDescription>{editingNotif ? 'Cập nhật nội dung thông báo.' : 'Gửi thông báo đến tài khoản cụ thể.'}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            {!editingNotif && <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'><Label>ID tài khoản <span className='text-red-500'>*</span></Label><Input type='number' min={1} value={form.taiKhoanId} onChange={(e) => setForm(c => ({ ...c, taiKhoanId: e.target.value }))} disabled={saving} className='rounded-sm' /></div>
              <div className='space-y-2'><Label>Loại</Label><Input value={form.loai} onChange={(e) => setForm(c => ({ ...c, loai: e.target.value }))} disabled={saving} className='rounded-sm' placeholder='he_thong' /></div>
            </div>}
            <div className='space-y-2'><Label>Tiêu đề <span className='text-red-500'>*</span></Label><Input value={form.tieuDe} onChange={(e) => setForm(c => ({ ...c, tieuDe: e.target.value }))} disabled={saving} className='rounded-sm' /></div>
            <div className='space-y-2'><Label>Nội dung <span className='text-red-500'>*</span></Label><Textarea value={form.noiDung} onChange={(e) => setForm(c => ({ ...c, noiDung: e.target.value }))} disabled={saving} className='min-h-[80px] rounded-sm' /></div>
            <div className='space-y-2'><Label>Đường dẫn hành động</Label><Input value={form.duongDanHanhDong} onChange={(e) => setForm(c => ({ ...c, duongDanHanhDong: e.target.value }))} disabled={saving} className='rounded-sm' placeholder='/nutrition/packages' /></div>
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)} disabled={saving} className='rounded-sm'>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.tieuDe.trim() || !form.noiDung.trim()} className='rounded-sm'>{editingNotif ? 'Lưu' : 'Gửi thông báo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog open={deleteTarget !== null} title='Xóa thông báo' description={deleteTarget ? `Xóa thông báo "${deleteTarget.tieu_de}"?` : ''} confirmLabel='Xóa' loading={saving}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget) }} />
    </>
  )
}
