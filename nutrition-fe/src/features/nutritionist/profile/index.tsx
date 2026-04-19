'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Calendar, BookOpen, Star } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import {
  getNutriProfile,
  updateNutriProfile,
  type NProfile,
} from '@/services/nutritionist/api'

const WEEKDAY_LABELS: Record<string, string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
  sun: 'Chủ nhật',
}

const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

type WorkingHoursSlot = {
  start: string
  end: string
}

type WorkingDayState = {
  enabled: boolean
  start: string
  end: string
}

type WorkingScheduleState = Record<string, WorkingDayState>

const DEFAULT_WORKING_SCHEDULE: WorkingScheduleState = {
  mon: { enabled: false, start: '08:00', end: '17:00' },
  tue: { enabled: false, start: '08:00', end: '17:00' },
  wed: { enabled: false, start: '08:00', end: '17:00' },
  thu: { enabled: false, start: '08:00', end: '17:00' },
  fri: { enabled: false, start: '08:00', end: '17:00' },
  sat: { enabled: false, start: '08:00', end: '12:00' },
  sun: { enabled: false, start: '08:00', end: '12:00' },
}

function mapProfileToFormData(data: NProfile) {
  return {
    anhDaiDienUrl: data.anhDaiDienUrl ?? '',
    moTa: data.moTa ?? '',
    chuyenMon: data.chuyenMon ?? '',
  }
}

function normalizeSpecialties(value: string) {
  return Array.from(
    new Map(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item] as const),
    ).values()
  )
}

function validateAvatarUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Avatar phải là URL http hoặc https hợp lệ.'
    }
    return null
  } catch {
    return 'Avatar phải là URL hợp lệ.'
  }
}

function parseWorkingHoursToSchedule(value: string | null | undefined): WorkingScheduleState {
  const initial = { ...DEFAULT_WORKING_SCHEDULE }

  if (!value) return initial

  try {
    const parsed = JSON.parse(value) as Record<string, WorkingHoursSlot[]>

    for (const day of Object.keys(initial)) {
      const firstSlot = parsed?.[day]?.[0]
      if (!firstSlot) continue

      initial[day] = {
        enabled: true,
        start: firstSlot.start,
        end: firstSlot.end,
      }
    }
  } catch {
    return initial
  }

  return initial
}

function validateWorkingSchedule(schedule: WorkingScheduleState) {
  for (const [day, config] of Object.entries(schedule)) {
    if (!config.enabled) continue

    if (!(day in WEEKDAY_LABELS)) {
      return `Ngày làm việc không hợp lệ: ${day}.`
    }

    if (!TIME_SLOT_PATTERN.test(config.start) || !TIME_SLOT_PATTERN.test(config.end)) {
      return `Giờ làm việc của ${WEEKDAY_LABELS[day]} phải dùng định dạng HH:mm.`
    }

    if (config.start >= config.end) {
      return `Giờ bắt đầu của ${WEEKDAY_LABELS[day]} phải nhỏ hơn giờ kết thúc.`
    }
  }

  return null
}

function serializeWorkingSchedule(schedule: WorkingScheduleState) {
  const payload = Object.entries(schedule).reduce<Record<string, WorkingHoursSlot[]>>((acc, [day, config]) => {
    if (!config.enabled) return acc

    acc[day] = [
      {
        start: config.start,
        end: config.end,
      },
    ]
    return acc
  }, {})

  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
}

function summarizeWorkingSchedule(schedule: WorkingScheduleState) {
  return Object.entries(schedule)
    .filter(([, config]) => config.enabled)
    .map(([day, config]) => ({
      day,
      label: WEEKDAY_LABELS[day] ?? day,
      slots: [`${config.start}-${config.end}`],
    }))
}

export function NutritionistProfile() {
  const [profile, setProfile] = useState<NProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    anhDaiDienUrl: '',
    moTa: '',
    chuyenMon: '',
  })
  const [workingSchedule, setWorkingSchedule] = useState<WorkingScheduleState>(DEFAULT_WORKING_SCHEDULE)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const data = await getNutriProfile()
      setProfile(data)
      setFormData(mapProfileToFormData(data))
      setWorkingSchedule(parseWorkingHoursToSchedule(data.gioLamViec))
    } catch (error) {
      toast.error('Không thể tải profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!formData.moTa.trim()) {
      toast.error('Vui lòng nhập mô tả chuyên môn.')
      return
    }

    const avatarError = validateAvatarUrl(formData.anhDaiDienUrl)
    if (avatarError) {
      toast.error(avatarError)
      return
    }

    const workingHoursError = validateWorkingSchedule(workingSchedule)
    if (workingHoursError) {
      toast.error(workingHoursError)
      return
    }

    setSaving(true)
    try {
      const data = await updateNutriProfile({
        anhDaiDienUrl: formData.anhDaiDienUrl || undefined,
        moTa: formData.moTa.trim() || undefined,
        chuyenMon: normalizeSpecialties(formData.chuyenMon).join(', ') || undefined,
        gioLamViec: serializeWorkingSchedule(workingSchedule),
      })
      setProfile(data)
      setFormData(mapProfileToFormData(data))
      setWorkingSchedule(parseWorkingHoursToSchedule(data.gioLamViec))
      toast.success('Đã lưu profile chuyên môn.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <NutritionTopbar staff />
        <Main className='flex items-center justify-center h-[50vh]'>
          <div className='size-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        </Main>
      </>
    )
  }

  if (!profile) return null

  const specialtyTags = normalizeSpecialties(formData.chuyenMon)
  const workingHoursSummary = summarizeWorkingSchedule(workingSchedule)
  const avatarPreviewUrl = formData.anhDaiDienUrl.trim() || profile.anhDaiDienUrl || ''

  return (
    <>
      <NutritionTopbar staff />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Profile chuyên môn'
          description='Thông tin hiển thị công khai cho người dùng.'
          actions={[
            {
              label: saving ? 'Đang lưu...' : 'Lưu thay đổi',
              disabled: saving,
              onClick: handleSave,
            },
          ]}
        />

        <div className='grid gap-6 xl:grid-cols-[1.5fr_1fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Thông tin này sẽ hiển thị trên trang profile công khai của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <div className='size-20 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                    {avatarPreviewUrl ? (
                      <Image
                        src={avatarPreviewUrl}
                        alt='Avatar'
                        fill
                        sizes='80px'
                        unoptimized
                        className='object-cover'
                      />
                    ) : (
                      <BookOpen className='size-8 text-muted-foreground' />
                    )}
                  </div>
                </div>
                <div className='flex-1 space-y-2'>
                  <p className='font-medium'>{profile.hoTen}</p>
                  <p className='text-sm text-muted-foreground'>{profile.vaiTro}</p>
                  <div className='space-y-2'>
                    <Label>Avatar URL</Label>
                    <Input
                      value={formData.anhDaiDienUrl}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, anhDaiDienUrl: e.target.value }))
                      }
                      placeholder='https://example.com/avatar.jpg'
                    />
                  </div>
                </div>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Mô tả chuyên môn</Label>
                  <Textarea
                    value={formData.moTa}
                    onChange={(e) => setFormData((f) => ({ ...f, moTa: e.target.value }))}
                    rows={4}
                    placeholder='Mô tả về kinh nghiệm, chuyên môn của bạn...'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Chuyên môn</Label>
                  <Input
                    value={formData.chuyenMon}
                    onChange={(e) => setFormData((f) => ({ ...f, chuyenMon: e.target.value }))}
                    placeholder='Ví dụ: Giảm cân, Tăng cơ, Dinh dưỡng thể thao'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Nhập nhiều chuyên môn bằng dấu phẩy hoặc xuống dòng. Hệ thống sẽ tự chuẩn hóa khi lưu.
                  </p>
                  {specialtyTags.length > 0 && (
                    <div className='flex flex-wrap gap-2 pt-1'>
                      {specialtyTags.map((item) => (
                        <Badge key={item} variant='outline'>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <Label>Giờ làm việc</Label>
                  <div className='space-y-3 rounded-sm border bg-muted/20 p-4'>
                    {Object.entries(WEEKDAY_LABELS).map(([dayKey, label]) => {
                      const config = workingSchedule[dayKey]

                      return (
                        <div
                          key={dayKey}
                          className='grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-[1.2fr_1fr_1fr]'
                        >
                          <label className='flex items-center gap-3 text-sm font-medium'>
                            <input
                              type='checkbox'
                              checked={config.enabled}
                              onChange={(event) =>
                                setWorkingSchedule((current) => ({
                                  ...current,
                                  [dayKey]: {
                                    ...current[dayKey],
                                    enabled: event.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>{label}</span>
                          </label>
                          <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>Bắt đầu</Label>
                            <Input
                              type='time'
                              value={config.start}
                              disabled={!config.enabled}
                              onChange={(event) =>
                                setWorkingSchedule((current) => ({
                                  ...current,
                                  [dayKey]: {
                                    ...current[dayKey],
                                    start: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>Kết thúc</Label>
                            <Input
                              type='time'
                              value={config.end}
                              disabled={!config.enabled}
                              onChange={(event) =>
                                setWorkingSchedule((current) => ({
                                  ...current,
                                  [dayKey]: {
                                    ...current[dayKey],
                                    end: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Chỉ cần chọn ngày làm việc và khung giờ. Hệ thống sẽ tự chuyển về định dạng dữ liệu chuẩn khi lưu.
                  </p>
                  {workingHoursSummary.length > 0 && (
                    <div className='rounded-sm border bg-muted/20 p-3'>
                      <p className='text-xs font-medium text-muted-foreground'>
                        Xem nhanh lịch làm việc
                      </p>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {workingHoursSummary.map((item) => (
                          <Badge key={item.day} variant='secondary'>
                            {item.label}: {item.slots.join(', ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-3 rounded-lg border p-3'>
                  <div className='rounded-full bg-yellow-100 p-2 text-yellow-600'>
                    <Star className='size-4' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Đánh giá trung bình</p>
                    <p className='font-medium'>{profile.diemDanhGiaTrungBinh.toFixed(1)} ({profile.soLuotDanhGia} đánh giá)</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 rounded-lg border p-3'>
                  <div className='rounded-full bg-blue-100 p-2 text-blue-600'>
                    <Calendar className='size-4' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Booking đã hoàn thành</p>
                    <p className='font-medium'>{profile.tongBooking} cuộc hẹn</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trạng thái tài khoản</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Trạng thái</span>
                  <Badge variant={profile.trangThai === 'hoat_dong' ? 'default' : 'secondary'}>
                    {profile.trangThai === 'hoat_dong' ? 'Hoạt động' : profile.trangThai}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Vai trò</span>
                  <span className='text-sm font-medium'>{profile.vaiTro}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lịch sử cập nhật</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm'>
                  <p className='text-muted-foreground'>Tạo lúc</p>
                  <p>{new Date(profile.taoLuc).toLocaleString('vi-VN')}</p>
                </div>
                <div className='text-sm'>
                  <p className='text-muted-foreground'>Cập nhật cuối</p>
                  <p>{new Date(profile.capNhatLuc).toLocaleString('vi-VN')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
