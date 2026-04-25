'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, ChevronRight, MapPin, Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PaginationControls } from '@/features/nutrition/components/pagination-controls'
import { getPublicNutritionists, type PublicNutritionist } from '@/services/consultation/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number | null) {
  if (amount === null) return 'Liên hệ'
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
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ─── Filter chips ────────────────────────────────────────────────────────────

const SPECIALTY_PRESETS = [
  'Giảm cân',
  'Tiểu đường',
  'Tăng cơ',
  'Tim mạch',
  'Mẹ & Bé',
  'Ăn chay',
  'Thể thao',
]

// ─── Nutritionist Card (compact) ──────────────────────────────────────────────

function NutritionistCard({
  item,
  index,
}: {
  item: PublicNutritionist
  index: number
}) {
  return (
    <Link
      href={`/nutrition/nutritionists/${item.id}`}
      className='group block'
    >
      <Card className={cn(
        'h-full overflow-hidden transition-all duration-200',
        'hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
      )}>
        {/* Top accent bar */}
        <div className='h-1 bg-gradient-to-r from-primary/60 to-primary/20 group-hover:from-primary group-hover:to-primary/40' />

        <CardContent className='p-5'>
          {/* Avatar + Name row */}
          <div className='flex items-start gap-3'>
            <Avatar className='size-12 shrink-0 border-2 border-primary/10'>
              <AvatarImage
                src={item.anh_dai_dien_url ?? undefined}
                alt={item.ho_ten}
              />
              <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
                {getInitials(item.ho_ten)}
              </AvatarFallback>
            </Avatar>

            <div className='min-w-0 flex-1'>
              <p className='truncate font-semibold group-hover:text-primary'>
                {item.ho_ten}
              </p>
              <p className='line-clamp-1 text-xs text-muted-foreground'>
                {item.chuyen_mon ?? 'Chưa cập nhật chuyên môn'}
              </p>
            </div>

            {/* Booking status badge */}
            <Badge
              variant={item.co_the_dat_lich ? 'default' : 'secondary'}
              className={cn(
                'shrink-0 text-[10px]',
                item.co_the_dat_lich && 'bg-teal-600',
              )}
            >
              {item.co_the_dat_lich ? 'Nhận lịch' : 'Tạm đóng'}
            </Badge>
          </div>

          {/* Description */}
          <p className='mt-3 line-clamp-2 text-sm text-muted-foreground'>
            {item.mo_ta ?? 'Chưa có mô tả.'}
          </p>

          {/* Bottom row */}
          <div className='mt-4 flex items-center justify-between'>
            {/* Rating */}
            <div className='flex items-center gap-1'>
              <Star className='size-3.5 fill-amber-400 text-amber-400' />
              <span className='text-sm font-semibold'>
                {item.diem_danh_gia_trung_binh.toFixed(1)}
              </span>
              <span className='text-xs text-muted-foreground'>
                ({item.so_luot_danh_gia})
              </span>
            </div>

            {/* Price */}
            <div className='text-right'>
              <p className='text-xs text-muted-foreground'>Từ</p>
              <p className='text-sm font-bold text-primary'>
                {formatCurrency(item.gia_bat_dau)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-3 flex items-center justify-between border-t pt-3'>
            <span className='text-xs text-muted-foreground'>
              {item.so_goi_dang_ban > 0
                ? `${item.so_goi_dang_ban} gói tư vấn`
                : 'Chưa có gói'}
            </span>
            <span className='flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100'>
              Xem profile
              <ChevronRight className='size-3' />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className='h-full overflow-hidden'>
      <div className='h-1 bg-muted animate-pulse' />
      <CardContent className='p-5'>
        <div className='flex items-start gap-3'>
          <div className='size-12 rounded-full bg-muted animate-pulse' />
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-32 rounded bg-muted animate-pulse' />
            <div className='h-3 w-24 rounded bg-muted animate-pulse' />
          </div>
        </div>
        <div className='mt-3 space-y-1.5'>
          <div className='h-3 w-full rounded bg-muted animate-pulse' />
          <div className='h-3 w-3/4 rounded bg-muted animate-pulse' />
        </div>
        <div className='mt-4 flex items-center justify-between'>
          <div className='h-4 w-20 rounded bg-muted animate-pulse' />
          <div className='h-4 w-16 rounded bg-muted animate-pulse' />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center gap-4 py-16 text-center'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
          <Search className='size-6 text-muted-foreground' />
        </div>
        <div>
          <p className='text-base font-semibold'>Không tìm thấy chuyên gia</p>
          <p className='mt-1 max-w-xs text-sm text-muted-foreground'>
            Không có kết quả phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.
          </p>
        </div>
        <Button variant='outline' onClick={onClear}>
          Xóa bộ lọc
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NutritionUserNutritionists() {
  const [items, setItems] = useState<PublicNutritionist[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(
    async (targetPage = 1, searchTerm = debouncedSearch, specialty = activeSpecialty) => {
      setLoading(true)
      try {
        const response = await getPublicNutritionists({
          page: targetPage,
          limit: 9,
          search: searchTerm || undefined,
          chuyenMon: specialty || undefined,
        })
        setItems(response.data.items)
        const total = response.data.pagination.total
        setTotalPages(Math.max(1, Math.ceil(total / response.data.pagination.limit)))
        setPage(response.data.pagination.page)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Không thể tải danh sách chuyên gia',
        )
      } finally {
        setLoading(false)
      }
    },
    [activeSpecialty, debouncedSearch],
  )

  // Debounce search input
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 400)
  }

  useEffect(() => {
    void loadData(1, debouncedSearch, activeSpecialty)
  }, [debouncedSearch, activeSpecialty, loadData])

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
    void loadData(nextPage, debouncedSearch, activeSpecialty)
  }

  function handleSpecialtyClick(specialty: string) {
    setActiveSpecialty((prev) => (prev === specialty ? '' : specialty))
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setActiveSpecialty('')
  }

  const hasFilters = search || activeSpecialty
  const totalCount = items.length

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Heading */}
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Chuyên gia dinh dưỡng
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Tìm chuyên gia phù hợp với mục tiêu sức khỏe và lịch sinh hoạt của bạn.
          </p>
        </div>

        {/* Search bar */}
        <div className='relative'>
          <Search className='absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder='Tìm theo tên hoặc chuyên môn...'
            className='pl-10 pr-10 text-sm'
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              ✕
            </button>
          )}
        </div>

        {/* Specialty chips */}
        <div className='flex flex-wrap gap-2'>
          {SPECIALTY_PRESETS.map((specialty) => (
            <button
              key={specialty}
              onClick={() => handleSpecialtyClick(specialty)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                activeSpecialty === specialty
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {specialty}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className='rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className='text-sm text-muted-foreground'>
            {totalCount > 0
              ? `Tìm thấy ${totalCount} chuyên gia`
              : 'Không có kết quả nào'}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 9 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {items.map((item, i) => (
              <NutritionistCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Main>
    </>
  )
}
