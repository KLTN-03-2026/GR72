'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  type ColumnDef,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/services/auth/api'
import {
  type AdminFood,
  type AdminFoodGroup,
  type AdminFoodSourceType,
  createAdminFood,
  deleteAdminFood,
  getAdminFoodDetail,
  getAdminFoods,
  getAdminFoodGroups,
  updateAdminFood,
} from '@/services/admin-foods/api'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { AdminTopbar } from '@/components/layout/admin-topbar'

const PAGE_SIZE = 10
const FIELD_CLASSNAME = 'w-full rounded-sm'

type FoodFormState = {
  nhomThucPhamId: string
  ten: string
  slug: string
  moTa: string
  theGan: string
  loaiNguon: AdminFoodSourceType
  tenNguon: string
  maNguon: string
  khauPhanThamChieu: string
  donViKhauPhan: string
  calories100g: string
  protein100g: string
  carb100g: string
  fat100g: string
  chatXo100g: string
  duong100g: string
  natri100g: string
  duLieuGoc: string
  daXacMinh: 'true' | 'false'
}

const EMPTY_FORM: FoodFormState = {
  nhomThucPhamId: '',
  ten: '',
  slug: '',
  moTa: '',
  theGan: '',
  loaiNguon: 'noi_bo',
  tenNguon: '',
  maNguon: '',
  khauPhanThamChieu: '100',
  donViKhauPhan: 'g',
  calories100g: '0',
  protein100g: '0',
  carb100g: '0',
  fat100g: '0',
  chatXo100g: '0',
  duong100g: '0',
  natri100g: '0',
  duLieuGoc: '',
  daXacMinh: 'false',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getSourceLabel(value: AdminFoodSourceType) {
  switch (value) {
    case 'thu_cong':
      return 'Thủ công'
    case 'api_ngoai':
      return 'API ngoài'
    case 'noi_bo':
    default:
      return 'Nội bộ'
  }
}

function mapFoodToForm(food: AdminFood): FoodFormState {
  return {
    nhomThucPhamId: String(food.nhom_thuc_pham_id),
    ten: food.ten,
    slug: food.slug,
    moTa: food.mo_ta ?? '',
    theGan: food.the_gan.join(', '),
    loaiNguon: food.loai_nguon,
    tenNguon: food.ten_nguon ?? '',
    maNguon: food.ma_nguon ?? '',
    khauPhanThamChieu: String(food.khau_phan_tham_chieu),
    donViKhauPhan: food.don_vi_khau_phan,
    calories100g: String(food.calories_100g),
    protein100g: String(food.protein_100g),
    carb100g: String(food.carb_100g),
    fat100g: String(food.fat_100g),
    chatXo100g: String(food.chat_xo_100g),
    duong100g: String(food.duong_100g),
    natri100g: String(food.natri_100g),
    duLieuGoc: food.du_lieu_goc ? JSON.stringify(food.du_lieu_goc, null, 2) : '',
    daXacMinh: String(food.da_xac_minh) as 'true' | 'false',
  }
}

function FoodDialog({
  open,
  mode,
  loading,
  saving,
  form,
  groups,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit' | 'view'
  loading: boolean
  saving: boolean
  form: FoodFormState
  groups: AdminFoodGroup[]
  onOpenChange: (open: boolean) => void
  onFormChange: (patch: Partial<FoodFormState>) => void
  onSubmit: () => void
}) {
  const readOnly = mode === 'view'

  return (
    <div
      className={open ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' : 'hidden'}
      onClick={() => onOpenChange(false)}
    >
      <div
        className='max-h-[90vh] w-full overflow-y-auto rounded-sm border bg-background p-4 shadow-lg sm:max-w-4xl'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='mb-4 space-y-1'>
          <h2 className='text-lg font-semibold'>
            {mode === 'create'
              ? 'Tạo thực phẩm mới'
              : mode === 'edit'
                ? 'Cập nhật thực phẩm'
                : 'Chi tiết thực phẩm'}
          </h2>
          <p className='text-sm text-muted-foreground'>
            Quản lý catalog thực phẩm nội bộ làm nguồn chuẩn cho recipes, meal templates và AI.
          </p>
        </div>

        {loading ? (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Đang tải dữ liệu thực phẩm...
          </div>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Nhóm thực phẩm</Label>
                <Select
                  value={form.nhomThucPhamId}
                  disabled={readOnly || saving}
                  onValueChange={(value) => onFormChange({ nhomThucPhamId: value })}
                >
                  <SelectTrigger className={FIELD_CLASSNAME}>
                    <SelectValue placeholder='Chọn nhóm thực phẩm' />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.ten}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Tên thực phẩm</Label>
                <Input
                  value={form.ten}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ ten: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ slug: event.target.value })}
                  className={FIELD_CLASSNAME}
                  placeholder='Để trống để hệ thống tự sinh'
                />
              </div>
              <div className='space-y-2'>
                <Label>Loại nguồn</Label>
                <Select
                  value={form.loaiNguon}
                  disabled={readOnly || saving}
                  onValueChange={(value) =>
                    onFormChange({ loaiNguon: value as AdminFoodSourceType })
                  }
                >
                  <SelectTrigger className={FIELD_CLASSNAME}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='noi_bo'>Nội bộ</SelectItem>
                    <SelectItem value='thu_cong'>Thủ công</SelectItem>
                    <SelectItem value='api_ngoai'>API ngoài</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Tên nguồn</Label>
                <Input
                  value={form.tenNguon}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ tenNguon: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Mã nguồn</Label>
                <Input
                  value={form.maNguon}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ maNguon: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Khẩu phần tham chiếu</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.khauPhanThamChieu}
                  disabled={readOnly || saving}
                  onChange={(event) =>
                    onFormChange({ khauPhanThamChieu: event.target.value })
                  }
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Đơn vị khẩu phần</Label>
                <Input
                  value={form.donViKhauPhan}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ donViKhauPhan: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Calories / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.calories100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ calories100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Protein / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.protein100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ protein100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Carb / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.carb100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ carb100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Fat / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.fat100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ fat100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Chất xơ / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.chatXo100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ chatXo100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Đường / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.duong100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ duong100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Natri / 100g</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.natri100g}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ natri100g: event.target.value })}
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Xác minh</Label>
                <Select
                  value={form.daXacMinh}
                  disabled={readOnly || saving}
                  onValueChange={(value) =>
                    onFormChange({ daXacMinh: value as 'true' | 'false' })
                  }
                >
                  <SelectTrigger className={FIELD_CLASSNAME}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='false'>Chưa xác minh</SelectItem>
                    <SelectItem value='true'>Đã xác minh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='mt-4 grid gap-4'>
              <div className='space-y-2'>
                <Label>Mô tả</Label>
                <Textarea
                  value={form.moTa}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ moTa: event.target.value })}
                  className='min-h-24 w-full rounded-sm'
                />
              </div>
              <div className='space-y-2'>
                <Label>Thẻ gắn</Label>
                <Input
                  value={form.theGan}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ theGan: event.target.value })}
                  placeholder='healthy, breakfast, high-protein'
                  className={FIELD_CLASSNAME}
                />
              </div>
              <div className='space-y-2'>
                <Label>Dữ liệu gốc JSON</Label>
                <Textarea
                  value={form.duLieuGoc}
                  disabled={readOnly || saving}
                  onChange={(event) => onFormChange({ duLieuGoc: event.target.value })}
                  className='min-h-32 w-full rounded-sm font-mono text-xs'
                  placeholder='{"provider":"manual"}'
                />
              </div>
            </div>

            <div className='mt-4 flex gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)} className='rounded-sm'>
                {readOnly ? 'Đóng' : 'Hủy'}
              </Button>
              {!readOnly ? (
                <Button onClick={onSubmit} disabled={saving} className='rounded-sm'>
                  {mode === 'create' ? 'Tạo thực phẩm' : 'Lưu thay đổi'}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function AdminFoods() {
  const router = useRouter()
  const [foods, setFoods] = useState<AdminFood[]>([])
  const [groups, setGroups] = useState<AdminFoodGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminFood | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view' | null>(null)
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null)
  const [form, setForm] = useState<FoodFormState>(EMPTY_FORM)
  const [keyword, setKeyword] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [pageCount, setPageCount] = useState(0)

  const loadFoodGroups = useCallback(async () => {
    try {
      const response = await getAdminFoodGroups()
      setGroups(response)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được nhóm thực phẩm')
      setGroups([])
    }
  }, [])

  const loadFoods = useCallback(async () => {
    setLoading(true)

    try {
      const response = await getAdminFoods({
        keyword,
        nhomThucPhamId: groupFilter === 'all' ? undefined : Number(groupFilter),
        daXacMinh:
          verifiedFilter === 'all' ? undefined : verifiedFilter === 'true',
        loaiNguon:
          sourceFilter === 'all'
            ? undefined
            : (sourceFilter as AdminFoodSourceType),
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })

      setFoods(response.items)
      setPageCount(Math.max(Math.ceil(response.pagination.total / response.pagination.limit), 1))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tải được catalog thực phẩm')
      setFoods([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [groupFilter, keyword, pagination.pageIndex, pagination.pageSize, sourceFilter, verifiedFilter])

  useEffect(() => {
    void loadFoodGroups()
  }, [loadFoodGroups])

  useEffect(() => {
    void loadFoods()
  }, [loadFoods])

  useEffect(() => {
    if (!selectedFoodId || dialogMode === 'create') return

    let isMounted = true
    setDetailLoading(true)

    void getAdminFoodDetail(selectedFoodId)
      .then((food) => {
        if (!isMounted) return
        setForm(mapFoodToForm(food))
      })
      .catch((error) => {
        if (!isMounted) return
        toast.error(error instanceof ApiError ? error.message : 'Không tải được chi tiết thực phẩm')
      })
      .finally(() => {
        if (isMounted) {
          setDetailLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [dialogMode, selectedFoodId])

  const resetDialog = () => {
    setDialogMode(null)
    setSelectedFoodId(null)
    setForm(EMPTY_FORM)
    setDetailLoading(false)
  }

  const buildPayload = () => ({
    nhomThucPhamId: Number(form.nhomThucPhamId),
    ten: form.ten.trim(),
    slug: form.slug.trim() || undefined,
    moTa: form.moTa.trim() || undefined,
    theGan: form.theGan
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    loaiNguon: form.loaiNguon,
    tenNguon: form.tenNguon.trim() || undefined,
    maNguon: form.maNguon.trim() || undefined,
    khauPhanThamChieu: Number(form.khauPhanThamChieu || 0),
    donViKhauPhan: form.donViKhauPhan.trim(),
    calories100g: Number(form.calories100g || 0),
    protein100g: Number(form.protein100g || 0),
    carb100g: Number(form.carb100g || 0),
    fat100g: Number(form.fat100g || 0),
    chatXo100g: Number(form.chatXo100g || 0),
    duong100g: Number(form.duong100g || 0),
    natri100g: Number(form.natri100g || 0),
    duLieuGoc: form.duLieuGoc.trim() || undefined,
    daXacMinh: form.daXacMinh === 'true',
  })

  const handleSubmit = async () => {
    setSaving(true)

    try {
      if (dialogMode === 'create') {
        await createAdminFood(buildPayload())
        toast.success('Đã tạo thực phẩm mới.')
      } else if (dialogMode === 'edit' && selectedFoodId) {
        await updateAdminFood(selectedFoodId, buildPayload())
        toast.success('Đã cập nhật thực phẩm.')
      }

      resetDialog()
      await loadFoods()
      await loadFoodGroups()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Lưu thực phẩm thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (food: AdminFood) => {
    try {
      await deleteAdminFood(food.id)
      toast.success('Đã xóa mềm thực phẩm.')
      if (selectedFoodId === food.id) {
        resetDialog()
      }
      setDeleteTarget(null)
      await loadFoods()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Xóa thực phẩm thất bại')
    }
  }

  const columns = useMemo<ColumnDef<AdminFood>[]>(
    () => [
      {
        accessorKey: 'ten',
        header: 'Thực phẩm',
        cell: ({ row }) => (
          <div>
            <p className='font-medium'>{row.original.ten}</p>
            <p className='text-xs text-muted-foreground'>{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: 'nhom_thuc_pham',
        header: 'Nhóm',
        cell: ({ row }) => row.original.nhom_thuc_pham?.ten ?? 'Chưa gán',
      },
      {
        accessorKey: 'calories_100g',
        header: 'Calories',
        cell: ({ row }) => `${row.original.calories_100g} kcal`,
      },
      {
        accessorKey: 'loai_nguon',
        header: 'Nguồn',
        cell: ({ row }) => getSourceLabel(row.original.loai_nguon),
      },
      {
        accessorKey: 'da_xac_minh',
        header: 'Xác minh',
        cell: ({ row }) => (
          <Badge variant={row.original.da_xac_minh ? 'secondary' : 'outline'}>
            {row.original.da_xac_minh ? 'Đã xác minh' : 'Chưa xác minh'}
          </Badge>
        ),
      },
      {
        accessorKey: 'cap_nhat_luc',
        header: 'Cập nhật',
        cell: ({ row }) => formatDateTime(row.original.cap_nhat_luc),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='size-8 p-0'>
                <DotsHorizontalIcon className='size-4' />
                <span className='sr-only'>Mở menu thao tác</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedFoodId(row.original.id)
                  setDialogMode('view')
                }}
              >
                <Eye />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedFoodId(row.original.id)
                  setDialogMode('edit')
                }}
              >
                <Pencil />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 />
                Xóa mềm
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [selectedFoodId]
  )

  const table = useReactTable({
    data: foods,
    columns,
    state: {
      pagination,
    },
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
          title='Catalog thực phẩm nội bộ'
          description='Admin quản lý nguồn dữ liệu chuẩn cho toàn hệ thống: xem, tìm kiếm, tạo mới, cập nhật và xóa mềm thực phẩm.'
          actions={[
            {
              label: 'Quản lý nhóm thực phẩm',
              onClick: () => router.push('/admin/food-groups'),
            },
            {
              label: 'Thêm thực phẩm',
              onClick: () => {
                setForm(EMPTY_FORM)
                setSelectedFoodId(null)
                setDialogMode('create')
              },
            },
          ]}
        />

        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Input
              placeholder='Tìm theo tên, slug hoặc nguồn...'
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
              className='w-full max-w-sm'
            />
            <Select
              value={groupFilter}
              onValueChange={(value) => {
                setGroupFilter(value)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[220px] rounded-sm'>
                <SelectValue placeholder='Lọc nhóm' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả nhóm</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.ten}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={verifiedFilter}
              onValueChange={(value) => {
                setVerifiedFilter(value)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[220px] rounded-sm'>
                <SelectValue placeholder='Lọc xác minh' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='true'>Đã xác minh</SelectItem>
                <SelectItem value='false'>Chưa xác minh</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[220px] rounded-sm'>
                <SelectValue placeholder='Lọc nguồn' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả nguồn</SelectItem>
                <SelectItem value='noi_bo'>Nội bộ</SelectItem>
                <SelectItem value='thu_cong'>Thủ công</SelectItem>
                <SelectItem value='api_ngoai'>API ngoài</SelectItem>
              </SelectContent>
            </Select>
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
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      Đang tải catalog thực phẩm...
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
                      Chưa có thực phẩm phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      <FoodDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'view'}
        loading={detailLoading}
        saving={saving}
        form={form}
        groups={groups}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog()
          }
        }}
        onFormChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onSubmit={handleSubmit}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa thực phẩm'
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa thực phẩm "${deleteTarget.ten}" khỏi catalog? Hành động này sẽ xóa mềm bản ghi.`
            : ''
        }
        confirmLabel='Xóa thực phẩm'
        loading={saving}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget)
          }
        }}
      />
    </>
  )
}
