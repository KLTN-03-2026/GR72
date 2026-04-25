'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Activity,
  CalendarRange,
  Camera,
  CheckCircle2,
  Circle,
  Dumbbell,
  Heart,
  Mail,
  ShieldAlert,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
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
import {
  getUserProfile,
  uploadUserAvatar,
  updateUserProfile,
  type ProfileApiResponse,
} from '@/services/profile/api'

type GenderValue = 'female' | 'male' | 'other'
type ActivityValue =
  | 'it_van_dong'
  | 'van_dong_nhe'
  | 'van_dong_vua'
  | 'nang_dong'
  | 'rat_nang_dong'

// ============================================
// Helpers
// ============================================
function mapApiGenderToForm(
  api: ProfileApiResponse['gioi_tinh']
): GenderValue {
  if (api === 'nam') return 'male'
  if (api === 'nu') return 'female'
  return 'other'
}

function mapFormGenderToApi(form: GenderValue): 'nam' | 'nu' | 'khac' {
  if (form === 'male') return 'nam'
  if (form === 'female') return 'nu'
  return 'khac'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function mapActivityLabel(api: ActivityValue | null): string {
  if (!api) return '—'
  const map: Record<ActivityValue, string> = {
    it_van_dong: 'Ít vận động',
    van_dong_nhe: 'Vận động nhẹ',
    van_dong_vua: 'Vận động vừa',
    nang_dong: 'Nặng động',
    rat_nang_dong: 'Rất nặng động',
  }
  return map[api] ?? '—'
}

function calcBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null
  return weightKg / (heightCm / 100) ** 2
}

function classifyBmi(bmi: number | null): { label: string; tone: 'green' | 'yellow' | 'red' } {
  if (bmi === null) return { label: '—', tone: 'green' }
  if (bmi < 18.5) return { label: 'Thiếu cân', tone: 'yellow' }
  if (bmi < 25) return { label: 'Bình thường', tone: 'green' }
  if (bmi < 30) return { label: 'Thừa cân', tone: 'yellow' }
  return { label: 'Béo phì', tone: 'red' }
}

type FormData = {
  hoTen: string
  ngaySinh: string
  gender: GenderValue
  mucDoVanDong: ActivityValue
  chieuCaoCm: string
  canNangHienTaiKg: string
  diUng: string
  thucPhamKhongThich: string
  cheDoAnUuTien: string
}

function buildFormData(p: ProfileApiResponse): FormData {
  return {
    hoTen: p.ho_ten,
    ngaySinh: p.ngay_sinh ?? '',
    gender: mapApiGenderToForm(p.gioi_tinh),
    mucDoVanDong: p.muc_do_van_dong ?? 'van_dong_vua',
    chieuCaoCm: p.chieu_cao_cm != null ? String(p.chieu_cao_cm) : '',
    canNangHienTaiKg:
      p.can_nang_hien_tai_kg != null
        ? String(p.can_nang_hien_tai_kg)
        : '',
    diUng: (p.di_ung ?? []).join(', '),
    thucPhamKhongThich: (p.thuc_pham_khong_thich ?? []).join(', '),
    cheDoAnUuTien: (p.che_do_an_uu_tien ?? []).join(', '),
  }
}

// ============================================
// Main Component
// ============================================
export function NutritionUserProfile() {
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  const [profile, setProfile] = useState<ProfileApiResponse | null>(null)
  const [formData, setFormData] = useState<FormData>({
    hoTen: '',
    ngaySinh: '',
    gender: 'female',
    mucDoVanDong: 'van_dong_vua',
    chieuCaoCm: '',
    canNangHienTaiKg: '',
    diUng: '',
    thucPhamKhongThich: '',
    cheDoAnUuTien: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const avatarFileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setProfile(data)
        setFormData(buildFormData(data))
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : 'Không thể tải hồ sơ'
        )
        toast.error('Không thể tải hồ sơ người dùng')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSaveProfile = useCallback(async () => {
    if (!formData.hoTen.trim()) {
      toast.error('Vui lòng nhập họ và tên.')
      return
    }
    if (
      Number(formData.chieuCaoCm) <= 0 ||
      Number(formData.canNangHienTaiKg) <= 0
    ) {
      toast.error('Chiều cao và cân nặng phải lớn hơn 0.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        hoTen: formData.hoTen.trim(),
        gioiTinh: mapFormGenderToApi(formData.gender),
        ngaySinh: formData.ngaySinh || undefined,
        mucDoVanDong: formData.mucDoVanDong,
        chieuCaoCm: Number(formData.chieuCaoCm),
        canNangHienTaiKg: Number(formData.canNangHienTaiKg),
        diUng: formData.diUng
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        thucPhamKhongThich: formData.thucPhamKhongThich
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        cheDoAnUuTien: formData.cheDoAnUuTien
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }

      const updated = await updateUserProfile(payload)
      setProfile(updated)
      setFormData(buildFormData(updated))
      toast.success('Đã lưu hồ sơ sức khỏe.')

      if (isOnboarding) {
        window.location.href = '/nutrition/goals?onboarding=true'
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lưu hồ sơ thất bại'
      )
    } finally {
      setIsSaving(false)
    }
  }, [formData, isOnboarding])

  const handleAvatarFileChange = useCallback(async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh đại diện không được vượt quá 5MB.')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const uploaded = await uploadUserAvatar(file)
      const updated = await updateUserProfile({ anhDaiDienUrl: uploaded.url })
      setProfile((current) =>
        current
          ? {
              ...current,
              anh_dai_dien_url: updated.anh_dai_dien_url,
              cap_nhat_luc: updated.cap_nhat_luc,
            }
          : updated,
      )
      toast.success('Đã cập nhật ảnh đại diện.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải ảnh đại diện')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarFileRef.current) {
        avatarFileRef.current.value = ''
      }
    }
  }, [])

  // Derived preview values
  const weightKg = Number(formData.canNangHienTaiKg) || 0
  const heightCm = Number(formData.chieuCaoCm) || 0
  const bmi = calcBmi(weightKg || null, heightCm || null)
  const bmiClass = classifyBmi(bmi)
  const age =
    formData.ngaySinh
      ? Math.floor(
          (Date.now() - new Date(formData.ngaySinh).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null

  const parsedDiUng = formData.diUng
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const parsedKhongThich = formData.thucPhamKhongThich
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const parsedUuTien = formData.cheDoAnUuTien
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const isBasicOk = Boolean(
    formData.hoTen.trim() && formData.ngaySinh && formData.gender
  )
  const isBodyOk = heightCm > 0 && weightKg > 0
  const isPrefsOk = parsedDiUng.length > 0 || parsedKhongThich.length > 0 || parsedUuTien.length > 0

  // ============================================
  // Loading / Error
  // ============================================
  if (isLoading) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 items-center justify-center'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </Main>
      </>
    )
  }

  if (loadError && !profile) {
    return (
      <>
        <NutritionTopbar />
        <Main className='flex flex-1 items-center justify-center'>
          <Card className='max-w-md'>
            <CardContent className='pt-6 text-center'>
              <p className='text-destructive'>{loadError}</p>
              <Button className='mt-4' onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </Main>
      </>
    )
  }

  return (
    <>
      <NutritionTopbar />
      <Main className='flex flex-1 flex-col gap-6'>
        {isOnboarding && (
          <div className='rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm'>
            Hoàn thành hồ sơ để hệ thống cá nhân hóa tư vấn cho bạn. Sau khi lưu,
            bạn sẽ được chuyển đến bước thiết lập mục tiêu sức khỏe.
          </div>
        )}
        <PageHeading
          title='Hồ sơ sức khỏe'
          description='Thông tin cá nhân và dữ liệu nền dùng cho đánh giá sức khỏe và tư vấn AI.'
          actions={[{ label: 'Lưu thay đổi' }]}
        />

        {/* ============================================
            Header: Avatar + Name + Email + Quick stats
            ============================================ */}
        <Card className='overflow-hidden'>
          <div className='bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6'>
            <div className='flex flex-wrap items-end gap-5'>
              {/* Avatar */}
              <div className='relative shrink-0'>
                {profile?.anh_dai_dien_url ? (
                  <img
                    src={profile.anh_dai_dien_url}
                    alt={formData.hoTen}
                    className='size-24 rounded-full border-4 border-background object-cover shadow-md'
                  />
                ) : (
                  <div className='flex size-24 items-center justify-center rounded-full border-4 border-background bg-muted shadow-md'>
                    <User className='size-10 text-muted-foreground' />
                  </div>
                )}
                <button
                  type='button'
                  className='absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90'
                  title='Đổi ảnh đại diện'
                  disabled={isUploadingAvatar}
                  onClick={() => avatarFileRef.current?.click()}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Camera className='size-3.5' />
                  )}
                </button>
                <input
                  ref={avatarFileRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(event) =>
                    void handleAvatarFileChange(event.target.files?.[0] ?? null)
                  }
                />
              </div>

              {/* Name + email */}
              <div className='min-w-0 flex-1'>
                <h2 className='truncate text-2xl font-bold'>
                  {formData.hoTen || '—'}
                </h2>
                <div className='mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <Mail className='size-3.5' />
                    {profile?.email ?? '—'}
                  </span>
                  {age !== null && (
                    <span>{age} tuổi</span>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className='flex flex-wrap gap-3'>
                <StatPill
                  label='BMI'
                  value={bmi !== null ? bmi.toFixed(1) : '—'}
                  sub={bmiClass.label}
                  tone={bmiClass.tone}
                />
                <StatPill
                  label='Chiều cao'
                  value={heightCm > 0 ? `${heightCm} cm` : '—'}
                />
                <StatPill
                  label='Cân nặng'
                  value={weightKg > 0 ? `${weightKg} kg` : '—'}
                />
                <StatPill
                  label='Mức vận động'
                  value={mapActivityLabel(formData.mucDoVanDong)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ============================================
            Main: Form (left) + Sidebar cards (right)
            ============================================ */}
        <div className='grid gap-6 xl:grid-cols-[1fr_340px]'>
          {/* Form */}
          <div className='space-y-6'>
            {/* Thông tin cá nhân */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FieldBlock label='Họ và tên'>
                    <Input
                      value={formData.hoTen}
                      onChange={(e) =>
                        setFormData((c) => ({ ...c, hoTen: e.target.value }))
                      }
                    />
                  </FieldBlock>
                  <FieldBlock label='Ngày sinh'>
                    <Input
                      value={formData.ngaySinh}
                      type='date'
                      onChange={(e) =>
                        setFormData((c) => ({ ...c, ngaySinh: e.target.value }))
                      }
                    />
                  </FieldBlock>
                  <FieldBlock label='Giới tính'>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) =>
                        setFormData((c) => ({
                          ...c,
                          gender: v as GenderValue,
                        }))
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
                      value={formData.mucDoVanDong}
                      onValueChange={(v) =>
                        setFormData((c) => ({
                          ...c,
                          mucDoVanDong: v as ActivityValue,
                        }))
                      }
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Chọn mức vận động' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='it_van_dong'>Ít vận động</SelectItem>
                        <SelectItem value='van_dong_nhe'>Vận động nhẹ</SelectItem>
                        <SelectItem value='van_dong_vua'>Vận động vừa</SelectItem>
                        <SelectItem value='nang_dong'>Nặng động</SelectItem>
                        <SelectItem value='rat_nang_dong'>Rất nặng động</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldBlock>
                </div>
              </CardContent>
            </Card>

            {/* Chỉ số cơ thể */}
            <Card>
              <CardHeader>
                <CardTitle>Chỉ số cơ thể</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FieldBlock label='Chiều cao (cm)'>
                    <Input
                      value={formData.chieuCaoCm}
                      type='number'
                      step='0.1'
                      min='1'
                      placeholder='VD: 165'
                      onChange={(e) =>
                        setFormData((c) => ({
                          ...c,
                          chieuCaoCm: e.target.value,
                        }))
                      }
                    />
                  </FieldBlock>
                  <FieldBlock label='Cân nặng hiện tại (kg)'>
                    <Input
                      value={formData.canNangHienTaiKg}
                      type='number'
                      step='0.1'
                      min='1'
                      placeholder='VD: 60'
                      onChange={(e) =>
                        setFormData((c) => ({
                          ...c,
                          canNangHienTaiKg: e.target.value,
                        }))
                      }
                    />
                  </FieldBlock>
                </div>
                {bmi !== null && (
                  <div className='flex items-center gap-3 rounded-lg border bg-muted/40 p-3'>
                    <Activity className='size-4 shrink-0 text-muted-foreground' />
                    <span className='text-sm'>
                      BMI hiện tại của bạn là{' '}
                      <strong>{bmi.toFixed(1)}</strong> —{' '}
                      <span
                        className={
                          bmiClass.tone === 'green'
                            ? 'text-green-600'
                            : bmiClass.tone === 'yellow'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }
                      >
                        {bmiClass.label}
                      </span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chế độ ăn & ràng buộc */}
            <Card>
              <CardHeader>
                <CardTitle>Chế độ ăn &amp; ràng buộc dinh dưỡng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FieldBlock label='Dị ứng thực phẩm'>
                  <Textarea
                    value={formData.diUng}
                    rows={3}
                    placeholder='VD: Tôm, cua, gluten, đậu phộng...'
                    onChange={(e) =>
                      setFormData((c) => ({ ...c, diUng: e.target.value }))
                    }
                  />
                  <p className='text-xs text-muted-foreground'>
                    Nhập danh sách cách nhau bằng dấu phẩy. Hệ thống sẽ cảnh báo khi lên
                    thực đơn.
                  </p>
                </FieldBlock>
                <FieldBlock label='Thực phẩm không thích'>
                  <Textarea
                    value={formData.thucPhamKhongThich}
                    rows={3}
                    placeholder='VD: Rau bina, nấm, cá mòi...'
                    onChange={(e) =>
                      setFormData((c) => ({
                        ...c,
                        thucPhamKhongThich: e.target.value,
                      }))
                    }
                  />
                  <p className='text-xs text-muted-foreground'>
                    Thực phẩm bạn không muốn ăn dù không dị ứng.
                  </p>
                </FieldBlock>
                <FieldBlock label='Chế độ ăn ưu tiên / phong cách ăn'>
                  <Textarea
                    value={formData.cheDoAnUuTien}
                    rows={3}
                    placeholder='VD: Ăn chay, Keto, giảm đường, ăn low-carb...'
                    onChange={(e) =>
                      setFormData((c) => ({
                        ...c,
                        cheDoAnUuTien: e.target.value,
                      }))
                    }
                  />
                </FieldBlock>
              </CardContent>
            </Card>

            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving && <Loader2 className='mr-2 size-4 animate-spin' />}
              {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </Button>
          </div>

          {/* Right sidebar */}
          <div className='space-y-5'>
            {/* Onboarding progress */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Tiến độ hoàn thiện</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <OnboardingCheck label='Thông tin cá nhân' active={isBasicOk} />
                <OnboardingCheck label='Chỉ số cơ thể' active={isBodyOk} />
                <OnboardingCheck
                  label='Ràng buộc dinh dưỡng'
                  active={isPrefsOk}
                />
                <OnboardingCheck
                  label='Mức vận động'
                  active={Boolean(formData.mucDoVanDong)}
                />
              </CardContent>
            </Card>

            {/* Warning cards */}
            {(parsedDiUng.length > 0 || parsedKhongThich.length > 0) && (
              <Card className='border-amber-200 bg-amber-50 dark:bg-amber-950/30'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <ShieldAlert className='size-4 text-amber-600' />
                    Ràng buộc dinh dưỡng
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {parsedDiUng.length > 0 && (
                    <div>
                      <p className='mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400'>
                        Dị ứng
                      </p>
                      <div className='flex flex-wrap gap-1.5'>
                        {parsedDiUng.map((item) => (
                          <Badge key={item} variant='destructive' className='text-xs'>
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsedKhongThich.length > 0 && (
                    <div>
                      <p className='mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400'>
                        Không thích
                      </p>
                      <div className='flex flex-wrap gap-1.5'>
                        {parsedKhongThich.map((item) => (
                          <Badge
                            key={item}
                            variant='outline'
                            className='border-amber-300 text-xs text-amber-700 dark:text-amber-400'
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            {parsedUuTien.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Chế độ ăn ưu tiên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {parsedUuTien.map((item) => (
                      <Badge key={item} variant='secondary'>
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Tóm tắt hồ sơ</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2.5'>
                <SummaryItem
                  icon={CalendarRange}
                  label='Ngày sinh'
                  value={formatDate(formData.ngaySinh)}
                />
                <SummaryItem
                  icon={Heart}
                  label='Giới tính'
                  value={
                    formData.gender === 'female'
                      ? 'Nữ'
                      : formData.gender === 'male'
                        ? 'Nam'
                        : 'Khác'
                  }
                />
                <SummaryItem
                  icon={Dumbbell}
                  label='Mức vận động'
                  value={mapActivityLabel(formData.mucDoVanDong)}
                />
                {profile?.cap_nhat_luc && (
                  <SummaryItem
                    icon={Activity}
                    label='Cập nhật lần cuối'
                    value={formatDateTime(profile.cap_nhat_luc)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

// ============================================
// Sub-components
// ============================================
function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart
  label: string
  value: string
}) {
  return (
    <div className='flex items-center gap-2.5 text-sm'>
      <Icon className='size-3.5 shrink-0 text-muted-foreground' />
      <span className='w-28 shrink-0 text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value}</span>
    </div>
  )
}

function StatPill({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'green' | 'yellow' | 'red'
}) {
  return (
    <div className='rounded-lg border bg-background/80 px-3 py-2 text-center backdrop-blur-sm'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold ${
          tone === 'green'
            ? 'text-green-600'
            : tone === 'yellow'
              ? 'text-yellow-600'
              : tone === 'red'
                ? 'text-red-600'
                : ''
        }`}
      >
        {value}
      </p>
      {sub && <p className='text-xs text-muted-foreground'>{sub}</p>}
    </div>
  )
}

function OnboardingCheck({ label, active }: { label: string; active: boolean }) {
  return (
    <div className='flex items-center gap-2.5 text-sm'>
      {active ? (
        <CheckCircle2 className='size-4 shrink-0 text-green-600' />
      ) : (
        <Circle className='size-4 shrink-0 text-muted-foreground' />
      )}
      <span className={active ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  )
}
