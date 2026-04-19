'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock3, Search, Sparkles, Star, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { getPublicNutritionists, type PublicNutritionist } from '@/services/consultation/api'

function formatCurrency(amount: number | null) {
  if (amount === null) return 'Chưa có gói mở bán'
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

export function NutritionUserNutritionists() {
  const [items, setItems] = useState<PublicNutritionist[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const loadData = useCallback(async (targetPage = page) => {
    setLoading(true)
    try {
      const response = await getPublicNutritionists({
        page: targetPage,
        limit: 9,
        search: search.trim() || undefined,
        chuyenMon: specialty.trim() || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      })
      setItems(response.data.items)
      const total = response.data.pagination.total
      setTotalPages(Math.max(1, Math.ceil(total / response.data.pagination.limit)))
      setPage(response.data.pagination.page)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách nutritionist')
    } finally {
      setLoading(false)
    }
  }, [maxPrice, minPrice, page, search, specialty])

  useEffect(() => {
    void loadData(1)
  }, [loadData])

  const featured = useMemo(() => items.slice(0, 3), [items])

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Nutritionist'
          description='Khám phá chuyên gia phù hợp với mục tiêu sức khỏe, phong cách ăn uống và lịch sinh hoạt của bạn.'
        />

        <Card className='border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background'>
          <CardContent className='grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr] lg:items-center'>
            <div>
              <p className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
                <Sparkles className='size-3.5' />
                Gợi ý nhanh
              </p>
              <h2 className='mt-3 text-2xl font-semibold tracking-tight'>
                Chọn đúng chuyên gia ngay từ đầu sẽ giúp buổi tư vấn hiệu quả hơn.
              </h2>
              <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
                Ưu tiên tìm theo chuyên môn và mức giá phù hợp trước, sau đó xem profile chi tiết để đối chiếu giờ làm việc, gói tư vấn và đánh giá thực tế từ người dùng khác.
              </p>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-lg border bg-background/70 p-4 backdrop-blur'>
                <p className='text-xs text-muted-foreground'>Chuyên gia hiển thị</p>
                <p className='mt-1 text-2xl font-semibold'>{loading ? '—' : items.length}</p>
              </div>
              <div className='rounded-lg border bg-background/70 p-4 backdrop-blur'>
                <p className='text-xs text-muted-foreground'>Có thể đặt lịch ngay</p>
                <p className='mt-1 text-2xl font-semibold'>
                  {loading ? '—' : items.filter((item) => item.co_the_dat_lich).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-4'>
            <CardTitle className='text-base'>Bộ lọc</CardTitle>
            <CardDescription>
              Tìm theo tên, chuyên môn và khoảng giá để rút ngắn thời gian chọn nutritionist.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-2 xl:grid-cols-5'>
            <div className='relative xl:col-span-2'>
              <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className='pl-9'
                placeholder='Tìm theo tên hoặc từ khóa chuyên môn...'
              />
            </div>
            <Input
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              placeholder='Ví dụ: giảm cân, tiểu đường'
            />
            <Input
              type='number'
              min='0'
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder='Giá từ'
            />
            <div className='flex gap-2'>
              <Input
                type='number'
                min='0'
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder='Giá đến'
              />
              <Button
                onClick={() => void loadData(1)}
                disabled={loading}
                className='shrink-0'
              >
                Lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {featured.length > 0 && (
          <div className='grid gap-4 xl:grid-cols-3'>
            {featured.map((nutritionist) => (
              <Card key={`featured-${nutritionist.id}`} className='border-primary/20 bg-gradient-to-br from-background to-primary/5'>
                <CardContent className='p-5'>
                  <div className='flex items-start gap-4'>
                    <Avatar className='size-14 border'>
                      <AvatarImage src={nutritionist.anh_dai_dien_url ?? undefined} alt={nutritionist.ho_ten} />
                      <AvatarFallback>{getInitials(nutritionist.ho_ten)}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate font-semibold'>{nutritionist.ho_ten}</p>
                        <Badge variant='secondary'>Nổi bật</Badge>
                      </div>
                      <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                        {nutritionist.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
                      </p>
                      <div className='mt-3 flex items-center gap-2 text-sm'>
                        <Star className='size-4 fill-amber-400 text-amber-400' />
                        <span className='font-medium'>
                          {nutritionist.diem_danh_gia_trung_binh.toFixed(1)}
                        </span>
                        <span className='text-muted-foreground'>
                          ({nutritionist.so_luot_danh_gia} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className='h-72 animate-pulse bg-muted/30' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Chưa tìm thấy nutritionist phù hợp</p>
              <p className='mt-2 text-sm text-muted-foreground'>
                Hãy thử nới khoảng giá hoặc dùng từ khóa chuyên môn ngắn hơn.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {items.map((nutritionist) => (
              <Card key={nutritionist.id} className='group h-full transition hover:border-primary/40 hover:shadow-sm'>
                <CardHeader>
                  <div className='flex items-start gap-4'>
                    <Avatar className='size-14 border'>
                      <AvatarImage src={nutritionist.anh_dai_dien_url ?? undefined} alt={nutritionist.ho_ten} />
                      <AvatarFallback>{getInitials(nutritionist.ho_ten)}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <CardTitle className='truncate text-lg'>{nutritionist.ho_ten}</CardTitle>
                      <CardDescription className='mt-1 line-clamp-2'>
                        {nutritionist.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <p className='line-clamp-3 text-sm text-muted-foreground'>
                    {nutritionist.mo_ta ?? 'Nutritionist này chưa cập nhật mô tả chi tiết.'}
                  </p>

                  <div className='grid gap-3 rounded-lg border bg-muted/30 px-4 py-3 sm:grid-cols-2'>
                    <div>
                      <p className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                        <Wallet className='size-3.5' />
                        Giá bắt đầu
                      </p>
                      <p className='mt-1 font-semibold'>{formatCurrency(nutritionist.gia_bat_dau)}</p>
                    </div>
                    <div className='sm:text-right'>
                      <p className='text-xs text-muted-foreground'>Đánh giá</p>
                      <p className='mt-1 font-semibold'>
                        {nutritionist.diem_danh_gia_trung_binh.toFixed(1)} / 5
                      </p>
                    </div>
                  </div>

                  <div className='grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2'>
                    <div>
                      <p className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock3 className='size-3.5' />
                        Khả năng đặt lịch
                      </p>
                      <p className='mt-1 text-sm font-medium'>
                        {nutritionist.co_the_dat_lich ? 'Có thể đặt ngay' : 'Chưa sẵn sàng nhận lịch'}
                      </p>
                    </div>
                    <div className='sm:text-right'>
                      <p className='text-xs text-muted-foreground'>Gói đang bán</p>
                      <p className='mt-1 text-sm font-medium'>{nutritionist.so_goi_dang_ban} gói công khai</p>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <Badge variant={nutritionist.co_the_dat_lich ? 'default' : 'secondary'}>
                      {nutritionist.co_the_dat_lich ? 'Sẵn sàng nhận lịch' : 'Chưa có gói mở bán'}
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {nutritionist.so_goi_dang_ban} gói
                    </span>
                  </div>

                  <Button asChild className='w-full'>
                    <Link href={`/nutrition/nutritionists/${nutritionist.id}`}>
                      Xem profile & đặt lịch
                    </Link>
                  </Button>
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
