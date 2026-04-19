'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUserReviews, type UserReview } from '@/services/consultation/api'

export function NutritionUserReviews() {
  const [items, setItems] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUserReviews({ page: 1, limit: 50 })
      setItems(response.data.items)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải lịch sử đánh giá')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const average = useMemo(() => {
    if (!items.length) return 0
    return items.reduce((sum, item) => sum + item.diem, 0) / items.length
  }, [items])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Lịch sử đánh giá'
          description='Theo dõi các đánh giá bạn đã gửi cho chuyên gia dinh dưỡng.'
        />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <Card>
            <CardContent className='p-5'>
              <p className='text-xs text-muted-foreground'>Tổng lượt đánh giá</p>
              <p className='mt-2 text-2xl font-semibold'>{items.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-5'>
              <p className='text-xs text-muted-foreground'>Điểm trung bình</p>
              <p className='mt-2 flex items-center gap-2 text-2xl font-semibold'>
                <Star className='size-5 fill-amber-400 text-amber-500' />
                {average ? average.toFixed(1) : '0.0'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách đánh giá</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='h-32 animate-pulse rounded-lg bg-muted/30' />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Chuyên gia</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                        Chưa có đánh giá nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.ma_lich_hen ?? `#${item.booking_id}`}</TableCell>
                        <TableCell>{item.nutritionist?.ho_ten ?? '—'}</TableCell>
                        <TableCell>{item.diem} / 5</TableCell>
                        <TableCell>
                          {item.co_the_chinh_sua ? (
                            <Badge className='bg-blue-100 text-blue-700'>Có thể chỉnh sửa</Badge>
                          ) : (
                            <Badge variant='outline'>Đã khóa chỉnh sửa</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(item.tao_luc).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className='text-right'>
                          <Button asChild size='sm' variant='outline'>
                            <Link href={`/nutrition/bookings/${item.booking_id}/review`}>
                              Xem / sửa
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

