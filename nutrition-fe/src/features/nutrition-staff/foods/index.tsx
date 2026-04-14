'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ColumnDef, type PaginationState, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Eye, Search } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/services/auth/api'
import { type NFood, getNutriFoods } from '@/services/nutritionist/api'
import { Link } from '@/lib/router'
import { DataTablePagination } from '@/components/data-table'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'

export function NutritionStaffFoods() {
  const [foods, setFoods] = useState<NFood[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNutriFoods({
        keyword: keyword || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
      setFoods(res?.items ?? [])
      setPageCount(
        Math.max(Math.ceil((res?.pagination?.total ?? 0) / (res?.pagination?.limit || 10)), 1),
      )
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [keyword, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const columns = useMemo<ColumnDef<NFood>[]>(
    () => [
      {
        accessorKey: 'ten',
        header: 'Tên thực phẩm',
        cell: ({ row }) => <span className='font-medium'>{row.original.ten}</span>,
      },
      {
        id: 'nhom',
        header: 'Nhóm',
        cell: ({ row }) => <span className='text-sm'>{row.original.nhom_thuc_pham?.ten ?? '—'}</span>,
      },
      {
        id: 'cal',
        header: 'Kcal/100g',
        cell: ({ row }) => <span className='text-sm tabular-nums'>{row.original.calories_100g ?? '—'}</span>,
      },
      {
        id: 'protein',
        header: 'Protein',
        cell: ({ row }) => (
          <span className='text-sm tabular-nums'>{row.original.protein_100g ?? '—'}g</span>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={row.original.da_xac_minh ? 'secondary' : 'outline'}>
            {row.original.da_xac_minh ? 'Đã xác minh' : 'Chưa xác minh'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0' asChild title='Xem chi tiết'>
              <Link to={`/nutritionist/foods/${row.original.id}`}>
                <Eye className='size-4' />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: foods,
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
          title='Quản lý thực phẩm'
          description='Tra cứu catalog thực phẩm; xem chi tiết từng mục hoặc tạo yêu cầu chỉnh sửa qua luồng duyệt.'
        />
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative min-w-[200px] max-w-md flex-1'>
              <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Tìm theo tên...'
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPagination((c) => ({ ...c, pageIndex: 0 }))
                }}
                className='rounded-sm pl-9'
              />
            </div>
            <div className='ml-auto'>
              <Button variant='outline' className='rounded-sm' asChild>
                <Link to='/nutritionist/food-review-requests'>Yêu cầu chỉnh sửa</Link>
              </Button>
            </div>
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
                    <TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>
                      Không có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </Main>
    </>
  )
}
