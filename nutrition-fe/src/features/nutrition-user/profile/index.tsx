'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarRange, Dumbbell, Heart, ShieldAlert } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Main } from '@/components/layout/main'
import { NutritionTopbar } from '@/features/nutrition/components/topbar'
import { PageHeading } from '@/features/nutrition/components/page-heading'
import { useNutritionStore } from '@/stores/nutrition-store'

export function NutritionUserProfile() {
  const profile = useNutritionStore((state) => state.profile)
  const updateProfile = useNutritionStore((state) => state.updateProfile)

  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    birthDate: '2002-10-12',
    gender: profile.gender === 'Nam' ? 'male' : profile.gender === 'Khác' ? 'other' : 'female',
    activityLevel:
      profile.activityLevel === 'Năng động'
        ? 'active'
        : profile.activityLevel === 'Vận động nhẹ'
          ? 'light'
          : 'moderate',
    heightCm: String(profile.heightCm),
    currentWeightKg: String(profile.currentWeightKg),
    allergies: profile.allergies.join(', '),
    dietaryPreferences: profile.dietaryPreferences.join(', '),
  })

  function handleSaveProfile() {
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên.')
      return
    }

    if (Number(formData.heightCm) <= 0 || Number(formData.currentWeightKg) <= 0) {
      toast.error('Chiều cao và cân nặng phải lớn hơn 0.')
      return
    }

    updateProfile({
      fullName: formData.fullName.trim(),
      gender:
        formData.gender === 'female'
          ? 'Nữ'
          : formData.gender === 'male'
            ? 'Nam'
            : 'Khác',
      birthDate: new Intl.DateTimeFormat('vi-VN').format(new Date(formData.birthDate)),
      heightCm: Number(formData.heightCm),
      currentWeightKg: Number(formData.currentWeightKg),
      activityLevel:
        formData.activityLevel === 'light'
          ? 'Vận động nhẹ'
          : formData.activityLevel === 'active'
            ? 'Năng động'
            : 'Vận động vừa',
      allergies: formData.allergies.split(',').map((item) => item.trim()).filter(Boolean),
      dietaryPreferences: formData.dietaryPreferences
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    })
    toast.success('Đã lưu hồ sơ sức khỏe.')
  }

  const previewProfile = {
    ...profile,
    fullName: formData.fullName,
    heightCm: Number(formData.heightCm) || 0,
    currentWeightKg: Number(formData.currentWeightKg) || 0,
    birthDate: new Intl.DateTimeFormat('vi-VN').format(new Date(formData.birthDate)),
    activityLevel:
      formData.activityLevel === 'light'
        ? 'Vận động nhẹ'
        : formData.activityLevel === 'active'
          ? 'Năng động'
          : 'Vận động vừa',
    allergies: formData.allergies.split(',').map((item) => item.trim()).filter(Boolean),
    dietaryPreferences: formData.dietaryPreferences
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeading
          title='Hồ sơ sức khỏe'
          description='Thông tin cá nhân và dữ liệu nền được dùng cho đánh giá sức khỏe cũng như tư vấn AI.'
          actions={[{ label: 'Lưu thay đổi' }]}
        />

        <div className='grid gap-6 xl:grid-cols-[1.25fr_0.75fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Các dữ liệu này được dùng để tính BMI, BMR, TDEE và cá nhân hóa tư vấn.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <FieldBlock label='Họ và tên'>
                  <Input
                    value={formData.fullName}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, fullName: event.target.value }))
                    }
                  />
                </FieldBlock>
                <FieldBlock label='Ngày sinh'>
                  <Input
                    value={formData.birthDate}
                    type='date'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, birthDate: event.target.value }))
                    }
                  />
                </FieldBlock>
                <FieldBlock label='Giới tính'>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData((current) => ({ ...current, gender: value }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn giới tính' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='female'>Nữ</SelectItem>
                      <SelectItem value='male'>Nam</SelectItem>
                      <SelectItem value='other'>Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <FieldBlock label='Mức vận động'>
                  <Select
                    value={formData.activityLevel}
                    onValueChange={(value) =>
                      setFormData((current) => ({ ...current, activityLevel: value }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn mức vận động' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='light'>Nhẹ</SelectItem>
                      <SelectItem value='moderate'>Vừa</SelectItem>
                      <SelectItem value='active'>Năng động</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <FieldBlock label='Chiều cao (cm)'>
                  <Input
                    value={formData.heightCm}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, heightCm: event.target.value }))
                    }
                  />
                </FieldBlock>
                <FieldBlock label='Cân nặng hiện tại (kg)'>
                  <Input
                    value={formData.currentWeightKg}
                    type='number'
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        currentWeightKg: event.target.value,
                      }))
                    }
                  />
                </FieldBlock>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FieldBlock label='Dị ứng'>
                  <Textarea
                    value={formData.allergies}
                    rows={4}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, allergies: event.target.value }))
                    }
                  />
                </FieldBlock>
                <FieldBlock label='Thực phẩm ưu tiên và phong cách ăn'>
                  <Textarea
                    value={formData.dietaryPreferences}
                    rows={4}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        dietaryPreferences: event.target.value,
                      }))
                    }
                  />
                </FieldBlock>
              </div>

              <div className='flex flex-wrap gap-3'>
                <Button onClick={handleSaveProfile}>Lưu hồ sơ</Button>
                <Button variant='outline' onClick={() => toast.success('Đã lưu tạm thay đổi.')}>
                  Lưu làm bản nháp
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt hồ sơ</CardTitle>
                <CardDescription>
                  Các dữ liệu quan trọng đang được hệ thống sử dụng.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <InfoRow icon={CalendarRange} label='Ngày sinh' value={previewProfile.birthDate} />
                <InfoRow
                  icon={Heart}
                  label='Chiều cao / cân nặng'
                  value={`${previewProfile.heightCm} cm / ${previewProfile.currentWeightKg} kg`}
                />
                <InfoRow
                  icon={Dumbbell}
                  label='Mức vận động'
                  value={previewProfile.activityLevel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShieldAlert className='size-5 text-primary' />
                  Cảnh báo dinh dưỡng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Dị ứng</p>
                  <div className='flex flex-wrap gap-2'>
                    {previewProfile.allergies.map((item) => (
                      <Badge key={item} variant='destructive'>
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Ưu tiên ăn uống</p>
                  <div className='flex flex-wrap gap-2'>
                    {previewProfile.dietaryPreferences.map((item) => (
                      <Badge key={item} variant='secondary'>
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mức độ hoàn thiện onboarding</CardTitle>
                <CardDescription>
                  Hoàn thiện hồ sơ giúp AI và dashboard chính xác hơn.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <OnboardingCheck label='Thông tin cơ bản' active={Boolean(formData.fullName.trim())} />
                <OnboardingCheck
                  label='Thông tin cơ thể'
                  active={Number(formData.heightCm) > 0 && Number(formData.currentWeightKg) > 0}
                />
                <OnboardingCheck
                  label='Dị ứng và sở thích ăn uống'
                  active={Boolean(formData.allergies.trim() || formData.dietaryPreferences.trim())}
                />
                <OnboardingCheck label='Mức vận động' active />
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

function FieldBlock({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart
  label: string
  value: string
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border p-4'>
      <div className='rounded-full bg-primary/10 p-2 text-primary'>
        <Icon className='size-4' />
      </div>
      <div>
        <p className='text-sm text-muted-foreground'>{label}</p>
        <p className='font-medium'>{value}</p>
      </div>
    </div>
  )
}

function OnboardingCheck({
  label,
  active,
}: {
  label: string
  active: boolean
}) {
  return (
    <div className='flex items-center justify-between rounded-xl border p-3 text-sm'>
      <span>{label}</span>
      <Badge variant={active ? 'secondary' : 'outline'}>
        {active ? 'Hoàn tất' : 'Thiếu dữ liệu'}
      </Badge>
    </div>
  )
}
