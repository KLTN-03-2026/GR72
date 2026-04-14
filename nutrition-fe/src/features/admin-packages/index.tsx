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
import {
  Crown,
  Gift,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import {
  type AdminPackage,
  type AdminPackagePayload,
  type PackageCycleType,
  type PackageStatus,
  createAdminPackage,
  deleteAdminPackage,
  getAdminPackages,
  updateAdminPackage,
} from '@/services/admin-packages/api'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

const PAGE_SIZE = 10

type PackageFormState = {
  tenGoi: string
  slug: string
  moTa: string
  giaNiemYet: number
  giaKhuyenMai: number | null
  thoiHanNgay: number | null
  loaiChuKy: PackageCycleType
  trangThai: PackageStatus
  laGoiMienPhi: boolean
  goiNoiBat: boolean
  thuTuHienThi: number
}

const DEFAULT_FORM: PackageFormState = {
  tenGoi: '',
  slug: '',
  moTa: '',
  giaNiemYet: 0,
  giaKhuyenMai: null,
  thoiHanNgay: 30,
  loaiChuKy: 'thang',
  trangThai: 'ban_nhap',
  laGoiMienPhi: false,
  goiNoiBat: false,
  thuTuHienThi: 1,
}

function getCycleLabel(cycle: PackageCycleType) {
  switch (cycle) {
    case 'thang': return 'Tháng'
    case 'quy': return 'Quý'
    case 'nam': return 'Năm'
    case 'tron_doi': return 'Trọn đời'
    default: return cycle
  }
}

function getStatusLabel(status: PackageStatus) {
  switch (status) {
    case 'ban_nhap': return 'Bản nháp'
    case 'dang_kinh_doanh': return 'Đang kinh doanh'
    case 'ngung_kinh_doanh': return 'Ngừng kinh doanh'
    default: return status
  }
}

function getStatusVariant(status: PackageStatus) {
  switch (status) {
    case 'ban_nhap': return 'outline' as const
    case 'dang_kinh_doanh': return 'secondary' as const
    case 'ngung_kinh_doanh': return 'destructive' as const
    default: return 'outline' as const
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

function PackageFormDialog({
  open,
  editingPackage,
  form,
  saving,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean
  editingPackage: AdminPackage | null
  form: PackageFormState
  saving: boolean
  onOpenChange: (open: boolean) => void
  onFormChange: (patch: Partial<PackageFormState>) => void
  onSubmit: () => void
}) {
  const isEdit = editingPackage !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-sm p-5 sm:max-w-2xl max-h-[90vh] overflow-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isEdit ? <Pencil className='size-5' /> : <Plus className='size-5' />}
            {isEdit ? 'Cập nhật gói dịch vụ' : 'Tạo gói dịch vụ mới'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Chỉnh sửa thông tin và cấu hình gói dịch vụ.'
              : 'Điền đầy đủ thông tin để tạo một gói dịch vụ mới.'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 sm:grid-cols-2'>
          {/* Tên gói */}
          <div className='space-y-2 sm:col-span-2'>
            <Label>Tên gói <span className='text-red-500'>*</span></Label>
            <Input
              value={form.tenGoi}
              onChange={(e) => onFormChange({ tenGoi: e.target.value })}
              placeholder='VD: Gói Premium'
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Slug */}
          <div className='space-y-2'>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => onFormChange({ slug: e.target.value })}
              placeholder='Tự tạo nếu bỏ trống'
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Thứ tự hiển thị */}
          <div className='space-y-2'>
            <Label>Thứ tự hiển thị</Label>
            <Input
              type='number'
              min={0}
              value={form.thuTuHienThi}
              onChange={(e) => onFormChange({ thuTuHienThi: Number(e.target.value) })}
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Giá niêm yết */}
          <div className='space-y-2'>
            <Label>Giá niêm yết (VNĐ) <span className='text-red-500'>*</span></Label>
            <Input
              type='number'
              min={0}
              value={form.giaNiemYet}
              onChange={(e) => onFormChange({ giaNiemYet: Number(e.target.value) })}
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Giá khuyến mãi */}
          <div className='space-y-2'>
            <Label>Giá khuyến mãi (VNĐ)</Label>
            <Input
              type='number'
              min={0}
              value={form.giaKhuyenMai ?? ''}
              onChange={(e) =>
                onFormChange({
                  giaKhuyenMai: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder='Bỏ trống nếu không KM'
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Thời hạn (ngày) */}
          <div className='space-y-2'>
            <Label>Thời hạn (ngày)</Label>
            <Input
              type='number'
              min={1}
              value={form.thoiHanNgay ?? ''}
              onChange={(e) =>
                onFormChange({
                  thoiHanNgay: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder='VD: 30'
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Loại chu kỳ */}
          <div className='space-y-2'>
            <Label>Chu kỳ</Label>
            <Select
              value={form.loaiChuKy}
              onValueChange={(value) => onFormChange({ loaiChuKy: value as PackageCycleType })}
              disabled={saving}
            >
              <SelectTrigger className='rounded-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='thang'>Tháng</SelectItem>
                <SelectItem value='quy'>Quý</SelectItem>
                <SelectItem value='nam'>Năm</SelectItem>
                <SelectItem value='tron_doi'>Trọn đời</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trạng thái */}
          <div className='space-y-2'>
            <Label>Trạng thái</Label>
            <Select
              value={form.trangThai}
              onValueChange={(value) => onFormChange({ trangThai: value as PackageStatus })}
              disabled={saving}
            >
              <SelectTrigger className='rounded-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ban_nhap'>Bản nháp</SelectItem>
                <SelectItem value='dang_kinh_doanh'>Đang kinh doanh</SelectItem>
                <SelectItem value='ngung_kinh_doanh'>Ngừng kinh doanh</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mô tả */}
          <div className='space-y-2 sm:col-span-2'>
            <Label>Mô tả</Label>
            <Textarea
              value={form.moTa}
              onChange={(e) => onFormChange({ moTa: e.target.value })}
              placeholder='Mô tả quyền lợi, tính năng của gói...'
              disabled={saving}
              className='min-h-[80px] rounded-sm'
            />
          </div>

          {/* Switches */}
          <div className='flex items-center justify-between rounded-md border p-3'>
            <div className='space-y-0.5'>
              <Label className='flex items-center gap-1.5'>
                <Gift className='size-4 text-emerald-500' />
                Gói miễn phí
              </Label>
              <p className='text-xs text-muted-foreground'>Gắn mặc định cho user mới</p>
            </div>
            <Switch
              checked={form.laGoiMienPhi}
              onCheckedChange={(checked) => onFormChange({ laGoiMienPhi: checked })}
              disabled={saving}
            />
          </div>

          <div className='flex items-center justify-between rounded-md border p-3'>
            <div className='space-y-0.5'>
              <Label className='flex items-center gap-1.5'>
                <Star className='size-4 text-amber-500' />
                Gói nổi bật
              </Label>
              <p className='text-xs text-muted-foreground'>Highlight trên trang pricing</p>
            </div>
            <Switch
              checked={form.goiNoiBat}
              onCheckedChange={(checked) => onFormChange({ goiNoiBat: checked })}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className='rounded-sm'
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={saving || !form.tenGoi.trim()}
            className='rounded-sm'
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo gói'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminPackages() {
  const router = useRouter()
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | PackageStatus>('all')
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [pageCount, setPageCount] = useState(0)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<AdminPackage | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminPackage | null>(null)
  const [form, setForm] = useState<PackageFormState>(DEFAULT_FORM)

  const loadPackages = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAdminPackages({
        keyword: keyword || undefined,
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setPackages(response.items)
      setPageCount(Math.max(Math.ceil(response.pagination.total / response.pagination.limit), 1))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được danh sách gói')
      setPackages([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    void loadPackages()
  }, [loadPackages])

  const openCreate = () => {
    setEditingPackage(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  const openEdit = (pkg: AdminPackage) => {
    setEditingPackage(pkg)
    setForm({
      tenGoi: pkg.ten_goi,
      slug: pkg.slug,
      moTa: pkg.mo_ta ?? '',
      giaNiemYet: pkg.gia_niem_yet,
      giaKhuyenMai: pkg.gia_khuyen_mai,
      thoiHanNgay: pkg.thoi_han_ngay,
      loaiChuKy: pkg.loai_chu_ky,
      trangThai: pkg.trang_thai,
      laGoiMienPhi: pkg.la_goi_mien_phi,
      goiNoiBat: pkg.goi_noi_bat,
      thuTuHienThi: pkg.thu_tu_hien_thi,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload: AdminPackagePayload = {
        tenGoi: form.tenGoi.trim(),
        slug: form.slug.trim() || undefined,
        moTa: form.moTa.trim() || undefined,
        giaNiemYet: form.giaNiemYet,
        giaKhuyenMai: form.giaKhuyenMai,
        thoiHanNgay: form.thoiHanNgay,
        loaiChuKy: form.loaiChuKy,
        trangThai: form.trangThai,
        laGoiMienPhi: form.laGoiMienPhi,
        goiNoiBat: form.goiNoiBat,
        thuTuHienThi: form.thuTuHienThi,
      }

      if (editingPackage) {
        await updateAdminPackage(editingPackage.id, payload)
        toast.success('Đã cập nhật gói dịch vụ.')
      } else {
        await createAdminPackage(payload)
        toast.success('Đã tạo gói dịch vụ mới.')
      }

      setDialogOpen(false)
      await loadPackages()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = useCallback(
    async (pkg: AdminPackage) => {
      try {
        await deleteAdminPackage(pkg.id)
        toast.success('Đã xóa gói dịch vụ.')
        setDeleteTarget(null)
        await loadPackages()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Xóa thất bại')
      }
    },
    [loadPackages]
  )

  const handleQuickStatusChange = async (pkg: AdminPackage, newStatus: PackageStatus) => {
    try {
      await updateAdminPackage(pkg.id, { trangThai: newStatus })
      toast.success(`Đã chuyển trạng thái sang ${getStatusLabel(newStatus)}.`)
      await loadPackages()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Đổi trạng thái thất bại')
    }
  }

  const columns = useMemo<ColumnDef<AdminPackage>[]>(
    () => [
      {
        accessorKey: 'thu_tu_hien_thi',
        header: '#',
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {row.original.thu_tu_hien_thi}
          </span>
        ),
      },
      {
        accessorKey: 'ten_goi',
        header: 'Tên gói',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.la_goi_mien_phi ? (
              <Gift className='size-4 shrink-0 text-emerald-500' />
            ) : row.original.goi_noi_bat ? (
              <Crown className='size-4 shrink-0 text-amber-500' />
            ) : (
              <Sparkles className='size-4 shrink-0 text-blue-500' />
            )}
            <div>
              <p className='font-semibold'>{row.original.ten_goi}</p>
              <p className='text-xs text-muted-foreground'>{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'gia_niem_yet',
        header: 'Giá',
        cell: ({ row }) => (
          <div>
            {row.original.la_goi_mien_phi ? (
              <span className='font-semibold text-emerald-600'>Miễn phí</span>
            ) : (
              <>
                <p className={`font-semibold ${row.original.gia_khuyen_mai !== null ? 'text-muted-foreground line-through text-xs' : ''}`}>
                  {formatCurrency(row.original.gia_niem_yet)}
                </p>
                {row.original.gia_khuyen_mai !== null && (
                  <p className='font-semibold text-red-600'>
                    {formatCurrency(row.original.gia_khuyen_mai)}
                  </p>
                )}
              </>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'loai_chu_ky',
        header: 'Chu kỳ',
        cell: ({ row }) => (
          <Badge variant='outline'>
            {getCycleLabel(row.original.loai_chu_ky)}
            {row.original.thoi_han_ngay && (
              <span className='ml-1 text-muted-foreground'>
                ({row.original.thoi_han_ngay}d)
              </span>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: 'trang_thai',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Select
            value={row.original.trang_thai}
            onValueChange={(value) =>
              handleQuickStatusChange(row.original, value as PackageStatus)
            }
          >
            <SelectTrigger className='h-8 w-[175px] rounded-sm text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ban_nhap'>Bản nháp</SelectItem>
              <SelectItem value='dang_kinh_doanh'>Đang kinh doanh</SelectItem>
              <SelectItem value='ngung_kinh_doanh'>Ngừng kinh doanh</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        id: 'tags',
        header: 'Gắn nhãn',
        cell: ({ row }) => (
          <div className='flex gap-1'>
            {row.original.la_goi_mien_phi && (
              <Badge variant='secondary' className='text-xs'>
                <Gift className='mr-0.5 size-3' /> Free
              </Badge>
            )}
            {row.original.goi_noi_bat && (
              <Badge className='bg-amber-100 text-amber-800 text-xs hover:bg-amber-100'>
                <Star className='mr-0.5 size-3' /> Nổi bật
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='flex justify-end gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push(`/admin/packages/${row.original.id}/features`)}
              title='Cấu hình chức năng'
            >
              <Settings className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => openEdit(row.original)}
            >
              <Pencil className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-red-600 hover:text-red-700'
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
        ),
      },
    ],
    [loadPackages]
  )

  const table = useReactTable({
    data: packages,
    columns,
    state: { pagination },
    manualPagination: true,
    pageCount,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <PageHeading
          title='Quản lý gói dịch vụ'
          description='Tạo và quản lý các gói dịch vụ Free / Premium. Mỗi gói xác định quyền truy cập tính năng và thời hạn sử dụng.'
        />

        <div className='space-y-4'>
          {/* Toolbar */}
          <div className='flex flex-wrap items-center gap-3'>
            <Input
              placeholder='Tìm theo tên gói...'
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPagination((c) => ({ ...c, pageIndex: 0 }))
              }}
              className='w-full max-w-xs rounded-sm'
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | PackageStatus)
                setPagination((c) => ({ ...c, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[200px] rounded-sm'>
                <SelectValue placeholder='Lọc trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='ban_nhap'>Bản nháp</SelectItem>
                <SelectItem value='dang_kinh_doanh'>Đang kinh doanh</SelectItem>
                <SelectItem value='ngung_kinh_doanh'>Ngừng kinh doanh</SelectItem>
              </SelectContent>
            </Select>

            <div className='ml-auto'>
              <Button onClick={openCreate} className='rounded-sm'>
                <Plus className='mr-1 size-4' />
                Tạo gói mới
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      Đang tải danh sách gói dịch vụ...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center text-muted-foreground'
                    >
                      Chưa có gói dịch vụ nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      {/* Form Dialog */}
      <PackageFormDialog
        open={dialogOpen}
        editingPackage={editingPackage}
        form={form}
        saving={saving}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false)
            setEditingPackage(null)
          }
        }}
        onFormChange={(patch) => setForm((c) => ({ ...c, ...patch }))}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirm */}
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa gói dịch vụ'
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa gói "${deleteTarget.ten_goi}"? Gói sẽ được xóa mềm.`
            : ''
        }
        confirmLabel='Xóa gói'
        loading={saving}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget)
        }}
      />
    </>
  )
}
