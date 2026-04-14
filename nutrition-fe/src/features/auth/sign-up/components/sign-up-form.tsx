'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

// ====== Shared base schema ======
const baseSchema = z
  .object({
    hoTen: z
      .string()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(150, 'Họ tên không được quá 150 ký tự'),
    email: z.email({
      error: (iss) =>
        iss.input === '' ? 'Vui lòng nhập email' : undefined,
    }),
    matKhau: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    xacNhanMatKhau: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.matKhau === data.xacNhanMatKhau, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['xacNhanMatKhau'],
  })

// ====== User schema ======
const userFormSchema = baseSchema

// ====== Nutritionist schema ======
const nutritionistFormSchema = baseSchema.extend({
  chuyenMon: z
    .string()
    .min(1, 'Vui lòng nhập chuyên môn')
    .max(500, 'Chuyên môn không quá 500 ký tự'),
  moTa: z.string().optional(),
  kinhNghiem: z.string().optional(),
  hocVi: z.string().max(100).optional(),
  chungChi: z.string().max(255).optional(),
  gioLamViec: z.string().max(255).optional(),
  anhDaiDienUrl: z.string().url('Avatar URL không hợp lệ').optional().or(z.literal('')),
})

export type UserFormValues = z.infer<typeof userFormSchema>
export type NutritionistFormValues = z.infer<typeof nutritionistFormSchema>

type AccountType = 'nguoi_dung' | 'chuyen_gia_dinh_duong' | null

// ====== Role selection ======
export function RoleSelector({
  value,
  onChange,
}: {
  value: AccountType
  onChange: (v: AccountType) => void
}) {
  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium'>Bạn muốn đăng ký với vai trò nào?</p>
      <div className='grid gap-3'>
        <button
          type='button'
          onClick={() => onChange('nguoi_dung')}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            value === 'nguoi_dung'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card',
          )}
        >
          <div
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
              value === 'nguoi_dung' ? 'border-primary' : 'border-muted-foreground',
            )}
          >
            {value === 'nguoi_dung' && (
              <div className='h-2.5 w-2.5 rounded-full bg-primary' />
            )}
          </div>
          <div>
            <p className='font-medium'>Tôi muốn sử dụng app</p>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              Theo dõi dinh dưỡng, sức khỏe, nhận tư vấn từ AI và đặt lịch tư vấn với chuyên gia.
            </p>
          </div>
        </button>

        <button
          type='button'
          onClick={() => onChange('chuyen_gia_dinh_duong')}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            value === 'chuyen_gia_dinh_duong'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card',
          )}
        >
          <div
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
              value === 'chuyen_gia_dinh_duong' ? 'border-primary' : 'border-muted-foreground',
            )}
          >
            {value === 'chuyen_gia_dinh_duong' && (
              <div className='h-2.5 w-2.5 rounded-full bg-primary' />
            )}
          </div>
          <div>
            <p className='font-medium'>Tôi muốn cung cấp dịch vụ tư vấn dinh dưỡng</p>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              Tạo hồ sơ chuyên gia, nhận booking từ người dùng, viết bài và tạo thực đơn mẫu.
              Phí đăng ký <strong>500.000đ</strong>.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ====== User form ======
export function UserSignUpForm({
  className,
  onComplete,
}: React.HTMLAttributes<HTMLFormElement> & {
  onComplete?: (email: string) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      hoTen: '',
      email: '',
      matKhau: '',
      xacNhanMatKhau: '',
    },
  })

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)
    try {
      const { register } = await import('@/services/auth/api')
      await register({
        vaiTro: 'nguoi_dung',
        hoTen: data.hoTen.trim(),
        email: data.email.trim().toLowerCase(),
        matKhau: data.matKhau,
      })
      onComplete?.(data.email)
    } catch (err: unknown) {
      if (err instanceof Error) {
        form.setError('email', { type: 'server', message: err.message })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
      >
        <FormField
          control={form.control}
          name='hoTen'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <FormControl>
                <Input placeholder='Nguyễn Văn A' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='matKhau'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='xacNhanMatKhau'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
          {isLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
        </Button>
      </form>
    </Form>
  )
}

// ====== Nutritionist form ======
export function NutritionistSignUpForm({
  className,
  onComplete,
}: React.HTMLAttributes<HTMLFormElement> & {
  onComplete?: (email: string) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<NutritionistFormValues>({
    resolver: zodResolver(nutritionistFormSchema),
    defaultValues: {
      hoTen: '',
      email: '',
      matKhau: '',
      xacNhanMatKhau: '',
      chuyenMon: '',
      moTa: '',
      kinhNghiem: '',
      hocVi: '',
      chungChi: '',
      gioLamViec: 'T2-T6: 8:00-17:00',
      anhDaiDienUrl: '',
    },
  })

  async function onSubmit(data: NutritionistFormValues) {
    setIsLoading(true)
    try {
      const { register } = await import('@/services/auth/api')
      const result = await register({
        vaiTro: 'chuyen_gia_dinh_duong',
        hoTen: data.hoTen.trim(),
        email: data.email.trim().toLowerCase(),
        matKhau: data.matKhau,
        chuyenMon: data.chuyenMon.trim(),
        moTa: data.moTa?.trim() || undefined,
        kinhNghiem: data.kinhNghiem?.trim() || undefined,
        hocVi: data.hocVi?.trim() || undefined,
        chungChi: data.chungChi?.trim() || undefined,
        gioLamViec: data.gioLamViec?.trim() || undefined,
        anhDaiDienUrl: data.anhDaiDienUrl?.trim() || undefined,
      })
      if (result.payment_url) {
        window.location.href = result.payment_url
        return
      } else {
        onComplete?.(data.email)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        form.setError('email', { type: 'server', message: err.message })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
      >
        {/* Basic info */}
        <div className='space-y-1.5'>
          <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
            Thông tin tài khoản
          </p>
        </div>

        <FormField
          control={form.control}
          name='hoTen'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <FormControl>
                <Input placeholder='Nguyễn Văn B' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='matKhau'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='xacNhanMatKhau'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Professional info */}
        <div className='!mt-4 space-y-1.5'>
          <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
            Thông tin chuyên môn
          </p>
        </div>

        <FormField
          control={form.control}
          name='chuyenMon'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Chuyên môn <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='VD: Dinh dưỡng lâm sàng, Giảm cân, Dinh dưỡng thể thao'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='moTa'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả chuyên môn</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Giới thiệu ngắn về chuyên môn, phương pháp tư vấn...'
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='kinhNghiem'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kinh nghiệm</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Mô tả kinh nghiệm làm việc, các dự án đã tham gia...'
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='hocVi'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Học vị / Bằng cấp</FormLabel>
                <FormControl>
                  <Input placeholder='VD: Thạc sĩ Dinh dưỡng' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='chungChi'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chứng chỉ</FormLabel>
                <FormControl>
                  <Input
                    placeholder='VD: Chứng chỉ Dinh dưỡng lâm sàng'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name='gioLamViec'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giờ làm việc</FormLabel>
              <FormControl>
                <Input placeholder='VD: T2-T6: 8:00-17:00, T7: 8:00-12:00' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='anhDaiDienUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Ảnh đại diện</FormLabel>
              <FormControl>
                <Input
                  placeholder='https://example.com/avatar.jpg'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700'>
          Phí đăng ký <strong>500.000đ</strong>. Sau khi đăng ký, bạn sẽ được chuyển
          đến trang thanh toán VNPay. Đơn sẽ được xử lý sau khi thanh toán thành công.
        </div>

        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
          {isLoading ? 'Đang xử lý...' : 'Đăng ký & Thanh toán'}
        </Button>
      </form>
    </Form>
  )
}
