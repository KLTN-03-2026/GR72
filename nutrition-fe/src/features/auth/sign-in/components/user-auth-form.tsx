'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@/lib/router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import {
  getStaffPortalRoleForUserRole,
  resolvePostLoginPath,
} from '@/lib/auth'
import { ApiError, login } from '@/services/auth/api'
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '@/stores/portal-store'
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

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Vui lòng nhập email' : undefined),
  }),
  matKhau: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(7, 'Mật khẩu phải có ít nhất 7 ký tự'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const setStaffRole = usePortalStore((state) => state.setStaffRole)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      matKhau: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const loginPromise = login(data)
      .then((user) => {
        auth.setUser(user)
        auth.setHydrated(true)
        setStaffRole(getStaffPortalRoleForUserRole(user.vai_tro))

        const targetPath = resolvePostLoginPath(user.vai_tro, redirectTo)

        navigate({ to: targetPath, replace: true })

        return user
      })
      .finally(() => {
        setIsLoading(false)
      })

    toast.promise(loginPromise, {
      loading: 'Đang đăng nhập...',
      success: (user) => {
        return `Chào mừng quay lại, ${user.ho_ten || user.email}!`
      },
      error: (error) =>
        error instanceof ApiError ? error.message : 'Đăng nhập thất bại',
    })
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
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='ban@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='matKhau'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Quên mật khẩu?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Đăng nhập
        </Button>
        <p className='text-center text-sm text-muted-foreground'>
          Chưa có tài khoản?{' '}
          <Link
            to='/sign-up'
            className='font-medium underline underline-offset-4 hover:text-primary'
          >
            Tạo tài khoản mới
          </Link>
        </p>
      </form>
    </Form>
  )
}
