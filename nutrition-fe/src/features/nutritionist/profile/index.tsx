'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Camera, Star, Calendar, BookOpen } from 'lucide-react'
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
      setFormData({
        anhDaiDienUrl: data.anhDaiDienUrl ?? '',
        moTa: data.moTa ?? '',
        chuyenMon: data.chuyenMon ?? '',
        gioLamViec: data.gioLamViec ?? '',
      })
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

    setSaving(true)
    try {
      const data = await updateNutriProfile({
        anhDaiDienUrl: formData.anhDaiDienUrl || undefined,
        moTa: formData.moTa.trim() || undefined,
        chuyenMon: formData.chuyenMon.trim() || undefined,
        gioLamViec: formData.gioLamViec.trim() || undefined,
      })
      setProfile(data)
      toast.success('Đã lưu profile chuyên môn.')
    } catch (error) {
      toast.error('Không thể lưu profile')
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
                    {profile.anhDaiDienUrl ? (
                      <img
                        src={profile.anhDaiDienUrl}
                        alt='Avatar'
                        className='size-full object-cover'
                      />
                    ) : (
                      <BookOpen className='size-8 text-muted-foreground' />
                    )}
                  </div>
                  <Button
                    size='icon'
                    variant='outline'
                    className='absolute bottom-0 right-0 size-8 rounded-full'
                  >
                    <Camera className='size-3' />
                  </Button>
                </div>
                <div>
                  <p className='font-medium'>{profile.hoTen}</p>
                  <p className='text-sm text-muted-foreground'>{profile.vaiTro}</p>
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
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <Label>Giờ làm việc</Label>
                  <Textarea
                    value={formData.gioLamViec}
                    onChange={(e) => setFormData((f) => ({ ...f, gioLamViec: e.target.value }))}
                    rows={3}
                    placeholder='JSON: {"mon":[{"start":"08:00","end":"12:00"}],"tue":[{"start":"14:00","end":"18:00"}]}'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Định dạng JSON với các ngày trong tuần: mon, tue, wed, thu, fri, sat, sun
                  </p>
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
                  <p>{new Date(profile.taLuc).toLocaleString('vi-VN')}</p>
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
