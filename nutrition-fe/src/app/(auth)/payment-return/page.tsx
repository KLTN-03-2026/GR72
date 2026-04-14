'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { AuthLayout } from '@/features/auth/auth-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const paramStatus = searchParams.get('status')
    if (paramStatus === 'success') {
      setStatus('success')
      setMessage('Thanh toán thành công! Đơn đăng ký của bạn đang chờ admin duyệt.')
    } else if (paramStatus === 'failed') {
      setStatus('failed')
      const msg = searchParams.get('message')
      setMessage(msg ? decodeURIComponent(msg) : 'Thanh toán không thành công.')
    } else {
      setStatus('failed')
      setMessage('Thanh toán đang được xử lý. Vui lòng đăng nhập để kiểm tra trạng thái.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <AuthLayout>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center pb-2'>
          <div className='mx-auto mb-4'>
            {status === 'loading' && <Loader2 className='size-14 animate-spin text-primary' />}
            {status === 'success' && <CheckCircle className='size-14 text-emerald-500' />}
            {status === 'failed' && <XCircle className='size-14 text-red-500' />}
          </div>
          <CardTitle className='text-xl'>
            {status === 'loading' && 'Đang kiểm tra kết quả...'}
            {status === 'success' && 'Thanh toán thành công!'}
            {status === 'failed' && 'Thanh toán không thành công'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-center text-sm text-muted-foreground'>{message}</p>

          {status === 'success' && (
            <div className='space-y-3'>
              <p className='text-center text-sm text-muted-foreground'>
                Phí đăng ký đã được thanh toán. Đơn của bạn đang được admin xem xét và sẽ có thông
                báo khi có kết quả.
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
              <Button variant='outline' className='w-full' asChild>
                <Link href='/sign-in'>
                  <LogIn className='size-4 mr-1' />
                  Đăng nhập
                </Link>
              </Button>
              <Button variant='default' className='w-full' asChild>
                <Link href='/sign-up'>
                  Quay lại trang đăng ký
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
