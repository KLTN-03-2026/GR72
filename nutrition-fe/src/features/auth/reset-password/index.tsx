'use client'

import { Link } from '@/lib/router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ResetPasswordForm } from './components/reset-password-form'

export function ResetPassword() {
  return (
    <AuthLayout>
      <Card className='w-full gap-4 border-border/80 shadow-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription>
            Nhập mật khẩu mới để hoàn tất quá trình khôi phục tài khoản và quay lại đăng nhập.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResetPasswordForm />
        </CardContent>

        <CardFooter>
          <p className='mx-auto px-6 text-center text-sm text-balance text-muted-foreground'>
            Bạn nhớ lại mật khẩu rồi?{' '}
            <Link
              to='/sign-in'
              className='font-medium underline underline-offset-4 hover:text-primary'
            >
              Quay lại đăng nhập
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
