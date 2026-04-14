'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef, type PaginationState, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NNutriNotification, getNutriNotifications, markNutriNotificationRead } from '@/services/nutritionist/api'
import { cn } from '@/lib/utils'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

type Notification = NNutriNotification

export function NutritionStaffNotifications() {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriNotifications({
        trangThai: filter === 'all' ? undefined : filter,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setItems(res?.items ?? [])
      setPageCount(Math.max(Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)), 1))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lỗi tải thông báo')
    } finally {
      setLoading(false)
    }
  }, [filter, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { void loadData() }, [loadData])

  const handleMarkRead = useCallback(async (id: number) => {
    setMarkingId(id)
    try {
      await markNutriNotificationRead(id)
      toast.success('Đã đánh dấu đã đọc')
      await loadData()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Thất bại')
    } finally {
      setMarkingId(null)
    }
  }, [loadData])

  const handleRowClick = useCallback(async (item: Notification) => {
    if (item.trang_thai === 'chua_doc') {
      await handleMarkRead(item.id)
    }
    if (item.duong_dan_hanh_dong) {
      router.push(item.duong_dan_hanh_dong)
    }
  }, [handleMarkRead, router])

  const columns = useMemo<ColumnDef<Notification>[]>(() => [
    { accessorKey: 'tieu_de', header: 'Tiêu đề', cell: ({ row }) => (
      <button
        className='w-full text-left'
        onClick={() => void handleRowClick(row.original)}
      >
        <span className={cn('font-medium', row.original.trang_thai === 'chua_doc' && 'font-semibold')}>
          {row.original.tieu_de}
        </span>
      </button>
    )},
    { accessorKey: 'noi_dung', header: 'Nội dung', cell: ({ row }) => (
      <span className='line-clamp-2 max-w-md text-xs text-muted-foreground'>
        {row.original.noi_dung || <span className='italic'>Không có nội dung</span>}
      </span>
    )},
    { accessorKey: 'loai', header: 'Loại', cell: ({ row }) => <Badge variant='outline' className='text-xs'>{row.original.loai}</Badge> },
    { accessorKey: 'trang_thai', header: 'Trạng thái', cell: ({ row }) => row.original.trang_thai === 'da_doc'
      ? <Badge className='gap-1 bg-emerald-100 text-emerald-700'><Bell className='size-3' />Đã đọc</Badge>
      : <Badge variant='outline' className='gap-1'><BellOff className='size-3' />Chưa đọc</Badge>
    },
    { id: 'date', header: 'Ngày', cell: ({ row }) => <span className='text-xs text-muted-foreground'>{new Date(row.original.tao_luc).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      row.original.trang_thai === 'chua_doc'
        ? (
            <Button
              variant='outline'
              size='sm'
              className='rounded-sm'
              disabled={markingId === row.original.id}
              onClick={() => void handleMarkRead(row.original.id)}
            >
              Đánh dấu đã đọc
            </Button>
          )
        : (
            row.original.duong_dan_hanh_dong && (
              <Button
                variant='ghost'
                size='sm'
                className='rounded-sm text-xs text-muted-foreground'
                onClick={() => { router.push(row.original.duong_dan_hanh_dong!) }}
              >
                Xem chi tiết →
              </Button>
            )
          )
    ) },
  ], [markingId, handleMarkRead, router])

  const table = useReactTable({ data: items, columns, state: { pagination }, manualPagination: true, pageCount, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() })
  const rows = (() => { try { return table.getRowModel().rows } catch { return [] } })()

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-5'>
        <PageHeading title='Thông báo' description='Thông báo hệ thống và kết quả duyệt đề xuất.' />
        <div className='space-y-4'>
          <Select value={filter} onValueChange={v => { setFilter(v); setPagination(c => ({ ...c, pageIndex: 0 })) }}>
            <SelectTrigger className='w-[180px] rounded-sm'><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value='all'>Tất cả</SelectItem><SelectItem value='chua_doc'>Chưa đọc</SelectItem><SelectItem value='da_doc'>Đã đọc</SelectItem></SelectContent>
          </Select>
          <div className='overflow-hidden rounded-sm border bg-card'>
            <Table>
              <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={columns.length} className='h-24 text-center'>Đang tải...</TableCell></TableRow>
                : rows.length > 0 ? rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
                : <TableRow><TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>Chưa có thông báo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
    </>
  )
}
