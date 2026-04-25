'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Copy,
  Globe,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  type ColumnDef,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type NArticle,
  archiveNutriArticle,
  createNutriArticle,
  deleteNutriArticle,
  getNutriArticles,
  publishNutriArticle,
  updateNutriArticle,
  uploadNutriArticleImages,
} from '@/services/nutritionist/api'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

function statusBadge(status: string) {
  switch (status) {
    case 'ban_nhap':
      return <Badge variant='outline'>Bản nháp</Badge>
    case 'xuat_ban':
      return <Badge className='bg-emerald-100 text-emerald-700'>Xuất bản</Badge>
    case 'luu_tru':
      return <Badge variant='secondary'>Lưu trữ</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

type FormState = {
  tieuDe: string
  noiDung: string
  danhMuc: string
  tomTat: string
  theGan: string
  anhDaiDienUrl: string
  huongDanAi: string
}

const DEFAULT_FORM: FormState = {
  tieuDe: '',
  noiDung: '',
  danhMuc: '',
  tomTat: '',
  theGan: '',
  anhDaiDienUrl: '',
  huongDanAi: '',
}

export function NutritionStaffArticles() {
  const [items, setItems] = useState<NArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [pageCount, setPageCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NArticle | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NArticle | null>(null)

  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingInlineImages, setUploadingInlineImages] = useState(false)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriArticles({
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setItems(res?.items ?? [])
      setPageCount(
        Math.max(
          Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)),
          1,
        ),
      )
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Lỗi không xác định',
      )
    } finally {
      setLoading(false)
    }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openCreate = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setUploadedImageUrls([])
    setDialogOpen(true)
  }

  const openEdit = (article: NArticle) => {
    setEditing(article)
    setForm({
      tieuDe: article.tieu_de,
      noiDung: article.noi_dung,
      danhMuc: article.danh_muc ?? '',
      tomTat: article.tom_tat ?? '',
      theGan: (article.the_gan ?? []).join(', '),
      anhDaiDienUrl: article.anh_dai_dien_url ?? '',
      huongDanAi: article.huong_dan_ai
        ? JSON.stringify(article.huong_dan_ai, null, 2)
        : '',
    })
    setUploadedImageUrls([])
    setDialogOpen(true)
  }

  const handleUploadCover = async (file: File | null) => {
    if (!file) return
    setUploadingCover(true)
    try {
      const response = await uploadNutriArticleImages([file])
      const firstUrl = response.urls[0]
      if (!firstUrl) {
        toast.error('Không lấy được URL ảnh sau khi upload')
        return
      }
      setForm((current) => ({ ...current, anhDaiDienUrl: firstUrl }))
      toast.success('Đã upload ảnh đại diện')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload ảnh thất bại')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleUploadInlineImages = async (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : []
    if (!files.length) return

    setUploadingInlineImages(true)
    try {
      const response = await uploadNutriArticleImages(files)
      if (!response.urls.length) {
        toast.error('Không có ảnh nào được upload')
        return
      }

      const markdown = response.urls
        .map((url, index) => `![image-${index + 1}](${url})`)
        .join('\n\n')

      setForm((current) => ({
        ...current,
        noiDung: current.noiDung
          ? `${current.noiDung.trim()}\n\n${markdown}`
          : markdown,
      }))
      setUploadedImageUrls((current) => [...response.urls, ...current])
      toast.success(`Đã upload ${response.urls.length} ảnh và chèn vào nội dung`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload ảnh thất bại')
    } finally {
      setUploadingInlineImages(false)
    }
  }

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Đã copy')
    } catch {
      toast.error('Không thể copy vào clipboard')
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const huongDanAi = form.huongDanAi.trim()
        ? JSON.parse(form.huongDanAi)
        : undefined
      const theGan = form.theGan
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      if (editing) {
        await updateNutriArticle(editing.id, {
          tieuDe: form.tieuDe.trim(),
          noiDung: form.noiDung,
          danhMuc: form.danhMuc.trim() || undefined,
          tomTat: form.tomTat.trim() || undefined,
          theGan: theGan.length ? theGan : undefined,
          anhDaiDienUrl: form.anhDaiDienUrl.trim() || undefined,
          huongDanAi,
        })
        toast.success('Đã cập nhật bài viết.')
      } else {
        await createNutriArticle({
          tieuDe: form.tieuDe.trim(),
          noiDung: form.noiDung,
          danhMuc: form.danhMuc.trim() || undefined,
          tomTat: form.tomTat.trim() || undefined,
          theGan: theGan.length ? theGan : undefined,
          anhDaiDienUrl: form.anhDaiDienUrl.trim() || undefined,
          huongDanAi,
        })
        toast.success('Đã tạo bài viết.')
      }
      setDialogOpen(false)
      await loadData()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (article: NArticle) => {
    try {
      await publishNutriArticle(article.id)
      toast.success('Đã xuất bản.')
      await loadData()
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Lỗi không xác định',
      )
    }
  }

  const handleArchive = async (article: NArticle) => {
    try {
      await archiveNutriArticle(article.id)
      toast.success('Đã lưu trữ.')
      await loadData()
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Lỗi không xác định',
      )
    }
  }

  const handleDelete = async (article: NArticle) => {
    try {
      await deleteNutriArticle(article.id)
      toast.success('Đã xóa.')
      setDeleteTarget(null)
      await loadData()
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Lỗi không xác định',
      )
    }
  }

  const columns = useMemo<ColumnDef<NArticle>[]>(
    () => [
      {
        id: 'cover',
        header: 'Ảnh',
        cell: ({ row }) => {
          const url = row.original.anh_dai_dien_url
          if (!url) return <span className='text-xs text-muted-foreground'>—</span>
          return (
            <img
              src={url}
              alt={row.original.tieu_de}
              className='h-10 w-16 rounded object-cover'
            />
          )
        },
      },
      {
        accessorKey: 'tieu_de',
        header: 'Tiêu đề',
        cell: ({ row }) => (
          <span className='line-clamp-2 font-medium'>{row.original.tieu_de}</span>
        ),
      },
      {
        accessorKey: 'danh_muc',
        header: 'Danh mục',
        cell: ({ row }) => <span className='text-sm'>{row.original.danh_muc ?? '—'}</span>,
      },
      {
        accessorKey: 'trang_thai',
        header: 'Trạng thái',
        cell: ({ row }) => statusBadge(row.original.trang_thai),
      },
      {
        id: 'date',
        header: 'Ngày tạo',
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {new Date(row.original.tao_luc).toLocaleDateString('vi-VN')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const article = row.original
          return (
            <div className='flex justify-end gap-1'>
              <Button variant='ghost' size='sm' onClick={() => openEdit(article)}>
                <Pencil className='size-4' />
              </Button>
              {article.trang_thai === 'ban_nhap' && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handlePublish(article)}
                  title='Xuất bản'
                >
                  <Globe className='size-4 text-emerald-600' />
                </Button>
              )}
              {article.trang_thai === 'xuat_ban' && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleArchive(article)}
                  title='Lưu trữ'
                >
                  <Archive className='size-4 text-amber-600' />
                </Button>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='text-red-600'
                onClick={() => setDeleteTarget(article)}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          )
        },
      },
    ],
    [],
  )

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
  const rows = (() => {
    try {
      return table.getRowModel().rows
    } catch {
      return []
    }
  })()

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <PageHeading
          title='Quản lý bài viết & Guideline AI'
          description='Tạo bài viết chuyên môn, upload nhiều ảnh và quản lý nội dung xuất bản.'
        />

        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[180px] rounded-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='ban_nhap'>Bản nháp</SelectItem>
                <SelectItem value='xuat_ban'>Xuất bản</SelectItem>
                <SelectItem value='luu_tru'>Lưu trữ</SelectItem>
              </SelectContent>
            </Select>

            <div className='ml-auto'>
              <Button onClick={openCreate} className='rounded-sm'>
                <Plus className='mr-1 size-4' />
                Tạo bài viết
              </Button>
            </div>
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
                              header.getContext(),
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
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : rows.length > 0 ? (
                  rows.map((row) => (
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
                      Chưa có bài viết.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false)
            setEditing(null)
          }
        }}
      >
        <DialogContent className='max-h-[90vh] overflow-auto rounded-sm p-5 sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa bài viết' : 'Tạo bài viết'}</DialogTitle>
            <DialogDescription>
              Hỗ trợ upload ảnh đại diện và nhiều ảnh nội dung. Ảnh nội dung sẽ được chèn vào phần nội dung dưới dạng markdown.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-5'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>
                  Tiêu đề <span className='text-red-500'>*</span>
                </Label>
                <Input
                  value={form.tieuDe}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tieuDe: event.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Danh mục</Label>
                <Input
                  value={form.danhMuc}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, danhMuc: event.target.value }))
                  }
                  placeholder='Ví dụ: Dinh dưỡng giảm cân'
                />
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Tóm tắt</Label>
                <Textarea
                  value={form.tomTat}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tomTat: event.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Thẻ gắn (cách nhau bởi dấu phẩy)</Label>
                <Input
                  value={form.theGan}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, theGan: event.target.value }))
                  }
                  placeholder='ví dụ: giảm cân, eat-clean, bữa sáng'
                />
              </div>
            </div>

            <div className='rounded-lg border p-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <Label>Ảnh đại diện bài viết</Label>
                <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted'>
                  <Upload className='size-4' />
                  {uploadingCover ? 'Đang upload...' : 'Upload ảnh đại diện'}
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    disabled={uploadingCover}
                    onChange={(event) =>
                      void handleUploadCover(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
              <div className='mt-3 grid gap-3 sm:grid-cols-[1fr_auto]'>
                <Input
                  value={form.anhDaiDienUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      anhDaiDienUrl: event.target.value,
                    }))
                  }
                  placeholder='/api/uploads/articles/...'
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void copyText(form.anhDaiDienUrl)}
                  disabled={!form.anhDaiDienUrl}
                >
                  <Copy className='mr-1 size-3.5' />
                  Copy URL
                </Button>
              </div>
              {form.anhDaiDienUrl ? (
                <img
                  src={form.anhDaiDienUrl}
                  alt='Ảnh đại diện'
                  className='mt-3 h-40 w-full rounded-md object-cover sm:h-48'
                />
              ) : null}
            </div>

            <div className='rounded-lg border p-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <Label>Ảnh nội dung (upload nhiều ảnh)</Label>
                <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted'>
                  <ImagePlus className='size-4' />
                  {uploadingInlineImages
                    ? 'Đang upload...'
                    : 'Upload và chèn vào nội dung'}
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    disabled={uploadingInlineImages}
                    onChange={(event) => void handleUploadInlineImages(event.target.files)}
                  />
                </label>
              </div>
              <p className='mt-2 text-xs text-muted-foreground'>
                Mỗi ảnh upload xong sẽ được tự động chèn vào nội dung theo định dạng markdown: <code>![alt](url)</code>
              </p>
              {uploadedImageUrls.length > 0 ? (
                <div className='mt-3 space-y-2'>
                  {uploadedImageUrls.slice(0, 6).map((url) => (
                    <div
                      key={url}
                      className='flex items-center justify-between gap-2 rounded border px-2 py-1.5'
                    >
                      <p className='truncate text-xs text-muted-foreground'>{url}</p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => void copyText(url)}
                      >
                        <Copy className='size-3.5' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className='space-y-2'>
              <Label>
                Nội dung <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                value={form.noiDung}
                onChange={(event) =>
                  setForm((current) => ({ ...current, noiDung: event.target.value }))
                }
                className='min-h-[220px]'
              />
            </div>

            <div className='space-y-2'>
              <Label>Guideline AI (JSON, tùy chọn)</Label>
              <Textarea
                value={form.huongDanAi}
                onChange={(event) =>
                  setForm((current) => ({ ...current, huongDanAi: event.target.value }))
                }
                className='min-h-[90px] font-mono text-xs'
                placeholder='{"rule":"...","context":"..."}'
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.tieuDe.trim() || !form.noiDung.trim()}
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Tạo bài viết'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title='Xóa bài viết'
        description={deleteTarget ? `Xóa "${deleteTarget.tieu_de}"?` : ''}
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
