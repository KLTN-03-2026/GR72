'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useNavigate, useRouter } from '@/lib/router'
import { Button } from '@/components/ui/button'

export function UnauthorisedError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const redirect = `${pathname}${search ? `?${search}` : ''}`

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>401</h1>
        <span className='font-medium'>Bạn chưa đăng nhập</span>
        <p className='text-center text-muted-foreground'>
          Vui lòng đăng nhập để tiếp tục truy cập <br /> khu vực này của hệ thống.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Quay lại
          </Button>
          <Button
            onClick={() =>
              navigate({
                to: `/sign-in?redirect=${encodeURIComponent(redirect)}`,
              })
            }
          >
            Đi tới đăng nhập
          </Button>
        </div>
      </div>
    </div>
  )
}
