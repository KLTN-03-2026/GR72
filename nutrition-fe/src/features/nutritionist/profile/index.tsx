'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AlertCircle, Calendar, BookOpen, Star } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

function mapProfileToFormData(data: NProfile) {
  return {
    anhDaiDienUrl: data.anhDaiDienUrl ?? '',
    moTa: data.moTa ?? '',
    chuyenMon: data.chuyenMon ?? '',
    gioLamViec: formatWorkingHoursForEditor(data.gioLamViec),
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

function formatWorkingHoursForEditor(value: string | null | undefined) {
  if (!value) return ''

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
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

function validateWorkingHours(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return 'Giờ làm việc phải là JSON hợp lệ.'
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return 'Giờ làm việc phải là object JSON, ví dụ {"mon":[{"start":"08:00","end":"12:00"}]}.'
  }

  for (const [day, slots] of Object.entries(parsed as Record<string, unknown>)) {
    if (!(day in WEEKDAY_LABELS)) {
      return `Ngày làm việc không hợp lệ: ${day}.`
    }

    if (!Array.isArray(slots)) {
      return `Danh sách ca làm của ${day} phải là mảng.`
    }

    for (const [index, slot] of slots.entries()) {
      if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
        return `Ca làm ${index + 1} của ${day} phải có dạng { "start": "08:00", "end": "12:00" }.`
      }

      const start = typeof (slot as Record<string, unknown>).start === 'string'
        ? (slot as Record<string, unknown>).start.trim()
        : ''
      const end = typeof (slot as Record<string, unknown>).end === 'string'
        ? (slot as Record<string, unknown>).end.trim()
        : ''

      if (!TIME_SLOT_PATTERN.test(start) || !TIME_SLOT_PATTERN.test(end)) {
        return `Ca làm ${index + 1} của ${day} phải dùng định dạng HH:mm.`
      }

      if (start >= end) {
        return `Ca làm ${index + 1} của ${day} phải có giờ bắt đầu nhỏ hơn giờ kết thúc.`
      }
    }
  }

  return null
}

function parseWorkingHoursSummary(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as Record<string, WorkingHoursSlot[]>
    return Object.entries(parsed)
      .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
      .map(([day, slots]) => ({
        day,
        label: WEEKDAY_LABELS[day] ?? day,
        slots: slots.map((slot) => `${slot.start}-${slot.end}`),
      }))
  } catch {
    return []
  }
}

export function NutritionistProfile() {
  const [profile, setProfile] = useState<NProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    anhDaiDienUrl: '',
    moTa: '',
    chuyenMon: '',
    gioLamViec: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const data = await getNutriProfile()
      setProfile(data)
      setFormData(mapProfileToFormData(data))
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

    const workingHoursError = validateWorkingHours(formData.gioLamViec)
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
        gioLamViec: formData.gioLamViec.trim() || undefined,
      })
      setProfile(data)
      setFormData(mapProfileToFormData(data))
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
  const workingHoursSummary = parseWorkingHoursSummary(formData.gioLamViec)
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
                  <Textarea
                    value={formData.gioLamViec}
                    onChange={(e) => setFormData((f) => ({ ...f, gioLamViec: e.target.value }))}
                    rows={8}
                    className='font-mono text-xs'
                    placeholder={`{\n  "mon": [{ "start": "08:00", "end": "12:00" }],\n  "wed": [{ "start": "13:30", "end": "17:30" }]\n}`}
                  />
                  <Alert>
                    <AlertCircle className='size-4' />
                    <AlertTitle>Định dạng giờ làm việc</AlertTitle>
                    <AlertDescription>
                      Dùng JSON theo các key `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`.
                      Mỗi ca làm gồm `start` và `end` dạng `HH:mm`, và giờ bắt đầu phải nhỏ hơn giờ kết thúc.
                    </AlertDescription>
                  </Alert>
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
