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
  CalendarDays,
  Gift,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type CreateSubscriptionPayload,
  type Subscription,
  type SubscriptionSource,
  type SubscriptionStatus,
  createSubscription,
  getSubscriptions,
  updateSubscription,
} from '@/services/admin-subscriptions/api'
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

function getStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case 'cho_kich_hoat': return 'Chờ kích hoạt'
    case 'dang_hoat_dong': return 'Đang hoạt động'
    case 'het_han': return 'Hết hạn'
    case 'da_huy': return 'Đã hủy'
    default: return status
  }
}

function getStatusVariant(status: SubscriptionStatus) {
  switch (status) {
    case 'cho_kich_hoat': return 'outline' as const
    case 'dang_hoat_dong': return 'secondary' as const
    case 'het_han': return 'destructive' as const
    case 'da_huy': return 'destructive' as const
    default: return 'outline' as const
  }
}

function getSourceLabel(source: SubscriptionSource) {
  switch (source) {
    case 'nguoi_dung_tu_nang_cap': return 'User nâng cấp'
    case 'quan_tri_cap': return 'Admin cấp'
    case 'khuyen_mai': return 'Khuyến mãi'
    default: return source
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type CreateFormState = {
  taiKhoanId: string
  goiDichVuId: string
  ngayBatDau: string
  ngayHetHan: string
  tuDongGiaHan: boolean
  nguonDangKy: SubscriptionSource
  ghiChu: string
}

const DEFAULT_CREATE_FORM: CreateFormState = {
  taiKhoanId: '',
  goiDichVuId: '',
  ngayBatDau: '',
  ngayHetHan: '',
  tuDongGiaHan: false,
  nguonDangKy: 'quan_tri_cap',
  ghiChu: '',
}

type EditFormState = {
  trangThai: SubscriptionStatus
  ngayBatDau: string
  ngayHetHan: string
  tuDongGiaHan: boolean
  ghiChu: string
}

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [pageCount, setPageCount] = useState(0)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormState>(DEFAULT_CREATE_FORM)
  const [saving, setSaving] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    trangThai: 'cho_kich_hoat',
    ngayBatDau: '',
    ngayHetHan: '',
    tuDongGiaHan: false,
    ghiChu: '',
  })

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getSubscriptions({
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setSubscriptions(response.items)
      setPageCount(Math.max(Math.ceil(response.pagination.total / response.pagination.limit), 1))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được danh sách')
      setSubscriptions([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    void loadSubscriptions()
  }, [loadSubscriptions])

  const openCreate = () => {
    setCreateForm(DEFAULT_CREATE_FORM)
    setCreateOpen(true)
  }

  const openEdit = (sub: Subscription) => {
    setEditingSubscription(sub)
    setEditForm({
      trangThai: sub.trang_thai,
      ngayBatDau: sub.ngay_bat_dau ? sub.ngay_bat_dau.slice(0, 10) : '',
      ngayHetHan: sub.ngay_het_han ? sub.ngay_het_han.slice(0, 10) : '',
      tuDongGiaHan: sub.tu_dong_gia_han,
      ghiChu: sub.ghi_chu ?? '',
    })
    setEditOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const payload: CreateSubscriptionPayload = {
        taiKhoanId: Number(createForm.taiKhoanId),
        goiDichVuId: Number(createForm.goiDichVuId),
        ngayBatDau: createForm.ngayBatDau || undefined,
        ngayHetHan: createForm.ngayHetHan || undefined,
        tuDongGiaHan: createForm.tuDongGiaHan,
        nguonDangKy: createForm.nguonDangKy,
        ghiChu: createForm.ghiChu.trim() || undefined,
      }
      await createSubscription(payload)
      toast.success('Đã cấp gói cho user.')
      setCreateOpen(false)
      await loadSubscriptions()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Cấp gói thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingSubscription) return
    setSaving(true)
    try {
      await updateSubscription(editingSubscription.id, {
        trangThai: editForm.trangThai,
        ngayBatDau: editForm.ngayBatDau || undefined,
        ngayHetHan: editForm.ngayHetHan || undefined,
        tuDongGiaHan: editForm.tuDongGiaHan,
        ghiChu: editForm.ghiChu.trim() || undefined,
      })
      toast.success('Đã cập nhật đăng ký.')
      setEditOpen(false)
      setEditingSubscription(null)
      await loadSubscriptions()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatusChange = async (sub: Subscription, newStatus: SubscriptionStatus) => {
    try {
      await updateSubscription(sub.id, { trangThai: newStatus })
      toast.success(`Đã chuyển sang ${getStatusLabel(newStatus)}.`)
      await loadSubscriptions()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Đổi trạng thái thất bại')
    }
  }

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      {
        accessorKey: 'ma_dang_ky',
        header: 'Mã đăng ký',
        cell: ({ row }) => (
          <code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono'>
            {row.original.ma_dang_ky}
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
        header: 'Gói dịch vụ',
        cell: ({ row }) => (
          <div className='flex items-center gap-1.5'>
            <Gift className='size-4 text-blue-500 shrink-0' />
            <span className='font-medium text-sm'>
              {row.original.goi_dich_vu?.ten_goi ?? '—'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'trang_thai',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Select
            value={row.original.trang_thai}
            onValueChange={(value) =>
              handleQuickStatusChange(row.original, value as SubscriptionStatus)
            }
          >
            <SelectTrigger className='h-8 w-[165px] rounded-sm text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='cho_kich_hoat'>Chờ kích hoạt</SelectItem>
              <SelectItem value='dang_hoat_dong'>Đang hoạt động</SelectItem>
              <SelectItem value='het_han'>Hết hạn</SelectItem>
              <SelectItem value='da_huy'>Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        id: 'dates',
        header: 'Thời hạn',
        cell: ({ row }) => (
          <div className='flex items-center gap-1.5 text-xs'>
            <CalendarDays className='size-3.5 text-muted-foreground shrink-0' />
            <span>{formatDate(row.original.ngay_bat_dau)}</span>
            <span className='text-muted-foreground'>→</span>
            <span>{formatDate(row.original.ngay_het_han)}</span>
          </div>
        ),
      },
      {
        id: 'source',
        header: 'Nguồn',
        cell: ({ row }) => (
          <Badge variant='outline' className='text-xs'>
            {getSourceLabel(row.original.nguon_dang_ky)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <Button variant='ghost' size='sm' onClick={() => openEdit(row.original)}>
              <Pencil className='size-4' />
            </Button>
          </div>
        ),
      },
    ],
    [loadSubscriptions]
  )

  const table = useReactTable({
    data: subscriptions,
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
          title='Quản lý đăng ký gói'
          description='Theo dõi vòng đời đăng ký gói dịch vụ và cấp gói thủ công cho người dùng.'
        />

        <div className='space-y-4'>
          {/* Toolbar */}
          <div className='flex flex-wrap items-center gap-3'>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | SubscriptionStatus)
                setPagination((c) => ({ ...c, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[200px] rounded-sm'>
                <SelectValue placeholder='Lọc trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='cho_kich_hoat'>Chờ kích hoạt</SelectItem>
                <SelectItem value='dang_hoat_dong'>Đang hoạt động</SelectItem>
                <SelectItem value='het_han'>Hết hạn</SelectItem>
                <SelectItem value='da_huy'>Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <div className='ml-auto'>
              <Button onClick={openCreate} className='rounded-sm'>
                <Plus className='mr-1 size-4' />
                Cấp gói thủ công
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
                      Đang tải danh sách đăng ký...
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
                      Chưa có đăng ký gói nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Gift className='size-5' />
              Cấp gói cho người dùng
            </DialogTitle>
            <DialogDescription>
              Cấp gói dịch vụ thủ công — gói sẽ được kích hoạt ngay.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>ID tài khoản <span className='text-red-500'>*</span></Label>
                <Input
                  type='number'
                  min={1}
                  value={createForm.taiKhoanId}
                  onChange={(e) => setCreateForm((c) => ({ ...c, taiKhoanId: e.target.value }))}
                  placeholder='VD: 1'
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
              <div className='space-y-2'>
                <Label>ID gói dịch vụ <span className='text-red-500'>*</span></Label>
                <Input
                  type='number'
                  min={1}
                  value={createForm.goiDichVuId}
                  onChange={(e) => setCreateForm((c) => ({ ...c, goiDichVuId: e.target.value }))}
                  placeholder='VD: 2'
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Ngày bắt đầu</Label>
                <Input
                  type='date'
                  value={createForm.ngayBatDau}
                  onChange={(e) => setCreateForm((c) => ({ ...c, ngayBatDau: e.target.value }))}
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
              <div className='space-y-2'>
                <Label>Ngày hết hạn</Label>
                <Input
                  type='date'
                  value={createForm.ngayHetHan}
                  onChange={(e) => setCreateForm((c) => ({ ...c, ngayHetHan: e.target.value }))}
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Nguồn đăng ký</Label>
              <Select
                value={createForm.nguonDangKy}
                onValueChange={(value) =>
                  setCreateForm((c) => ({ ...c, nguonDangKy: value as SubscriptionSource }))
                }
                disabled={saving}
              >
                <SelectTrigger className='rounded-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='quan_tri_cap'>Admin cấp</SelectItem>
                  <SelectItem value='khuyen_mai'>Khuyến mãi</SelectItem>
                  <SelectItem value='nguoi_dung_tu_nang_cap'>User nâng cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center justify-between rounded-md border p-3'>
              <div className='space-y-0.5'>
                <Label className='flex items-center gap-1.5'>
                  <RefreshCw className='size-4 text-blue-500' />
                  Tự động gia hạn
                </Label>
                <p className='text-xs text-muted-foreground'>Gia hạn tự động khi hết hạn</p>
              </div>
              <Switch
                checked={createForm.tuDongGiaHan}
                onCheckedChange={(checked) =>
                  setCreateForm((c) => ({ ...c, tuDongGiaHan: checked }))
                }
                disabled={saving}
              />
            </div>

            <div className='space-y-2'>
              <Label>Ghi chú</Label>
              <Textarea
                value={createForm.ghiChu}
                onChange={(e) => setCreateForm((c) => ({ ...c, ghiChu: e.target.value }))}
                placeholder='Lý do cấp gói...'
                disabled={saving}
                className='min-h-[60px] rounded-sm'
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setCreateOpen(false)} disabled={saving} className='rounded-sm'>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !createForm.taiKhoanId || !createForm.goiDichVuId}
              className='rounded-sm'
            >
              Cấp gói
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false)
            setEditingSubscription(null)
          }
        }}
      >
        <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Pencil className='size-5' />
              Cập nhật đăng ký
            </DialogTitle>
            <DialogDescription>
              {editingSubscription
                ? `${editingSubscription.tai_khoan?.ho_ten ?? ''} — ${editingSubscription.goi_dich_vu?.ten_goi ?? ''}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label>Trạng thái</Label>
              <Select
                value={editForm.trangThai}
                onValueChange={(value) =>
                  setEditForm((c) => ({ ...c, trangThai: value as SubscriptionStatus }))
                }
                disabled={saving}
              >
                <SelectTrigger className='rounded-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='cho_kich_hoat'>Chờ kích hoạt</SelectItem>
                  <SelectItem value='dang_hoat_dong'>Đang hoạt động</SelectItem>
                  <SelectItem value='het_han'>Hết hạn</SelectItem>
                  <SelectItem value='da_huy'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Ngày bắt đầu</Label>
                <Input
                  type='date'
                  value={editForm.ngayBatDau}
                  onChange={(e) => setEditForm((c) => ({ ...c, ngayBatDau: e.target.value }))}
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
              <div className='space-y-2'>
                <Label>Ngày hết hạn</Label>
                <Input
                  type='date'
                  value={editForm.ngayHetHan}
                  onChange={(e) => setEditForm((c) => ({ ...c, ngayHetHan: e.target.value }))}
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
            </div>

            <div className='flex items-center justify-between rounded-md border p-3'>
              <div className='space-y-0.5'>
                <Label className='flex items-center gap-1.5'>
                  <RefreshCw className='size-4 text-blue-500' />
                  Tự động gia hạn
                </Label>
              </div>
              <Switch
                checked={editForm.tuDongGiaHan}
                onCheckedChange={(checked) =>
                  setEditForm((c) => ({ ...c, tuDongGiaHan: checked }))
                }
                disabled={saving}
              />
            </div>

            <div className='space-y-2'>
              <Label>Ghi chú</Label>
              <Textarea
                value={editForm.ghiChu}
                onChange={(e) => setEditForm((c) => ({ ...c, ghiChu: e.target.value }))}
                disabled={saving}
                className='min-h-[60px] rounded-sm'
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setEditOpen(false)}
              disabled={saving}
              className='rounded-sm'
            >
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className='rounded-sm'>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
