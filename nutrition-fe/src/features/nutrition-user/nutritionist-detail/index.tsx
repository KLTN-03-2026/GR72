'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  Clock3,
  GraduationCap,
  Medal,
  MapPin,
  Star,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { getPublicNutritionist, type NutritionistDetail } from '@/services/consultation/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function splitLines(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const WEEKDAY: Record<string, string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
  sun: 'CN',
}

function isToday(dayKey: string) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[new Date().getDay()] === dayKey
}

// ─── Package card ─────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: NutritionistDetail['goi_tu_van'][0]
  onSelect: () => void
}) {
  return (
    <div className='rounded-xl border p-5 transition hover:border-primary/50 hover:shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <h3 className='font-semibold'>{pkg.ten}</h3>
          <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
            {pkg.mo_ta ?? 'Tư vấn chuyên sâu theo nhu cầu cá nhân.'}
          </p>
        </div>
        <div className='shrink-0 text-right'>
          <p className='text-lg font-bold text-primary'>{formatCurrency(pkg.gia)}</p>
          <p className='text-xs text-muted-foreground'>{pkg.thoi_luong_phut} phút</p>
        </div>
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Star className='size-3 fill-amber-400 text-amber-400' />
          {pkg.so_luot_su_dung} lượt đã sử dụng
        </div>
        <Button size='sm' onClick={onSelect}>
          <CalendarClock className='mr-1.5 size-3.5' />
          Chọn gói này
        </Button>
      </div>
    </div>
  )
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
}: {
  review: NutritionistDetail['danh_gia'][0]
}) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='font-medium'>{review.ho_ten_user}</p>
          <p className='text-xs text-muted-foreground'>
            {new Date(review.tao_luc).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className='flex items-center gap-1'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'size-3',
                i < review.diem ? 'fill-amber-400 text-amber-400' : 'text-muted',
              )}
            />
          ))}
        </div>
      </div>
      {review.noi_dung && (
        <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
          {review.noi_dung}
        </p>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NutritionUserNutritionistDetail({
  nutritionistId,
}: {
  nutritionistId: number
}) {
  const router = useRouter()
  const [data, setData] = useState<NutritionistDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getPublicNutritionist(nutritionistId)
        setData(res.data)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Không tải được profile chuyên gia',
        )
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [nutritionistId])

  const specialties = useMemo(
    () => splitLines(data?.chuyen_mon),
    [data?.chuyen_mon],
  )
  const certificates = useMemo(
    () => splitLines(data?.chung_chi),
    [data?.chung_chi],
  )
  const workingHours = useMemo(() => {
    if (!data?.gio_lam_viec_parsed) return []
    return Object.entries(data.gio_lam_viec_parsed)
      .map(([day, slots]) => ({
        day,
        label: WEEKDAY[day] ?? day,
        slots,
        isToday: isToday(day),
      }))
      .filter((item) => item.slots.length > 0)
  }, [data])

  function handleSelectPackage(pkgId: number) {
    router.push(
      `/nutrition/bookings/new?nutritionistId=${nutritionistId}&packageId=${pkgId}`,
    )
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {/* Back */}
        <Button variant='outline' size='sm' className='w-fit' asChild>
          <Link href='/nutrition/nutritionists'>
            <ChevronLeft className='mr-1 size-4' />
            Danh sách chuyên gia
          </Link>
        </Button>

        {/* Loading skeleton */}
        {loading ? (
          <div className='space-y-4'>
            <div className='flex gap-4'>
              <div className='size-20 rounded-full bg-muted animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-5 w-40 rounded bg-muted animate-pulse' />
                <div className='h-4 w-64 rounded bg-muted animate-pulse' />
                <div className='h-4 w-96 rounded bg-muted animate-pulse' />
              </div>
            </div>
            <div className='grid gap-4 lg:grid-cols-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='h-40 rounded-xl border bg-muted animate-pulse' />
              ))}
            </div>
          </div>
        ) : !data ? (
          <Card className='border-dashed'>
            <CardContent className='py-16 text-center'>
              <p className='text-lg font-medium'>Không tìm thấy chuyên gia</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Hero: Avatar + intro ─────────────────────────────── */}
            <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
              {/* Left: avatar + rating */}
              <div className='flex shrink-0 flex-col items-center gap-3 lg:items-start'>
                <Avatar className='size-24 border-2 border-primary/10 shadow-sm'>
                  <AvatarImage
                    src={data.anh_dai_dien_url ?? undefined}
                    alt={data.ho_ten}
                  />
                  <AvatarFallback className='bg-primary/10 text-xl font-semibold text-primary'>
                    {getInitials(data.ho_ten)}
                  </AvatarFallback>
                </Avatar>
                <div className='flex items-center gap-1'>
                  <Star className='size-4 fill-amber-400 text-amber-400' />
                  <span className='font-semibold'>{data.diem_danh_gia_trung_binh.toFixed(1)}</span>
                  <span className='text-sm text-muted-foreground'>({data.so_luot_danh_gia})</span>
                </div>
              </div>

              {/* Center: name + bio */}
              <div className='flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h1 className='text-2xl font-semibold tracking-tight'>{data.ho_ten}</h1>
                  <Badge variant='default' className='bg-teal-600'>Đã duyệt</Badge>
                </div>

                <p className='mt-1 text-sm text-muted-foreground'>
                  {[data.hoc_vi, data.chuyen_mon].filter(Boolean).join(' · ') ||
                    'Chưa cập nhật chuyên môn'}
                </p>

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {specialties.map((s) => (
                      <Badge key={s} variant='outline' className='text-xs'>
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className='mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground'>
                  {data.mo_ta ?? 'Chưa có mô tả.'}
                </p>

                {/* Quick info pills */}
                <div className='mt-4 flex flex-wrap gap-3'>
                  {data.hoc_vi && (
                    <div className='flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground'>
                      <GraduationCap className='size-3.5 text-primary' />
                      {data.hoc_vi}
                    </div>
                  )}
                  {certificates.length > 0 && (
                    <div className='flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground'>
                      <Medal className='size-3.5 text-primary' />
                      {certificates[0]}
                      {certificates.length > 1 && ` +${certificates.length - 1}`}
                    </div>
                  )}
                  {data.kinh_nghiem && (
                    <div className='flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground'>
                      <BadgeCheck className='size-3.5 text-primary' />
                      {data.kinh_nghiem}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Body: 2 columns ─────────────────────────────────── */}
            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Left: packages (wider) */}
              <div className='lg:col-span-2 space-y-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-base font-semibold'>Gói tư vấn</h2>
                  {data.goi_tu_van.length > 0 && (
                    <span className='text-sm text-muted-foreground'>
                      {data.goi_tu_van.length} gói
                    </span>
                  )}
                </div>

                {data.goi_tu_van.length === 0 ? (
                  <Card className='border-dashed'>
                    <CardContent className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
                      <CalendarClock className='size-8 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        Chuyên gia hiện chưa có gói tư vấn công khai.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className='space-y-3'>
                    {data.goi_tu_van.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        onSelect={() => handleSelectPackage(pkg.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Reviews */}
                <div className='pt-2'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-base font-semibold'>Đánh giá</h2>
                    {data.danh_gia.length > 0 && (
                      <span className='text-sm text-muted-foreground'>
                        {data.danh_gia.length} đánh giá
                      </span>
                    )}
                  </div>

                  {data.danh_gia.length === 0 ? (
                    <Card className='border-dashed'>
                      <CardContent className='py-8 text-center'>
                        <p className='text-sm text-muted-foreground'>
                          Chưa có đánh giá công khai nào.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='mt-3 space-y-2'>
                      {data.danh_gia.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: sidebar info */}
              <div className='space-y-4'>
                {/* Working hours */}
                <Card>
                  <CardContent className='p-5'>
                    <div className='mb-4 flex items-center gap-2'>
                      <Clock3 className='size-4 text-primary' />
                      <h3 className='text-sm font-semibold'>Giờ làm việc</h3>
                    </div>

                    {workingHours.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>
                        Chưa có thông tin giờ làm việc.
                      </p>
                    ) : (
                      <div className='space-y-2'>
                        {workingHours.map((item) => (
                          <div
                            key={item.day}
                            className={cn(
                              'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                              item.isToday && 'border-primary/40 bg-primary/5',
                            )}
                          >
                            <span
                              className={cn(
                                'font-medium',
                                item.isToday && 'text-primary',
                              )}
                            >
                              {item.label}
                              {item.isToday && ' (Hôm nay)'}
                            </span>
                            <div className='flex gap-1'>
                              {item.slots.map((slot, i) => (
                                <Badge key={i} variant='secondary' className='text-xs'>
                                  {slot.start}–{slot.end}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All certificates */}
                {certificates.length > 0 && (
                  <Card>
                    <CardContent className='p-5'>
                      <div className='mb-3 flex items-center gap-2'>
                        <Medal className='size-4 text-primary' />
                        <h3 className='text-sm font-semibold'>Chứng chỉ</h3>
                      </div>
                      <div className='space-y-2'>
                        {certificates.map((cert) => (
                          <div key={cert} className='flex items-start gap-2 text-sm'>
                            <BadgeCheck className='mt-0.5 size-3.5 shrink-0 text-green-600' />
                            <span className='text-muted-foreground'>{cert}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CTA sticky */}
                {data.goi_tu_van.length > 0 && (
                  <Card className='border-primary/20 bg-primary/5'>
                    <CardContent className='p-5'>
                      <p className='text-sm font-medium'>
                        Sẵn sàng bắt đầu?
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Chọn một gói tư vấn phù hợp bên cạnh để đặt lịch ngay.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
