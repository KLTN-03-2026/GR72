'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Main } from '@/components/layout/main'
import { DetailCard } from '@/features/nutrition/components/detail-card'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

const PAGE_SIZE = 4

export function NutritionStaffFoodReviewRequests() {
  const requests = useNutritionStore((state) => state.foodReviewRequests)
  const updateFoodReviewStatus = useNutritionStore((state) => state.updateFoodReviewStatus)
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesQuery =
        request.foodName.toLowerCase().includes(query.toLowerCase()) ||
        request.requestedBy.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [query, requests, statusFilter])

  const totalPages = Math.max(Math.ceil(filteredRequests.length / PAGE_SIZE), 1)
  const paginatedRequests = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedId) ?? paginatedRequests[0] ?? requests[0]

  function handleUpdateStatus(status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối') {
    if (!selectedRequest) return
    updateFoodReviewStatus(selectedRequest.id, status)
    toast.success(`Đã cập nhật trạng thái yêu cầu thành ${status.toLowerCase()}.`)
  }

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Yêu cầu duyệt dữ liệu'
          description='Gộp các yêu cầu import thực phẩm từ nguồn ngoài và đề xuất chỉnh sửa catalog.'
        />

        <div className='grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách yêu cầu</CardTitle>
              <CardDescription>
                Admin hoặc nutritionist có thể xem lịch sử request; admin là người chốt duyệt cuối cùng.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 md:grid-cols-[1fr_180px]'>
                <Input
                  placeholder='Tìm theo tên thực phẩm hoặc người tạo...'
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='Chờ duyệt'>Chờ duyệt</SelectItem>
                    <SelectItem value='Đã duyệt'>Đã duyệt</SelectItem>
                    <SelectItem value='Từ chối'>Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='md:hidden space-y-3'>
                {paginatedRequests.map((request) => (
                  <button
                    key={request.id}
                    className='w-full text-left'
                    onClick={() => setSelectedId(request.id)}
                    type='button'
                  >
                    <Card className={request.id === selectedRequest?.id ? 'border-primary/40' : ''}>
                      <CardContent className='space-y-2 p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='font-medium'>{request.foodName}</p>
                          <Badge variant='outline'>{request.status}</Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>{request.requestType}</p>
                        <p className='text-sm text-muted-foreground'>{request.requestedBy}</p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>

              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại yêu cầu</TableHead>
                      <TableHead>Thực phẩm</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Người tạo</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className='cursor-pointer'
                        onClick={() => setSelectedId(request.id)}
                      >
                        <TableCell>{request.requestType}</TableCell>
                        <TableCell className='font-medium'>{request.foodName}</TableCell>
                        <TableCell>{request.source}</TableCell>
                        <TableCell>{request.requestedBy}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>{request.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </CardContent>
          </Card>

          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết yêu cầu</CardTitle>
                <CardDescription>
                  So sánh dữ liệu hiện tại và dữ liệu đề xuất trước khi phê duyệt.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <DetailCard label='Loại yêu cầu' value={selectedRequest.requestType} />
                <DetailCard label='Thực phẩm' value={selectedRequest.foodName} />
                <DetailCard label='Nguồn' value={selectedRequest.source} />
                <DetailCard label='Người tạo' value={selectedRequest.requestedBy} />
                <DetailCard label='Trạng thái' value={selectedRequest.status} />
                <DetailCard label='Cập nhật gần nhất' value={selectedRequest.updatedAt} />
                <div className='rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground'>
                  JSON so sánh chi tiết và ghi chú reviewer sẽ được gắn vào panel này khi nối API.
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Button onClick={() => handleUpdateStatus('Đã duyệt')}>Duyệt</Button>
                  <Button variant='outline' onClick={() => handleUpdateStatus('Từ chối')}>
                    Từ chối
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Main>
    </>
  )
}
