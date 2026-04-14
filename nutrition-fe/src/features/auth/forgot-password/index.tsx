'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [sentEmail, setSentEmail] = useState('')

  function handleSuccess(email: string) {
    setSentEmail(email)
    setStep('success')
  }

  if (step === 'success') {
    return (
      <AuthLayout>
        <Card className='gap-4'>
          <CardHeader>
            <CardTitle className='text-lg tracking-tight'>
              Kiểm tra email của bạn
            </CardTitle>
            <CardDescription>
              Chúng tôi đã gửi mã đặt lại mật khẩu đến{' '}
              <strong>{sentEmail}</strong>.
              <br />
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
              <button
                onClick={() => setStep('form')}
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                thử lại
              </button>
              .
            </p>
          </CardContent>
          <CardFooter>
            <p className='mx-auto px-8 text-center text-sm text-muted-foreground'>
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

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Quên mật khẩu
          </CardTitle>
          <CardDescription>
            Nhập email đã đăng ký và chúng tôi sẽ gửi mã đặt lại mật khẩu cho bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm onSuccess={handleSuccess} />
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-muted-foreground'>
            Chưa có tài khoản?{' '}
            <Link
              to='/sign-up'
              className='underline underline-offset-4 hover:text-primary'
            >
              Đăng ký
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
