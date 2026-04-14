'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@/lib/router'
import { toast } from 'sonner'
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
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    maDatLai: z
      .string()
      .min(1, 'Vui lòng nhập mã đặt lại')
      .min(6, 'Mã đặt lại phải có ít nhất 6 ký tự'),
    matKhauMoi: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới')
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    xacNhanMatKhau: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.matKhauMoi === data.xacNhanMatKhau, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['xacNhanMatKhau'],
  })

export function ResetPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maDatLai: '',
      matKhauMoi: '',
      xacNhanMatKhau: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!email) {
      toast.error('Không tìm thấy email. Vui lòng thử lại từ đầu.')
      return
    }

    setIsLoading(true)
    try {
      const { resetPassword } = await import('@/services/auth/api')
      await resetPassword({
        email,
        maDatLai: data.maDatLai.trim(),
        matKhauMoi: data.matKhauMoi,
      })
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
      form.reset()
      navigate({ to: '/sign-in', replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='maDatLai'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mã đặt lại mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='Nhập mã từ email' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='matKhauMoi'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu mới</FormLabel>
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
              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
        </Button>
      </form>
    </Form>
  )
}
