'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
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
import { OtpForm } from './components/otp-form'

function OtpContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Xác thực OTP
          </CardTitle>
          <CardDescription>
            Nhập mã xác thực 6 chữ số đã được gửi đến{' '}
            <strong>{email || 'email của bạn'}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {email ? (
            <OtpForm email={email} />
          ) : (
            <p className='text-sm text-muted-foreground'>
              Không có email để xác thực. Vui lòng{' '}
              <Link
                to='/sign-in'
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                đăng nhập
              </Link>{' '}
              hoặc{' '}
              <Link
                to='/forgot-password'
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                quên mật khẩu
              </Link>
              .
            </p>
          )}
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Đã nhớ mật khẩu?{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

export function Otp() {
  return (
    <Suspense fallback={null}>
      <OtpContent />
    </Suspense>
  )
}
