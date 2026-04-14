'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowLeft,
  Check,
  Infinity as InfinityIcon,
  Pencil,
  Plus,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type CreateFeaturePayload,
  type LimitType,
  type PackageFeature,
  type StandardFeatureCode,
  createPackageFeature,
  deletePackageFeature,
  getPackageFeatures,
  getStandardFeatureCodes,
  updatePackageFeature,
} from '@/services/admin-package-features/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
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

function getLimitLabel(limit: LimitType) {
  switch (limit) {
    case 'ngay': return '/ngày'
    case 'thang': return '/tháng'
    case 'khong_gioi_han': return 'Không giới hạn'
    default: return limit
  }
}

type FeatureFormState = {
  maChucNang: string
  tenChucNang: string
  moTa: string
  duocPhepSuDung: boolean
  gioiHanSoLan: number | null
  gioiHanTheo: LimitType
}

const DEFAULT_FORM: FeatureFormState = {
  maChucNang: '',
  tenChucNang: '',
  moTa: '',
  duocPhepSuDung: true,
  gioiHanSoLan: null,
  gioiHanTheo: 'khong_gioi_han',
}

function FeatureFormDialog({
  open,
  isEdit,
  form,
  saving,
  standardCodes,
  existingCodes,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean
  isEdit: boolean
  form: FeatureFormState
  saving: boolean
  standardCodes: StandardFeatureCode[]
  existingCodes: string[]
  onOpenChange: (open: boolean) => void
  onFormChange: (patch: Partial<FeatureFormState>) => void
  onSubmit: () => void
}) {
  const availableCodes = standardCodes.filter(
    (c) => !existingCodes.includes(c.code) || (isEdit && form.maChucNang === c.code)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-sm p-5 sm:max-w-lg max-h-[90vh] overflow-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isEdit ? <Pencil className='size-5' /> : <Plus className='size-5' />}
            {isEdit ? 'Cập nhật chức năng' : 'Thêm chức năng vào gói'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Chỉnh sửa quyền và giới hạn sử dụng.'
              : 'Chọn mã chức năng chuẩn và cấu hình giới hạn.'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4'>
          {/* Mã chức năng */}
          <div className='space-y-2'>
            <Label>Mã chức năng <span className='text-red-500'>*</span></Label>
            {isEdit ? (
              <Input value={form.maChucNang} disabled className='rounded-sm' />
            ) : (
              <Select
                value={form.maChucNang}
                onValueChange={(value) => {
                  const std = standardCodes.find((c) => c.code === value)
                  onFormChange({
                    maChucNang: value,
                    tenChucNang: std?.name ?? '',
                  })
                }}
                disabled={saving}
              >
                <SelectTrigger className='rounded-sm'>
                  <SelectValue placeholder='Chọn mã chức năng...' />
                </SelectTrigger>
                <SelectContent>
                  {availableCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <code className='text-xs'>{c.code}</code>
                      <span className='ml-2 text-muted-foreground'>— {c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Tên chức năng */}
          <div className='space-y-2'>
            <Label>Tên chức năng <span className='text-red-500'>*</span></Label>
            <Input
              value={form.tenChucNang}
              onChange={(e) => onFormChange({ tenChucNang: e.target.value })}
              disabled={saving}
              className='rounded-sm'
            />
          </div>

          {/* Mô tả */}
          <div className='space-y-2'>
            <Label>Mô tả</Label>
            <Textarea
              value={form.moTa}
              onChange={(e) => onFormChange({ moTa: e.target.value })}
              disabled={saving}
              placeholder='Mô tả quyền lợi...'
              className='min-h-[60px] rounded-sm'
            />
          </div>

          {/* Được phép sử dụng */}
          <div className='flex items-center justify-between rounded-md border p-3'>
            <div className='space-y-0.5'>
              <Label className='flex items-center gap-1.5'>
                <ShieldCheck className='size-4 text-emerald-500' />
                Được phép sử dụng
              </Label>
              <p className='text-xs text-muted-foreground'>Bật/tắt quyền truy cập chức năng</p>
            </div>
            <Switch
              checked={form.duocPhepSuDung}
              onCheckedChange={(checked) => onFormChange({ duocPhepSuDung: checked })}
              disabled={saving}
            />
          </div>

          {/* Giới hạn */}
          {form.duocPhepSuDung && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Giới hạn số lần</Label>
                <Input
                  type='number'
                  min={0}
                  value={form.gioiHanSoLan ?? ''}
                  onChange={(e) =>
                    onFormChange({
                      gioiHanSoLan: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder='Trống = không giới hạn'
                  disabled={saving}
                  className='rounded-sm'
                />
              </div>
              <div className='space-y-2'>
                <Label>Giới hạn theo</Label>
                <Select
                  value={form.gioiHanTheo}
                  onValueChange={(value) =>
                    onFormChange({ gioiHanTheo: value as LimitType })
                  }
                  disabled={saving}
                >
                  <SelectTrigger className='rounded-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='khong_gioi_han'>Không giới hạn</SelectItem>
                    <SelectItem value='ngay'>Theo ngày</SelectItem>
                    <SelectItem value='thang'>Theo tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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
            disabled={saving || !form.maChucNang || !form.tenChucNang.trim()}
            className='rounded-sm'
          >
            {isEdit ? 'Lưu thay đổi' : 'Thêm chức năng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminPackageFeaturesContent({
  packageId,
}: {
  packageId: number
}) {
  const router = useRouter()
  const [features, setFeatures] = useState<PackageFeature[]>([])
  const [packageName, setPackageName] = useState('')
  const [loading, setLoading] = useState(true)
  const [standardCodes, setStandardCodes] = useState<StandardFeatureCode[]>([])

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFeature, setEditingFeature] = useState<PackageFeature | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PackageFeature | null>(null)
  const [form, setForm] = useState<FeatureFormState>(DEFAULT_FORM)

  const loadFeatures = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getPackageFeatures(packageId)
      setFeatures(response.items)
      setPackageName(response.package_name)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Không tải được danh sách chức năng'
      )
    } finally {
      setLoading(false)
    }
  }, [packageId])

  useEffect(() => {
    void loadFeatures()
    void getStandardFeatureCodes().then(setStandardCodes).catch(() => {})
  }, [loadFeatures])

  const existingCodes = useMemo(
    () => features.map((f) => f.ma_chuc_nang),
    [features]
  )

  const openCreate = () => {
    setEditingFeature(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  const openEdit = (feature: PackageFeature) => {
    setEditingFeature(feature)
    setForm({
      maChucNang: feature.ma_chuc_nang,
      tenChucNang: feature.ten_chuc_nang,
      moTa: feature.mo_ta ?? '',
      duocPhepSuDung: feature.duoc_phep_su_dung,
      gioiHanSoLan: feature.gioi_han_so_lan,
      gioiHanTheo: feature.gioi_han_theo,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingFeature) {
        await updatePackageFeature(editingFeature.id, {
          tenChucNang: form.tenChucNang.trim(),
          moTa: form.moTa.trim() || undefined,
          duocPhepSuDung: form.duocPhepSuDung,
          gioiHanSoLan: form.gioiHanSoLan,
          gioiHanTheo: form.gioiHanTheo,
        })
        toast.success('Đã cập nhật chức năng.')
      } else {
        const payload: CreateFeaturePayload = {
          maChucNang: form.maChucNang,
          tenChucNang: form.tenChucNang.trim(),
          moTa: form.moTa.trim() || undefined,
          duocPhepSuDung: form.duocPhepSuDung,
          gioiHanSoLan: form.gioiHanSoLan ?? undefined,
          gioiHanTheo: form.gioiHanTheo,
        }
        await createPackageFeature(packageId, payload)
        toast.success('Đã thêm chức năng vào gói.')
      }
      setDialogOpen(false)
      await loadFeatures()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = useCallback(
    async (feature: PackageFeature) => {
      try {
        await deletePackageFeature(feature.id)
        toast.success('Đã xóa chức năng khỏi gói.')
        setDeleteTarget(null)
        await loadFeatures()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Xóa thất bại')
      }
    },
    [loadFeatures]
  )

  const handleTogglePermission = async (feature: PackageFeature) => {
    try {
      await updatePackageFeature(feature.id, {
        duocPhepSuDung: !feature.duoc_phep_su_dung,
      })
      toast.success(
        feature.duoc_phep_su_dung
          ? `Đã tắt quyền "${feature.ten_chuc_nang}".`
          : `Đã bật quyền "${feature.ten_chuc_nang}".`
      )
      await loadFeatures()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Cập nhật thất bại')
    }
  }

  const columns = useMemo<ColumnDef<PackageFeature>[]>(
    () => [
      {
        accessorKey: 'ma_chuc_nang',
        header: 'Mã chức năng',
        cell: ({ row }) => (
          <code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono'>
            {row.original.ma_chuc_nang}
          </code>
        ),
      },
      {
        accessorKey: 'ten_chuc_nang',
        header: 'Tên chức năng',
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.ten_chuc_nang}</span>
        ),
      },
      {
        accessorKey: 'duoc_phep_su_dung',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <button
            onClick={() => handleTogglePermission(row.original)}
            className='cursor-pointer'
          >
            {row.original.duoc_phep_su_dung ? (
              <Badge className='gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'>
                <ShieldCheck className='size-3' /> Cho phép
              </Badge>
            ) : (
              <Badge variant='destructive' className='gap-1'>
                <ShieldOff className='size-3' /> Bị chặn
              </Badge>
            )}
          </button>
        ),
      },
      {
        id: 'limit',
        header: 'Giới hạn',
        cell: ({ row }) => {
          const f = row.original
          if (!f.duoc_phep_su_dung) {
            return <span className='text-xs text-muted-foreground'>—</span>
          }
          if (f.gioi_han_so_lan === null || f.gioi_han_theo === 'khong_gioi_han') {
            return (
              <div className='flex items-center gap-1 text-emerald-600'>
                <InfinityIcon className='size-4' />
                <span className='text-xs font-medium'>Không giới hạn</span>
              </div>
            )
          }
          return (
            <Badge variant='outline' className='font-mono text-xs'>
              {f.gioi_han_so_lan} lần{getLimitLabel(f.gioi_han_theo)}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='flex justify-end gap-1'>
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
    [loadFeatures]
  )

  const table = useReactTable({
    data: features,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <AdminTopbar />
      <Main fluid className='flex flex-1 flex-col gap-5 px-3 py-5 sm:px-4'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/admin/packages')}
            className='rounded-sm'
          >
            <ArrowLeft className='mr-1 size-4' />
            Quay lại
          </Button>
        </div>

        <PageHeading
          title={`Chức năng — ${packageName || '...'}`}
          description='Cấu hình các tính năng được phép sử dụng và giới hạn truy cập cho gói dịch vụ này.'
        />

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              <Check className='mr-1 inline size-4 text-emerald-500' />
              {features.filter((f) => f.duoc_phep_su_dung).length} / {features.length} chức năng được bật
            </p>
            <Button onClick={openCreate} className='rounded-sm'>
              <Plus className='mr-1 size-4' />
              Thêm chức năng
            </Button>
          </div>

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
                      Đang tải danh sách chức năng...
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
                      Chưa có chức năng nào. Nhấn &quot;Thêm chức năng&quot; để bắt đầu cấu hình.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Main>

      <FeatureFormDialog
        open={dialogOpen}
        isEdit={editingFeature !== null}
        form={form}
        saving={saving}
        standardCodes={standardCodes}
        existingCodes={existingCodes}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false)
            setEditingFeature(null)
          }
        }}
        onFormChange={(patch) => setForm((c) => ({ ...c, ...patch }))}
        onSubmit={handleSubmit}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa chức năng'
        description={
          deleteTarget
            ? `Xóa "${deleteTarget.ten_chuc_nang}" (${deleteTarget.ma_chuc_nang}) khỏi gói?`
            : ''
        }
        confirmLabel='Xóa'
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
