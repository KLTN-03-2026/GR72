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
import { Eye, Pencil, Soup, Trash2 } from 'lucide-react'
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
import { ApiError } from '@/services/auth/api'
import {
  type AdminMealTemplate,
  type AdminMealTemplateAuthor,
  type AdminMealTemplateDetail,
  type AdminMealTemplateStatus,
  deleteAdminMealTemplate,
  getAdminMealTemplate,
  getAdminMealTemplateAuthors,
  getAdminMealTemplateStats,
  getAdminMealTemplates,
} from '@/services/admin-meal-templates/api'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { AdminTopbar } from '@/components/layout/admin-topbar'

const PAGE_SIZE = 10

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function statusBadge(s: AdminMealTemplateStatus) {
  switch (s) {
    case 'ban_nhap': return <Badge variant='outline'>Bản nháp</Badge>
    case 'xuat_ban': return <Badge className='bg-emerald-100 text-emerald-700'>Xuất bản</Badge>
    case 'luu_tru': return <Badge variant='secondary'>Lưu trữ</Badge>
    default: return <Badge variant='outline'>{s}</Badge>
  }
}

function goalLabel(g: string | null) {
  switch (g) {
    case 'giam_can': return 'Giảm cân'
    case 'tang_can': return 'Tăng cân'
    case 'giu_can': return 'Giữ cân'
    default: return g ?? '—'
  }
}

function MealTemplateDetailDialog({
  open,
  template,
  onOpenChange,
}: {
  open: boolean
  template: AdminMealTemplate | null
  onOpenChange: (open: boolean) => void
}) {
  if (!open || !template) return null

  const byDay = template.chi_tiet.reduce<Record<number, AdminMealTemplateDetail[]>>((acc, ct) => {
    if (!acc[ct.ngay_so]) acc[ct.ngay_so] = []
    acc[ct.ngay_so].push(ct)
    return acc
  }, {})

  const sortedDays = Object.keys(byDay).map(Number).sort((a, b) => a - b)
  const mealTypes: Record<string, string> = { bua_sang: 'Bữa sáng', bua_trua: 'Bữa trưa', bua_toi: 'Bữa tối', bua_phu: 'Bữa phụ' }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={() => onOpenChange(false)}>
      <div
        className='max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border bg-background p-4 shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='mb-4 space-y-1'>
          <h2 className='text-lg font-semibold'>Chi tiết thực đơn mẫu</h2>
          <p className='text-sm text-muted-foreground'>{template.tieu_de}</p>
        </div>

        <div className='mb-4 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-sm border bg-card p-3'>
            <p className='text-xs text-muted-foreground'>Mục tiêu</p>
            <p className='mt-1 font-medium'>{goalLabel(template.loai_muc_tieu_phu_hop)}</p>
          </div>
          <div className='rounded-sm border bg-card p-3'>
            <p className='text-xs text-muted-foreground'>Calories mục tiêu</p>
            <p className='mt-1 font-medium'>{template.calories_muc_tieu ?? '—'} kcal</p>
          </div>
          <div className='rounded-sm border bg-card p-3'>
            <p className='text-xs text-muted-foreground'>Trạng thái</p>
            <div className='mt-1'>{statusBadge(template.trang_thai)}</div>
          </div>
        </div>

        {template.mo_ta && (
          <div className='mb-4'>
            <p className='text-sm text-muted-foreground'>Mô tả</p>
            <p className='mt-1 text-sm'>{template.mo_ta}</p>
          </div>
        )}

        <div className='space-y-4'>
          <h3 className='text-sm font-semibold'>Chi tiết bữa ăn</h3>
          {sortedDays.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Chưa có chi tiết bữa ăn.</p>
          ) : (
            sortedDays.map((day) => (
              <div key={day} className='rounded-sm border'>
                <div className='border-b bg-muted/40 px-3 py-2 text-sm font-medium'>Ngày {day}</div>
                <div className='divide-y'>
                  {['bua_sang', 'bua_trua', 'bua_toi', 'bua_phu'].map((type) => {
                    const items = byDay[day]?.filter((ct) => ct.loai_bua_an === type) ?? []
                    return (
                      <div key={type} className='px-3 py-2'>
                        <p className='mb-1 text-xs font-medium text-muted-foreground'>{mealTypes[type] ?? type}</p>
                        {items.length === 0 ? (
                          <p className='text-xs text-muted-foreground'>—</p>
                        ) : (
                          <div className='space-y-1'>
                            {items.map((ct) => (
                              <div key={ct.id} className='flex items-center justify-between text-sm'>
                                <span>
                                  {ct.cong_thuc_id ? `(Công thức #${ct.cong_thuc_id})` : ct.thuc_pham_id ? `(Thực phẩm #${ct.thuc_pham_id})` : '—'}
                                </span>
                                <span className='text-muted-foreground'>
                                  {ct.so_luong} {ct.don_vi ?? ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)} className='rounded-sm'>Đóng</Button>
        </div>
      </div>
    </div>
  )
}

export function AdminMealTemplates() {
  const router = useRouter()
  const [items, setItems] = useState<AdminMealTemplate[]>([])
  const [stats, setStats] = useState({ tong: 0, ban_nhap: 0, xuat_ban: 0, luu_tru: 0 })
  const [authors, setAuthors] = useState<AdminMealTemplateAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminMealTemplate | null>(null)
  const [detailTarget, setDetailTarget] = useState<AdminMealTemplate | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [goalFilter, setGoalFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)

  const loadMeta = useCallback(async () => {
    try {
      const [authRes, statsRes] = await Promise.all([
        getAdminMealTemplateAuthors(),
        getAdminMealTemplateStats(),
      ])
      setAuthors(authRes)
      setStats(statsRes)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được siêu dữ liệu')
    }
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminMealTemplates({
        tieuDe: keyword || undefined,
        trangThai: statusFilter === 'all' ? undefined : statusFilter as AdminMealTemplateStatus,
        loaiMucTieu: goalFilter === 'all' ? undefined : goalFilter,
        tacGiaId: authorFilter === 'all' ? undefined : authorFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setItems(res.items)
      setPageCount(Math.max(Math.ceil(res.pagination.total / res.pagination.limit), 1))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được danh sách thực đơn mẫu')
      setItems([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, goalFilter, authorFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadMeta() }, [loadMeta])
  useEffect(() => { void loadItems() }, [loadItems])

  const handleDelete = async (m: AdminMealTemplate) => {
    try {
      await deleteAdminMealTemplate(m.id)
      toast.success(`Đã xóa thực đơn mẫu "${m.tieu_de}"`)
      setDeleteTarget(null)
      await loadItems()
      void loadMeta()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Xóa thất bại')
    }
  }

  const columns = useMemo<ColumnDef<AdminMealTemplate>[]>(() => [
    {
      accessorKey: 'tieu_de',
      header: 'Tiêu đề',
      cell: ({ row }) => (
        <div>
          <p className='font-medium line-clamp-1'>{row.original.tieu_de}</p>
          <p className='text-xs text-muted-foreground'>{row.original.mo_ta?.slice(0, 60) ?? ''}{row.original.mo_ta && row.original.mo_ta.length > 60 ? '...' : ''}</p>
        </div>
      ),
    },
    {
      id: 'goal',
      header: 'Mục tiêu',
      cell: ({ row }) => (
        <Badge variant='outline' className='text-xs'>{goalLabel(row.original.loai_muc_tieu_phu_hop)}</Badge>
      ),
    },
    {
      id: 'cal',
      header: 'Kcal',
      cell: ({ row }) => (
        <span className='text-sm tabular-nums'>{row.original.calories_muc_tieu ?? '—'}</span>
      ),
    },
    {
      id: 'details',
      header: 'Chi tiết',
      cell: ({ row }) => (
        <span className='text-sm'>{row.original.chi_tiet?.length ?? 0} bữa</span>
      ),
    },
    {
      accessorKey: 'trang_thai',
      header: 'Trạng thái',
      cell: ({ row }) => statusBadge(row.original.trang_thai),
    },
    {
      accessorKey: 'nguoi_tao',
      header: 'Người tạo',
      cell: ({ row }) => (
        <div className='text-sm'>
          <p>{row.original.nguoi_tao?.ho_ten ?? '—'}</p>
          <p className='text-xs text-muted-foreground'>{row.original.nguoi_tao?.email ?? ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'tao_luc',
      header: 'Ngày tạo',
      cell: ({ row }) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.original.tao_luc)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='size-8 p-0'>
              <DotsHorizontalIcon className='size-4' />
              <span className='sr-only'>Mở menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-52'>
            <DropdownMenuItem onClick={() => setDetailTarget(row.original)}>
              <Eye /> Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [])

  const table = useReactTable({
    data: items,
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
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-sm border bg-card p-4'>
            <p className='text-sm text-muted-foreground'>Tổng thực đơn mẫu</p>
            <p className='mt-1 text-2xl font-bold'>{stats.tong}</p>
          </div>
          <div className='rounded-sm border bg-card p-4'>
            <p className='text-sm text-muted-foreground'>Bản nháp</p>
            <p className='mt-1 text-2xl font-bold'>{stats.ban_nhap}</p>
          </div>
          <div className='rounded-sm border bg-card p-4'>
            <p className='text-sm text-muted-foreground'>Xuất bản</p>
            <p className='mt-1 text-2xl font-bold text-emerald-600'>{stats.xuat_ban}</p>
          </div>
          <div className='rounded-sm border bg-card p-4'>
            <p className='text-sm text-muted-foreground'>Lưu trữ</p>
            <p className='mt-1 text-2xl font-bold'>{stats.luu_tru}</p>
          </div>
        </div>

        <PageHeading
          title='Quản lý thực đơn mẫu'
          description='Xem và giám sát thực đơn mẫu do Nutritionist tạo trong hệ thống.'
          actions={[
            {
              label: 'Thêm thực đơn mẫu',
              onClick: () => router.push('/nutritionist/meal-templates'),
            },
          ]}
        />

        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Input
              placeholder='Tìm theo tiêu đề...'
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })) }}
              className='w-full max-w-sm'
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Trạng thái' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='ban_nhap'>Bản nháp</SelectItem>
                <SelectItem value='xuat_ban'>Xuất bản</SelectItem>
                <SelectItem value='luu_tru'>Lưu trữ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={goalFilter} onValueChange={(v) => { setGoalFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Mục tiêu' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả mục tiêu</SelectItem>
                <SelectItem value='giam_can'>Giảm cân</SelectItem>
                <SelectItem value='tang_can'>Tăng cân</SelectItem>
                <SelectItem value='giu_can'>Giữ cân</SelectItem>
              </SelectContent>
            </Select>
            <Select value={authorFilter} onValueChange={(v) => { setAuthorFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[200px] rounded-sm'><SelectValue placeholder='Người tạo' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả người tạo</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.ho_ten} ({a.so_thuc_don})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                ) : table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có thực đơn mẫu phù hợp.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      <MealTemplateDetailDialog
        open={detailTarget !== null}
        template={detailTarget}
        onOpenChange={(o) => { if (!o) setDetailTarget(null) }}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa thực đơn mẫu'
        description={deleteTarget ? `Xóa thực đơn mẫu "${deleteTarget.tieu_de}"?` : ''}
        confirmLabel='Xóa'
        loading={false}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget) }}
      />
    </>
  )
}
