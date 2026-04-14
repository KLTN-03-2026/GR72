'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from '@/lib/router'
import { ApiError } from '@/services/auth/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import {
  RoleSelector,
  UserSignUpForm,
  NutritionistSignUpForm,
  type UserFormValues,
  type NutritionistFormValues,
} from './components/sign-up-form'

type AccountType = 'nguoi_dung' | 'chuyen_gia_dinh_duong' | null

export function SignUp() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState<AccountType>(null)

  function handleUserComplete(email: string) {
    toast.success(`Tạo tài khoản thành công! Vui lòng đăng nhập với email ${email}.`)
    navigate({ to: '/sign-in', replace: true })
  }

  function handleNutritionistComplete(email: string) {
    toast.success(`Đăng ký thành công! Vui lòng thanh toán phí đăng ký để hoàn tất.`)
    navigate({ to: '/sign-in', replace: true })
  }

  function handleRoleChange(type: AccountType) {
    setAccountType(type)
  }

  return (
    <AuthLayout>
      <Card className='w-full gap-4 border-border/80 shadow-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Tạo tài khoản mới
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Nhập thông tin để tạo tài khoản mới. Đã có tài khoản?{' '}
            <a
              href='/sign-in'
              className='font-medium underline underline-offset-4 hover:text-primary'
            >
              Đăng nhập
            </a>
          </p>
        </CardHeader>

        <CardContent className='space-y-5'>
          {/* Step 1: Chọn loại tài khoản */}
          {accountType === null && (
            <RoleSelector value={null} onChange={handleRoleChange} />
          )}

          {/* Step 2: User form */}
          {accountType === 'nguoi_dung' && (
            <div className='space-y-4'>
              <button
                type='button'
                onClick={() => setAccountType(null)}
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                ← Quay lại và chọn loại tài khoản khác
              </button>
              <UserSignUpForm onComplete={handleUserComplete} />
            </div>
          )}

          {/* Step 2: Nutritionist form */}
          {accountType === 'chuyen_gia_dinh_duong' && (
            <div className='space-y-4'>
              <button
                type='button'
                onClick={() => setAccountType(null)}
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                ← Quay lại và chọn loại tài khoản khác
              </button>
              <NutritionistSignUpForm onComplete={handleNutritionistComplete} />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
