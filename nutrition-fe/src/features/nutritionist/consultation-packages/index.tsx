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
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import {
  createNutriPackage,
  deleteNutriPackage,
  getNutriPackages,
  updateNutriPackage,
  type NPackage,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'

const PAGE_SIZE = 10
const MIN_SESSION_DURATION = 15
const MAX_SESSION_DURATION = 240

type PackageFormState = {
  ten: string
  moTa: string
  gia: string
  thoiLuongPhut: string
  trangThai: string
}

const emptyForm: PackageFormState = {
  ten: '',
  moTa: '',
  gia: '',
  thoiLuongPhut: '30',
  trangThai: 'dang_ban',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function statusBadge(status: string) {
  switch (status) {
    case 'dang_ban':
      return <Badge className='bg-green-100 text-green-700 hover:bg-green-100'>Đang bán</Badge>
    case 'ngung_ban':
      return <Badge className='bg-gray-100 text-gray-600 hover:bg-gray-100'>Ngừng bán</Badge>
    case 'ban_nhap':
      return <Badge className='bg-yellow-100 text-yellow-700 hover:bg-yellow-100'>Bản nháp</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export function NutritionistConsultationPackages() {
  const [data, setData] = useState<NPackage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<PackageFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getNutriPackages({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setData(result.items)
      setTotal(result.pagination.total)
    } catch {
      toast.error('Không thể tải danh sách gói tư vấn')
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(item: NPackage) {
    setEditingId(item.id)
    setForm({
      ten: item.ten,
      moTa: item.moTa ?? '',
      gia: String(item.gia),
      thoiLuongPhut: String(item.thoiLuongPhut),
      trangThai: item.trangThai,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.ten.trim()) { toast.error('Vui lòng nhập tên gói'); return }
    const gia = Number(form.gia)
    if (isNaN(gia) || gia < 0) { toast.error('Giá phải >= 0'); return }
    const thoiLuong = Number(form.thoiLuongPhut)
    if (!Number.isInteger(thoiLuong) || thoiLuong < MIN_SESSION_DURATION || thoiLuong > MAX_SESSION_DURATION) {
      toast.error(`Thời lượng mỗi buổi phải trong khoảng ${MIN_SESSION_DURATION}-${MAX_SESSION_DURATION} phút`)
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateNutriPackage(editingId, {
          ten: form.ten.trim(),
          moTa: form.moTa.trim() || undefined,
          gia,
          thoiLuongPhut: thoiLuong,
          trangThai: form.trangThai,
        })
        toast.success('Đã cập nhật gói tư vấn')
      } else {
        await createNutriPackage({
          ten: form.ten.trim(),
          moTa: form.moTa.trim() || undefined,
          gia,
          thoiLuongPhut: thoiLuong,
        })
        toast.success('Đã tạo gói tư vấn')
      }
      setDialogOpen(false)
      loadData()
    } catch {
      toast.error('Không thể lưu gói tư vấn')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteNutriPackage(deleteId)
      toast.success('Đã xóa gói tư vấn')
      setDeleteId(null)
      loadData()
    } catch (e: any) {
      toast.error(e?.message ?? 'Không thể xóa gói tư vấn')
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnDef<NPackage>[] = useMemo(() => [
    {
      accessorKey: 'ten',
      header: 'Tên gói',
      cell: ({ row }) => (
        <div>
          <p className='font-medium'>{row.original.ten}</p>
          {row.original.moTa && (
            <p className='text-xs text-muted-foreground line-clamp-1'>{row.original.moTa}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gia',
      header: 'Giá',
      cell: ({ row }) => (
        <span className='font-medium'>{formatCurrency(row.original.gia)}</span>
      ),
    },
    {
      accessorKey: 'thoiLuongPhut',
      header: 'Thời lượng mỗi buổi',
      cell: ({ row }) => <span>{row.original.thoiLuongPhut} phút</span>,
    },
    {
      accessorKey: 'soLuotSuDung',
      header: 'Đã sử dụng',
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.original.soLuotSuDung} lượt
        </span>
      ),
    },
    {
      accessorKey: 'trangThai',
      header: 'Trạng thái',
      cell: ({ row }) => statusBadge(row.original.trangThai),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Button size='icon' variant='ghost' onClick={() => openEdit(row.original)}>
            <Pencil className='size-4' />
          </Button>
          <Button size='icon' variant='ghost' onClick={() => setDeleteId(row.original.id)}>
            <Trash2 className='size-4 text-destructive' />
          </Button>
        </div>
      ),
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
          title='Gói tư vấn'
          description='Quản lý các gói tư vấn dinh dưỡng của bạn.'
          actions={[
            {
              label: 'Tạo gói mới',
              onClick: openCreate,
            },
          ]}
        />

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
                    <Package className='mx-auto mb-2 size-8 opacity-30' />
                    <p>Chưa có gói tư vấn nào.</p>
                    <p className='text-sm'>Nhấn &quot;Tạo gói mới&quot; để bắt đầu.</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className='border-b'>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Sửa gói tư vấn' : 'Tạo gói tư vấn mới'}</DialogTitle>
            <DialogDescription>
              Điền thông tin gói tư vấn. Gói sẽ hiển thị trên trang profile công khai.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Tên gói <span className='text-destructive'>*</span></Label>
              <Input
                value={form.ten}
                onChange={(e) => setForm((f) => ({ ...f, ten: e.target.value }))}
                placeholder='Ví dụ: Gói cơ bản 30 phút'
              />
            </div>

            <div className='space-y-2'>
              <Label>Mô tả</Label>
              <Textarea
                value={form.moTa}
                onChange={(e) => setForm((f) => ({ ...f, moTa: e.target.value }))}
                rows={3}
                placeholder='Mô tả chi tiết về gói tư vấn...'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Giá (VNĐ) <span className='text-destructive'>*</span></Label>
                <Input
                  type='number'
                  value={form.gia}
                  onChange={(e) => setForm((f) => ({ ...f, gia: e.target.value }))}
                  placeholder='150000'
                  min={0}
                />
              </div>
              <div className='space-y-2'>
                <Label>Thời lượng mỗi buổi (phút) <span className='text-destructive'>*</span></Label>
                <Input
                  type='number'
                  value={form.thoiLuongPhut}
                  onChange={(e) => setForm((f) => ({ ...f, thoiLuongPhut: e.target.value }))}
                  placeholder='30'
                  min={MIN_SESSION_DURATION}
                  max={MAX_SESSION_DURATION}
                  step={15}
                />
                <p className='text-xs text-muted-foreground'>
                  Mỗi gói hiện tương ứng với 1 buổi tư vấn. Thời lượng hợp lệ: {MIN_SESSION_DURATION}-{MAX_SESSION_DURATION} phút.
                </p>
              </div>
            </div>

            {editingId && (
              <div className='space-y-2'>
                <Label>Trạng thái</Label>
                <Select value={form.trangThai} onValueChange={(v) => setForm((f) => ({ ...f, trangThai: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='dang_ban'>Đang bán</SelectItem>
                    <SelectItem value='ngung_ban'>Ngừng bán</SelectItem>
                    <SelectItem value='ban_nhap'>Bản nháp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmActionDialog
        open={deleteId !== null}
        onOpenChange={(v) => { if (!v) setDeleteId(null) }}
        title='Xóa gói tư vấn'
        description='Bạn có chắc muốn xóa gói tư vấn này? Hành động không thể hoàn tác.'
        confirmLabel='Xóa'
        loading={deleting}
        onConfirm={handleDelete}
        destructive
      />
    </>
  )
}
