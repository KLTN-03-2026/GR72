'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { AuthShell, FieldError, StatusMessage } from '@/components/auth/auth-shell'
import { resetPassword } from '@/lib/auth-api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const emailFromQuery = searchParams.get('email')
    const emailFromSession = sessionStorage.getItem('password_reset_email')
    setEmail(emailFromQuery || emailFromSession || '')
  }, [searchParams])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Email không hợp lệ.'
    if (password.length < 8) nextErrors.password = 'Mật khẩu mới tối thiểu 8 ký tự.'
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Xác nhận mật khẩu không khớp.'
    setErrors(nextErrors)
    setStatus(null)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      await resetPassword({
        email,
        matKhauMoi: password,
        xacNhanMatKhau: confirmPassword,
      })
      sessionStorage.removeItem('password_reset_email')
      setStatus({ type: 'success', message: 'Đặt lại mật khẩu thành công.' })
      router.push('/login')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Mật khẩu mới'
      title='Tạo mật khẩu mới cho tài khoản của bạn.'
      description='Chọn mật khẩu dễ nhớ với bạn nhưng đủ mạnh để bảo vệ thông tin sức khỏe cá nhân.'
      footer={
        <Link className='font-semibold text-[#2563EB] hover:text-blue-700' href='/login'>
          Về trang đăng nhập
        </Link>
      }
    >
      <form className='space-y-5' onSubmit={onSubmit}>
        <div>
          <h2 className='text-2xl font-semibold text-slate-950'>Đặt lại mật khẩu</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Sau khi cập nhật, bạn có thể đăng nhập lại và tiếp tục sử dụng dịch vụ.
          </p>
        </div>
        {status ? <StatusMessage {...status} /> : null}
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className='mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
            type='email'
            autoComplete='email'
          />
          <FieldError>{errors.email}</FieldError>
        </label>
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Mật khẩu mới</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className='mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
            type='password'
            autoComplete='new-password'
          />
          <FieldError>{errors.password}</FieldError>
        </label>
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Xác nhận mật khẩu</span>
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className='mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
            type='password'
            autoComplete='new-password'
          />
          <FieldError>{errors.confirmPassword}</FieldError>
        </label>
        <button
          type='submit'
          disabled={loading}
          className='w-full cursor-pointer rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
        >
          {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
