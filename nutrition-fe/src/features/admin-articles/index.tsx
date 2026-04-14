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
import { BookOpenText, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/services/auth/api'
import {
  type AdminArticle,
  type AdminArticleAuthor,
  type AdminArticleCategory,
  type AdminArticleStatus,
  deleteAdminArticle,
  getAdminArticleAuthors,
  getAdminArticleCategories,
  getAdminArticle,
  getAdminArticles,
  getAdminArticleStats,
} from '@/services/admin-articles/api'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { AdminTopbar } from '@/components/layout/admin-topbar'

const PAGE_SIZE = 10

type ArticleViewMode = 'create' | 'edit' | 'view'

type ArticleFormState = {
  tieuDe: string
  danhMuc: string
  tomTat: string
  noiDung: string
  anhDaiDienUrl: string
  huongDanAi: string
}

const EMPTY_FORM: ArticleFormState = {
  tieuDe: '',
  danhMuc: '',
  tomTat: '',
  noiDung: '',
  anhDaiDienUrl: '',
  huongDanAi: '',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function statusBadge(s: AdminArticleStatus) {
  switch (s) {
    case 'ban_nhap': return <Badge variant='outline'>Bản nháp</Badge>
    case 'xuat_ban': return <Badge className='bg-emerald-100 text-emerald-700'>Xuất bản</Badge>
    case 'luu_tru': return <Badge variant='secondary'>Lưu trữ</Badge>
    default: return <Badge variant='outline'>{s}</Badge>
  }
}

function ArticleDialog({
  open,
  mode,
  loading,
  form,
  categories,
  onOpenChange,
  onFormChange,
}: {
  open: boolean
  mode: ArticleViewMode
  loading: boolean
  form: ArticleFormState
  categories: AdminArticleCategory[]
  onOpenChange: (open: boolean) => void
  onFormChange: (patch: Partial<ArticleFormState>) => void
}) {
  const readOnly = mode === 'view'

  return (
    <div
      className={open ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' : 'hidden'}
      onClick={() => onOpenChange(false)}
    >
      <div
        className='max-h-[90vh] w-full overflow-y-auto rounded-sm border bg-background p-4 shadow-lg sm:max-w-3xl'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='mb-4 space-y-1'>
          <h2 className='text-lg font-semibold'>
            {mode === 'create' ? 'Tạo bài viết mới'
              : mode === 'edit' ? 'Cập nhật bài viết'
                : 'Chi tiết bài viết'}
          </h2>
          <p className='text-sm text-muted-foreground'>
            Bài viết chuyên môn do Nutritionist tạo. Admin có thể xem chi tiết.
          </p>
        </div>

        {loading ? (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Đang tải dữ liệu bài viết...
          </div>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tiêu đề</label>
                <Input
                  value={form.tieuDe}
                  disabled={readOnly}
                  onChange={(e) => onFormChange({ tieuDe: e.target.value })}
                  className='w-full rounded-sm'
                  placeholder='Nhập tiêu đề bài viết'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Danh mục</label>
                <Input
                  value={form.danhMuc}
                  disabled={readOnly}
                  onChange={(e) => onFormChange({ danhMuc: e.target.value })}
                  className='w-full rounded-sm'
                  placeholder='dinh_duong, suc_khoe...'
                  list='article-categories'
                />
                <datalist id='article-categories'>
                  {categories.map((c) => (
                    <option key={c.danh_muc} value={c.danh_muc} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className='mt-4 space-y-2'>
              <label className='text-sm font-medium'>Tóm tắt</label>
              <Textarea
                value={form.tomTat}
                disabled={readOnly}
                onChange={(e) => onFormChange({ tomTat: e.target.value })}
                className='w-full rounded-sm'
                placeholder='Tóm tắt nội dung bài viết'
              />
            </div>
            <div className='mt-4 space-y-2'>
              <label className='text-sm font-medium'>Nội dung</label>
              <Textarea
                value={form.noiDung}
                disabled={readOnly}
                onChange={(e) => onFormChange({ noiDung: e.target.value })}
                className='min-h-[200px] w-full rounded-sm'
                placeholder='Nội dung chi tiết bài viết'
              />
            </div>
            <div className='mt-4 space-y-2'>
              <label className='text-sm font-medium'>Ảnh đại diện (URL)</label>
              <Input
                value={form.anhDaiDienUrl}
                disabled={readOnly}
                onChange={(e) => onFormChange({ anhDaiDienUrl: e.target.value })}
                className='w-full rounded-sm'
                placeholder='https://...'
              />
            </div>
            <div className='mt-4 space-y-2'>
              <label className='text-sm font-medium'>Guideline AI (JSON)</label>
              <Textarea
                value={form.huongDanAi}
                disabled={readOnly}
                onChange={(e) => onFormChange({ huongDanAi: e.target.value })}
                className='min-h-[80px] w-full rounded-sm font-mono text-xs'
                placeholder='{"rule":"...","context":"..."}'
              />
            </div>

            <div className='mt-4 flex gap-2'>
              <Button variant='outline' onClick={() => onOpenChange(false)} className='rounded-sm'>
                {readOnly ? 'Đóng' : 'Hủy'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function AdminArticles() {
  const router = useRouter()
  const [items, setItems] = useState<AdminArticle[]>([])
  const [stats, setStats] = useState({ tong: 0, ban_nhap: 0, xuat_ban: 0, luu_tru: 0 })
  const [categories, setCategories] = useState<AdminArticleCategory[]>([])
  const [authors, setAuthors] = useState<AdminArticleAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminArticle | null>(null)
  const [dialogMode, setDialogMode] = useState<ArticleViewMode | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<ArticleFormState>(EMPTY_FORM)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [pageCount, setPageCount] = useState(0)

  const loadMeta = useCallback(async () => {
    try {
      const [catRes, authRes, statsRes] = await Promise.all([
        getAdminArticleCategories(),
        getAdminArticleAuthors(),
        getAdminArticleStats(),
      ])
      setCategories(catRes)
      setAuthors(authRes)
      setStats(statsRes)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được siêu dữ liệu')
    }
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminArticles({
        tieuDe: keyword || undefined,
        trangThai: statusFilter === 'all' ? undefined : statusFilter as AdminArticleStatus,
        danhMuc: categoryFilter === 'all' ? undefined : categoryFilter,
        tacGiaId: authorFilter === 'all' ? undefined : authorFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setItems(res.items)
      setPageCount(Math.max(Math.ceil(res.pagination.total / res.pagination.limit), 1))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không tải được danh sách bài viết')
      setItems([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, categoryFilter, authorFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadMeta() }, [loadMeta])
  useEffect(() => { void loadItems() }, [loadItems])

  useEffect(() => {
    if (!selectedId || dialogMode === 'create') {
      if (dialogMode === 'create') setForm(EMPTY_FORM)
      return
    }
    let isMounted = true
    setDetailLoading(true)
    void getAdminArticle(selectedId)
      .then((a) => {
        if (!isMounted) return
        setForm({
          tieuDe: a.tieu_de,
          danhMuc: a.danh_muc ?? '',
          tomTat: a.tom_tat ?? '',
          noiDung: a.noi_dung,
          anhDaiDienUrl: a.anh_dai_dien_url ?? '',
          huongDanAi: a.huong_dan_ai ? JSON.stringify(a.huong_dan_ai, null, 2) : '',
        })
      })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : 'Không tải được chi tiết'))
      .finally(() => { if (isMounted) setDetailLoading(false) })
    return () => { isMounted = false }
  }, [dialogMode, selectedId])

  const openView = (a: AdminArticle) => { setSelectedId(a.id); setDialogMode('view') }
  const openEdit = (a: AdminArticle) => { setSelectedId(a.id); setDialogMode('edit') }
  const openCreate = () => { setForm(EMPTY_FORM); setSelectedId(null); setDialogMode('create') }
  const resetDialog = () => { setDialogMode(null); setSelectedId(null); setForm(EMPTY_FORM); setDetailLoading(false) }

  const handleDelete = async (a: AdminArticle) => {
    try {
      await deleteAdminArticle(a.id)
      toast.success(`Đã xóa bài viết "${a.tieu_de}"`)
      setDeleteTarget(null)
      await loadItems()
      void loadMeta()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Xóa thất bại')
    }
  }

  const columns = useMemo<ColumnDef<AdminArticle>[]>(() => [
    {
      accessorKey: 'tieu_de',
      header: 'Tiêu đề',
      cell: ({ row }) => (
        <div>
          <p className='font-medium line-clamp-1'>{row.original.tieu_de}</p>
          <p className='text-xs text-muted-foreground'>{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'danh_muc',
      header: 'Danh mục',
      cell: ({ row }) => (
        <Badge variant='outline' className='text-xs'>{row.original.danh_muc ?? '—'}</Badge>
      ),
    },
    {
      accessorKey: 'trang_thai',
      header: 'Trạng thái',
      cell: ({ row }) => statusBadge(row.original.trang_thai),
    },
    {
      accessorKey: 'tac_gia',
      header: 'Tác giả',
      cell: ({ row }) => (
        <div className='text-sm'>
          <p>{row.original.tac_gia?.ho_ten ?? '—'}</p>
          <p className='text-xs text-muted-foreground'>{row.original.tac_gia?.email ?? ''}</p>
        </div>
      ),
    },
    {
      id: 'ai',
      header: 'AI Guideline',
      cell: ({ row }) => (
        row.original.huong_dan_ai
          ? <Badge variant='secondary' className='text-xs'>Có</Badge>
          : <span className='text-xs text-muted-foreground'>—</span>
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
            <DropdownMenuItem onClick={() => openView(row.original)}>
              <Eye /> Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Pencil /> Chỉnh sửa
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
            <p className='text-sm text-muted-foreground'>Tổng bài viết</p>
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
          title='Quản lý bài viết'
          description='Xem và giám sát bài viết chuyên môn do Nutritionist tạo trong hệ thống.'
          actions={[
            {
              label: 'Xem bài viết công khai',
              onClick: () => router.push('/nutrition/articles'),
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
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[180px] rounded-sm'><SelectValue placeholder='Danh mục' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.danh_muc} value={c.danh_muc}>{c.danh_muc} ({c.so_luong})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={authorFilter} onValueChange={(v) => { setAuthorFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
              <SelectTrigger className='w-[200px] rounded-sm'><SelectValue placeholder='Tác giả' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả tác giả</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.ho_ten} ({a.so_bai_viet})</SelectItem>
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
                  <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có bài viết phù hợp.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      <ArticleDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'view'}
        loading={detailLoading}
        form={form}
        categories={categories}
        onOpenChange={(o) => { if (!o) resetDialog() }}
        onFormChange={(patch) => setForm((c) => ({ ...c, ...patch }))}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa bài viết'
        description={deleteTarget ? `Xóa bài viết "${deleteTarget.tieu_de}"?` : ''}
        confirmLabel='Xóa'
        loading={false}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget) }}
      />
    </>
  )
}
