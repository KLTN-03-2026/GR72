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
  Check,
  Eye,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import {
  type FoodReviewRequest,
  type ReviewRequestStatus,
  approveFoodReview,
  getFoodReviewDetail,
  getFoodReviewRequests,
  rejectFoodReview,
} from '@/services/admin-food-reviews/api'
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
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

const PAGE_SIZE = 10

function getStatusLabel(status: ReviewRequestStatus) {
  switch (status) {
    case 'cho_duyet':
      return 'Chờ duyệt'
    case 'da_duyet':
      return 'Đã duyệt'
    case 'tu_choi':
      return 'Từ chối'
    default:
      return status
  }
}

function getStatusVariant(status: ReviewRequestStatus) {
  switch (status) {
    case 'cho_duyet':
      return 'default' as const
    case 'da_duyet':
      return 'secondary' as const
    case 'tu_choi':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function JsonCompareView({
  label,
  data,
}: {
  label: string
  data: Record<string, unknown> | null
}) {
  if (!data) {
    return (
      <div className='space-y-1'>
        <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          {label}
        </Label>
        <div className='rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'>
          Không có dữ liệu
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-1'>
      <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </Label>
      <div className='max-h-64 overflow-auto rounded-md border bg-muted/30 p-3'>
        <pre className='text-xs leading-relaxed whitespace-pre-wrap break-all'>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function ReviewDetailDialog({
  open,
  review,
  loading,
  onOpenChange,
  onApprove,
  onReject,
}: {
  open: boolean
  review: FoodReviewRequest | null
  loading: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (note: string) => void
  onReject: (note: string) => void
}) {
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (open) setNote('')
  }, [open])

  const isPending = review?.trang_thai === 'cho_duyet'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-sm p-4 sm:max-w-3xl max-h-[90vh] overflow-auto'>
        <DialogHeader>
          <DialogTitle>
            Chi tiết yêu cầu duyệt #{review?.id ?? ''}
          </DialogTitle>
          <DialogDescription>
            {isPending
              ? 'Xem dữ liệu hiện tại và đề xuất, sau đó duyệt hoặc từ chối.'
              : 'Xem lại thông tin yêu cầu đã được xử lý.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Đang tải chi tiết...
          </div>
        ) : review ? (
          <>
            <div className='grid gap-3 text-sm sm:grid-cols-2'>
              <div>
                <span className='text-muted-foreground'>Loại yêu cầu: </span>
                <span className='font-medium'>{review.loai_yeu_cau}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Trạng thái: </span>
                <Badge variant={getStatusVariant(review.trang_thai)}>
                  {getStatusLabel(review.trang_thai)}
                </Badge>
              </div>
              <div>
                <span className='text-muted-foreground'>Người đề xuất: </span>
                <span className='font-medium'>
                  {review.nguoi_de_xuat?.ho_ten ?? '—'}{' '}
                  <span className='text-muted-foreground'>
                    ({review.nguoi_de_xuat?.email ?? '—'})
                  </span>
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Thời điểm gửi: </span>
                <span className='font-medium'>
                  {formatDateTime(review.tao_luc)}
                </span>
              </div>
              {review.ten_nguon && (
                <div>
                  <span className='text-muted-foreground'>Nguồn: </span>
                  <span className='font-medium'>{review.ten_nguon}</span>
                </div>
              )}
              {review.ma_nguon && (
                <div>
                  <span className='text-muted-foreground'>Mã nguồn: </span>
                  <code className='rounded bg-muted px-1 text-xs'>
                    {review.ma_nguon}
                  </code>
                </div>
              )}
              {review.ly_do && (
                <div className='sm:col-span-2'>
                  <span className='text-muted-foreground'>Lý do đề xuất: </span>
                  <span className='font-medium'>{review.ly_do}</span>
                </div>
              )}
              {review.nguoi_duyet && (
                <>
                  <div>
                    <span className='text-muted-foreground'>Người duyệt: </span>
                    <span className='font-medium'>
                      {review.nguoi_duyet.ho_ten}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Duyệt lúc: </span>
                    <span className='font-medium'>
                      {formatDateTime(review.duyet_luc)}
                    </span>
                  </div>
                </>
              )}
              {review.ghi_chu_duyet && (
                <div className='sm:col-span-2'>
                  <span className='text-muted-foreground'>Ghi chú duyệt: </span>
                  <span className='font-medium'>{review.ghi_chu_duyet}</span>
                </div>
              )}
            </div>

            <div className='mt-2 grid gap-4 sm:grid-cols-2'>
              <JsonCompareView
                label='Dữ liệu hiện tại'
                data={review.du_lieu_hien_tai}
              />
              <JsonCompareView
                label='Dữ liệu đề xuất'
                data={review.du_lieu_de_xuat}
              />
            </div>

            {isPending && (
              <div className='mt-2 space-y-2'>
                <Label>Ghi chú duyệt / Lý do từ chối</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='Nhập ghi chú (bắt buộc khi từ chối)...'
                  className='min-h-[80px] rounded-sm'
                />
              </div>
            )}

            <DialogFooter className='gap-2 sm:justify-end'>
              {isPending ? (
                <>
                  <Button
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    disabled={actionLoading}
                    className='rounded-sm'
                  >
                    Đóng
                  </Button>
                  <Button
                    variant='destructive'
                    disabled={actionLoading || !note.trim()}
                    className='rounded-sm'
                    onClick={async () => {
                      setActionLoading(true)
                      try {
                        onReject(note.trim())
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                  >
                    <X className='mr-1 size-4' />
                    Từ chối
                  </Button>
                  <Button
                    disabled={actionLoading}
                    className='rounded-sm'
                    onClick={async () => {
                      setActionLoading(true)
                      try {
                        onApprove(note.trim())
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                  >
                    <Check className='mr-1 size-4' />
                    Duyệt
                  </Button>
                </>
              ) : (
                <Button
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  className='rounded-sm'
                >
                  Đóng
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Không tìm thấy dữ liệu.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AdminFoodReviews() {
  const [requests, setRequests] = useState<FoodReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedReview, setSelectedReview] = useState<FoodReviewRequest | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewRequestStatus>('cho_duyet')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [pageCount, setPageCount] = useState(0)

  const loadRequests = useCallback(async () => {
    setLoading(true)

    try {
      const response = await getFoodReviewRequests({
        trangThai: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })

      setRequests(response.items)
      setPageCount(
        Math.max(
          Math.ceil(response.pagination.total / response.pagination.limit),
          1
        )
      )
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Không tải được danh sách yêu cầu duyệt'
      )
      setRequests([])
      setPageCount(1)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  useEffect(() => {
    if (!selectedId) return

    let isMounted = true
    setDetailLoading(true)

    void getFoodReviewDetail(selectedId)
      .then((review) => {
        if (!isMounted) return
        setSelectedReview(review)
      })
      .catch((error) => {
        if (!isMounted) return
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Không tải được chi tiết'
        )
        setSelectedReview(null)
      })
      .finally(() => {
        if (isMounted) setDetailLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedId])

  const handleApprove = async (note: string) => {
    if (!selectedReview) return

    try {
      await approveFoodReview(selectedReview.id, note || undefined)
      toast.success('Đã duyệt yêu cầu thành công.')
      setSelectedId(null)
      setSelectedReview(null)
      await loadRequests()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Duyệt thất bại'
      )
    }
  }

  const handleReject = async (note: string) => {
    if (!selectedReview) return

    try {
      await rejectFoodReview(selectedReview.id, note)
      toast.success('Đã từ chối yêu cầu.')
      setSelectedId(null)
      setSelectedReview(null)
      await loadRequests()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Từ chối thất bại'
      )
    }
  }

  const columns = useMemo<ColumnDef<FoodReviewRequest>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className='font-mono text-sm text-muted-foreground'>
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'loai_yeu_cau',
        header: 'Loại',
        cell: ({ row }) => (
          <Badge variant='outline'>{row.original.loai_yeu_cau}</Badge>
        ),
      },
      {
        id: 'nguoi_de_xuat',
        header: 'Người đề xuất',
        cell: ({ row }) => (
          <div>
            <p className='font-medium'>
              {row.original.nguoi_de_xuat?.ho_ten ?? '—'}
            </p>
            <p className='text-xs text-muted-foreground'>
              {row.original.nguoi_de_xuat?.email ?? ''}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'trang_thai',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.trang_thai)}>
            {getStatusLabel(row.original.trang_thai)}
          </Badge>
        ),
      },
      {
        accessorKey: 'tao_luc',
        header: 'Ngày gửi',
        cell: ({ row }) => formatDateTime(row.original.tao_luc),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSelectedId(row.original.id)}
            >
              <Eye className='mr-1 size-4' />
              Xem
            </Button>
            {row.original.trang_thai === 'cho_duyet' && (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-green-600 hover:text-green-700'
                  onClick={async () => {
                    try {
                      await approveFoodReview(row.original.id)
                      toast.success(`Đã duyệt #${row.original.id}`)
                      await loadRequests()
                    } catch (error) {
                      toast.error(
                        error instanceof ApiError
                          ? error.message
                          : 'Duyệt thất bại'
                      )
                    }
                  }}
                >
                  <Check className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-red-600 hover:text-red-700'
                  onClick={() => setSelectedId(row.original.id)}
                >
                  <X className='size-4' />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [loadRequests]
  )

  const table = useReactTable({
    data: requests,
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
          title='Duyệt dữ liệu thực phẩm'
          description='Kiểm soát chất lượng dữ liệu từ API ngoài và đề xuất của chuyên gia dinh dưỡng trước khi đưa vào catalog.'
        />

        <div className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | ReviewRequestStatus)
                setPagination((current) => ({ ...current, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className='w-[220px] rounded-sm'>
                <SelectValue placeholder='Lọc trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='cho_duyet'>Chờ duyệt</SelectItem>
                <SelectItem value='da_duyet'>Đã duyệt</SelectItem>
                <SelectItem value='tu_choi'>Từ chối</SelectItem>
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
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      Đang tải danh sách yêu cầu duyệt...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
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
                      Không tìm thấy yêu cầu duyệt nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </Main>

      <ReviewDetailDialog
        open={selectedId !== null}
        review={selectedReview}
        loading={detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null)
            setSelectedReview(null)
          }
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  )
}
