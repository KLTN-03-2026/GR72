import { Suspense } from 'react'
import { ResetPassword } from '@/features/auth/reset-password'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  )
}
