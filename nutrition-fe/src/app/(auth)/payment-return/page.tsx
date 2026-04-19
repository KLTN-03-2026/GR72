'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, LogIn } from 'lucide-react'
import Link from 'next/link'
import { AuthLayout } from '@/features/auth/auth-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const paramStatus = searchParams.get('status')
  const rawMessage = searchParams.get('message')

  const status: 'success' | 'failed' =
    paramStatus === 'success' ? 'success' : 'failed'

  const message =
    rawMessage
      ? decodeURIComponent(rawMessage)
      : status === 'success'
        ? 'Thanh toán thành công. Tài khoản của bạn hiện vẫn ở trạng thái chưa hoạt động cho đến khi admin duyệt đơn.'
        : 'Thanh toán không thành công. Hồ sơ đăng ký đã được hoàn tác.'

  return (
    <AuthLayout>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center pb-2'>
          <div className='mx-auto mb-4'>
            {status === 'success' && <CheckCircle className='size-14 text-emerald-500' />}
            {status === 'failed' && <XCircle className='size-14 text-red-500' />}
          </div>
          <CardTitle className='text-xl'>
            {status === 'success' && 'Thanh toán thành công!'}
            {status === 'failed' && 'Thanh toán không thành công'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-center text-sm text-muted-foreground'>{message}</p>

          {status === 'success' && (
            <div className='space-y-3'>
              <p className='text-center text-sm text-muted-foreground'>
                Phí đăng ký đã được thanh toán. Đơn của bạn đang được admin xem xét. Sau khi được
                duyệt, tài khoản sẽ được kích hoạt và bạn có thể đăng nhập vào khu vực Nutritionist.
              </p>
              <Button variant='default' className='w-full' asChild>
                <Link href='/sign-in'>
                  <LogIn className='size-4 mr-1' />
                  Đăng nhập để kiểm tra trạng thái
                </Link>
              </Button>
            </div>
          )}

          {status === 'failed' && (
            <div className='space-y-3'>
              <Button variant='default' className='w-full' asChild>
                <Link href='/sign-up'>
                  Quay lại đăng ký
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
