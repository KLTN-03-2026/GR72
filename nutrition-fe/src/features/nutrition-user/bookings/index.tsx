'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, CreditCard, MessageSquare, SearchX } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { getUserBookings, type UserBooking } from '@/services/consultation/api'

function getStatusBadge(status: string) {
  switch (status) {
    case 'cho_thanh_toan':
      return <Badge variant='outline'>Chờ thanh toán</Badge>
    case 'da_xac_nhan':
      return <Badge className='bg-blue-100 text-blue-700'>Đã xác nhận</Badge>
    case 'da_checkin':
      return <Badge className='bg-purple-100 text-purple-700'>Đã check-in</Badge>
    case 'dang_tu_van':
      return <Badge className='bg-yellow-100 text-yellow-700'>Đang tư vấn</Badge>
    case 'hoan_thanh':
      return <Badge className='bg-emerald-100 text-emerald-700'>Hoàn thành</Badge>
    case 'da_huy':
      return <Badge className='bg-red-100 text-red-700'>Đã hủy</Badge>
    case 'vo_hieu_hoa':
      return <Badge variant='secondary'>Vô hiệu hóa</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function NutritionUserBookings() {
  const [items, setItems] = useState<UserBooking[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (targetPage = page, targetStatus = statusFilter) => {
    setLoading(true)
    try {
      const response = await getUserBookings({
        page: targetPage,
        limit: 10,
        trangThai: targetStatus || undefined,
      })
      setItems(response.data.items)
      const total = response.data.pagination.total
      setTotalPages(Math.max(1, Math.ceil(total / response.data.pagination.limit)))
      setPage(response.data.pagination.page)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách booking')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    void loadData(1)
  }, [loadData])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Booking của tôi'
          description='Theo dõi toàn bộ lịch tư vấn, trạng thái thanh toán và các bước xử lý tiếp theo.'
        />

        <Card>
          <CardHeader className='pb-4'>
            <CardTitle className='text-base'>Bộ lọc trạng thái</CardTitle>
            <CardDescription>
              Giữ lại những booking cần xử lý trước, đặc biệt là các booking đang chờ thanh toán.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-3'>
            <Select
              value={statusFilter || 'all'}
              onValueChange={(value) => {
                const nextStatus = value === 'all' ? '' : value
                setStatusFilter(nextStatus)
                void loadData(1, nextStatus)
              }}
            >
              <SelectTrigger className='w-56'>
                <SelectValue placeholder='Tất cả trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='cho_thanh_toan'>Chờ thanh toán</SelectItem>
                <SelectItem value='da_xac_nhan'>Đã xác nhận</SelectItem>
                <SelectItem value='da_checkin'>Đã check-in</SelectItem>
                <SelectItem value='dang_tu_van'>Đang tư vấn</SelectItem>
                <SelectItem value='hoan_thanh'>Hoàn thành</SelectItem>
                <SelectItem value='da_huy'>Đã hủy</SelectItem>
                <SelectItem value='vo_hieu_hoa'>Vô hiệu hóa</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' asChild>
              <Link href='/nutrition/payments'>Lịch sử thanh toán</Link>
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className='grid gap-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className='h-36 animate-pulse bg-muted/30' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <SearchX className='mx-auto size-8 text-muted-foreground/40' />
              <p className='mt-4 text-lg font-medium'>Chưa có booking nào phù hợp</p>
              <p className='mt-2 text-sm text-muted-foreground'>
                Hãy bắt đầu từ danh sách nutritionist để tạo lịch tư vấn đầu tiên.
              </p>
              <Button asChild className='mt-4'>
                <Link href='/nutrition/nutritionists'>Khám phá nutritionist</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4'>
            {items.map((booking) => (
              <Card key={booking.id} className='transition hover:border-primary/30'>
                <CardContent className='flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-semibold'>{booking.ma_lich_hen}</p>
                      {getStatusBadge(booking.trang_thai)}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {booking.nutritionist?.ho_ten ?? 'Nutritionist'} · {booking.goi_tu_van?.ten ?? 'Gói tư vấn'}
                    </p>
                    <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                      <span>{new Date(booking.ngay_hen).toLocaleDateString('vi-VN')}</span>
                      <span>
                        {booking.gio_bat_dau.slice(0, 5)} - {booking.gio_ket_thuc.slice(0, 5)}
                      </span>
                      {booking.goi_tu_van && <span>{formatCurrency(booking.goi_tu_van.gia)}</span>}
                    </div>
                    {booking.trang_thai === 'cho_thanh_toan' && booking.co_the_tiep_tuc_thanh_toan && (
                      <p className='inline-flex items-center gap-2 text-sm text-amber-600'>
                        <CreditCard className='size-4' />
                        Còn {booking.so_phut_con_lai} phút để tiếp tục thanh toán
                      </p>
                    )}
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button variant='outline' asChild>
                      <Link href={`/nutrition/bookings/${booking.id}`}>
                        <CalendarClock className='mr-1.5 size-4' />
                        Xem chi tiết
                      </Link>
                    </Button>
                    <Button variant='outline' asChild>
                      <Link href={`/nutrition/bookings/${booking.id}/chat`}>
                        <MessageSquare className='mr-1.5 size-4' />
                        Vào chat
                      </Link>
                    </Button>
                    {booking.trang_thai === 'cho_thanh_toan' && (
                      <Button asChild>
                        <Link href={`/nutrition/bookings/${booking.id}/payment`}>
                          Tiếp tục thanh toán
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PaginationControls page={page} totalPages={totalPages} onPageChange={(nextPage) => void loadData(nextPage)} />
      </Main>
    </>
  )
}
