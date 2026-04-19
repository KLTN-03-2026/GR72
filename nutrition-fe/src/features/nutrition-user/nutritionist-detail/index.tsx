'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  Clock3,
  GraduationCap,
  Medal,
  Star,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { getPublicNutritionist, type NutritionistDetail } from '@/services/consultation/api'

type Props = {
  nutritionistId: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function splitInfo(value: string | null | undefined) {
  if (!value) return []

  return value
    .split(/,|;|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const weekdayMap: Record<string, string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
  sun: 'Chủ nhật',
}

export function NutritionUserNutritionistDetail({ nutritionistId }: Props) {
  const router = useRouter()
  const [data, setData] = useState<NutritionistDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const response = await getPublicNutritionist(nutritionistId)
        setData(response.data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể tải profile nutritionist')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [nutritionistId])

  const workingHours = useMemo(() => {
    if (!data?.gio_lam_viec_parsed) return []
    return Object.entries(data.gio_lam_viec_parsed)
      .map(([day, slots]) => ({
        day,
        label: weekdayMap[day] ?? day,
        slots,
      }))
      .filter((item) => item.slots.length > 0)
  }, [data])

  const specialties = useMemo(() => splitInfo(data?.chuyen_mon), [data?.chuyen_mon])
  const certificates = useMemo(() => splitInfo(data?.chung_chi), [data?.chung_chi])
  const packageStats = useMemo(() => {
    if (!data || data.goi_tu_van.length === 0) {
      return {
        minPrice: null,
        maxDuration: null,
      }
    }

    return {
      minPrice: Math.min(...data.goi_tu_van.map((item) => item.gia)),
      maxDuration: Math.max(...data.goi_tu_van.map((item) => item.thoi_luong_phut)),
    }
  }, [data])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href='/nutrition/nutritionists'>
            <ChevronLeft className='mr-1 size-4' />
            Quay lại danh sách
          </Link>
        </Button>

        <PageHeading
          title={loading ? 'Đang tải profile...' : data?.ho_ten ?? 'Không tìm thấy nutritionist'}
          description='Xem chi tiết chuyên môn, giờ làm việc, gói tư vấn và đánh giá trước khi đặt lịch.'
        />

        {loading ? (
          <div className='grid gap-4'>
            <Card className='h-72 animate-pulse bg-muted/30' />
            <Card className='h-52 animate-pulse bg-muted/30' />
            <Card className='h-64 animate-pulse bg-muted/30' />
            <Card className='h-80 animate-pulse bg-muted/30' />
          </div>
        ) : !data ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Không tìm thấy nutritionist</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='space-y-6'>
              <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background'>
                <CardContent className='p-6'>
                  <div className='flex flex-col gap-5 sm:flex-row'>
                    <Avatar className='size-24 border shadow-sm'>
                      <AvatarImage src={data.anh_dai_dien_url ?? undefined} alt={data.ho_ten} />
                      <AvatarFallback>{getInitials(data.ho_ten)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 space-y-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h2 className='text-2xl font-semibold tracking-tight'>{data.ho_ten}</h2>
                        <Badge>Đã duyệt</Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {data.hoc_vi ? `${data.hoc_vi} · ` : ''}
                        {data.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
                      </p>
                      <div className='flex flex-wrap items-center gap-4 text-sm'>
                        <span className='inline-flex items-center gap-1'>
                          <Star className='size-4 fill-amber-400 text-amber-400' />
                          <strong>{data.diem_danh_gia_trung_binh.toFixed(1)}</strong>
                          <span className='text-muted-foreground'>({data.so_luot_danh_gia} đánh giá)</span>
                        </span>
                        {data.chung_chi && (
                          <span className='inline-flex items-center gap-1'>
                            <Medal className='size-4 text-primary' />
                            {data.chung_chi}
                          </span>
                        )}
                      </div>
                      <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
                        {data.mo_ta ?? 'Nutritionist này chưa cập nhật mô tả chi tiết.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Tổng quan nhanh</CardTitle>
                  <CardDescription>
                    Những con số chính giúp bạn đánh giá nhanh khả năng phù hợp và mức độ sẵn sàng nhận lịch.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-3 md:grid-cols-3'>
                  <div className='rounded-lg border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Gói công khai</p>
                    <p className='mt-1 text-xl font-semibold'>{data.goi_tu_van.length}</p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Giá từ</p>
                    <p className='mt-1 text-xl font-semibold'>
                      {packageStats.minPrice ? formatCurrency(packageStats.minPrice) : 'Chưa có'}
                    </p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-4'>
                    <p className='text-xs text-muted-foreground'>Buổi dài nhất</p>
                    <p className='mt-1 text-xl font-semibold'>
                      {packageStats.maxDuration ? `${packageStats.maxDuration} phút` : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Giờ làm việc</CardTitle>
                  <CardDescription>
                    Chỉ có thể đặt lịch trong các khung giờ dưới đây.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {workingHours.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>Chưa có dữ liệu giờ làm việc.</p>
                  ) : (
                    workingHours.map((item) => (
                      <div key={item.day} className='rounded-lg border bg-muted/30 p-4'>
                        <p className='text-sm font-medium'>{item.label}</p>
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {item.slots.map((slot, index) => (
                            <Badge key={`${item.day}-${index}`} variant='secondary'>
                              {slot.start} - {slot.end}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Thông tin chuyên môn</CardTitle>
                  <CardDescription>
                    Những thông tin này giúp bạn đánh giá mức độ phù hợp trước khi chọn gói tư vấn.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 lg:grid-cols-3'>
                  <div className='rounded-lg border bg-muted/20 p-4'>
                    <p className='inline-flex items-center gap-2 text-sm font-medium'>
                      <GraduationCap className='size-4 text-primary' />
                      Học vị
                    </p>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                      {data.hoc_vi ?? 'Chưa cập nhật học vị'}
                    </p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-4'>
                    <p className='inline-flex items-center gap-2 text-sm font-medium'>
                      <BriefcaseBusiness className='size-4 text-primary' />
                      Kinh nghiệm
                    </p>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                      {data.kinh_nghiem ?? 'Chưa cập nhật kinh nghiệm làm việc'}
                    </p>
                  </div>
                  <div className='rounded-lg border bg-muted/20 p-4'>
                    <p className='inline-flex items-center gap-2 text-sm font-medium'>
                      <BadgeCheck className='size-4 text-primary' />
                      Chứng chỉ
                    </p>
                    {certificates.length > 0 ? (
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {certificates.map((certificate) => (
                          <Badge key={certificate} variant='secondary'>
                            {certificate}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                        Chưa cập nhật chứng chỉ công khai
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Gói tư vấn công khai</CardTitle>
                  <CardDescription>
                    Chọn gói phù hợp với mục tiêu và quỹ thời gian của bạn.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-2'>
                  {data.goi_tu_van.length === 0 ? (
                    <div className='md:col-span-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
                      Nutritionist này đang hoạt động nhưng hiện chưa mở gói tư vấn công khai.
                    </div>
                  ) : (
                    data.goi_tu_van.map((pkg) => (
                      <Card key={pkg.id} className='border-primary/10 transition hover:border-primary/40'>
                        <CardHeader>
                          <CardTitle className='text-lg'>{pkg.ten}</CardTitle>
                          <CardDescription>{pkg.mo_ta ?? 'Gói tư vấn chuyên sâu theo nhu cầu cá nhân.'}</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='grid gap-3 rounded-lg border bg-muted/30 px-4 py-3 sm:grid-cols-3'>
                            <div>
                              <p className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                                <Wallet className='size-3.5' />
                                Giá
                              </p>
                              <p className='font-semibold'>{formatCurrency(pkg.gia)}</p>
                            </div>
                            <div>
                              <p className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                                <Clock3 className='size-3.5' />
                                Thời lượng mỗi buổi
                              </p>
                              <p className='font-semibold'>{pkg.thoi_luong_phut} phút</p>
                            </div>
                            <div className='sm:text-right'>
                              <p className='text-xs text-muted-foreground'>Đã sử dụng</p>
                              <p className='font-semibold'>{pkg.so_luot_su_dung} lượt</p>
                            </div>
                          </div>
                          <div className='rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground'>
                            Phù hợp cho một buổi tư vấn tập trung với lộ trình rõ ràng và khuyến nghị thực tế.
                          </div>
                          <Button
                            className='w-full'
                            onClick={() =>
                              router.push(
                                `/nutrition/bookings/new?nutritionistId=${data.id}&packageId=${pkg.id}`,
                              )
                            }
                          >
                            <CalendarClock className='mr-1.5 size-4' />
                            Chọn gói này
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Đánh giá từ người dùng</CardTitle>
                  <CardDescription>
                    Những trải nghiệm gần đây giúp bạn hình dung rõ hơn về cách chuyên gia làm việc.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {specialties.length > 0 && (
                    <div className='rounded-lg border bg-muted/20 p-4'>
                      <p className='text-sm font-medium'>Nhóm chuyên môn nổi bật</p>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {specialties.map((specialty) => (
                          <Badge key={specialty} variant='outline'>
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.danh_gia.length === 0 ? (
                    <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
                      Chưa có đánh giá công khai nào.
                    </div>
                  ) : (
                    data.danh_gia.map((review) => (
                      <div key={review.id} className='rounded-lg border bg-muted/20 p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <div>
                            <p className='font-medium'>{review.ho_ten_user}</p>
                            <p className='text-xs text-muted-foreground'>
                              {new Date(review.tao_luc).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <Badge variant='secondary'>
                            {review.diem} / 5
                          </Badge>
                        </div>
                        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                          {review.noi_dung ?? 'Người dùng không để lại nội dung chi tiết.'}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
