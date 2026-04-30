'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { AuthShell, FieldError, StatusMessage } from '@/components/auth/auth-shell'
import { forgotPassword } from '@/lib/auth-api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Email không hợp lệ.'
    setErrors(nextErrors)
    setStatus(null)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      await forgotPassword({ email })
      sessionStorage.setItem('password_reset_email', email.trim().toLowerCase())
      setStatus({ type: 'success', message: 'Nếu email tồn tại, mã OTP đã được gửi.' })
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể gửi OTP.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Khôi phục tài khoản'
      title='Lấy lại quyền truy cập tài khoản.'
      description='Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác minh để bạn đặt lại mật khẩu an toàn.'
      footer={
        <Link className='font-semibold text-[#2563EB] hover:text-blue-700' href='/login'>
          Quay lại đăng nhập
        </Link>
      }
    >
      <form className='space-y-5' onSubmit={onSubmit}>
        <div>
          <h2 className='text-2xl font-semibold text-slate-950'>Quên mật khẩu</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Chúng tôi sẽ kiểm tra tài khoản và gửi hướng dẫn khôi phục qua email.
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
            placeholder='email đã đăng ký'
          />
          <FieldError>{errors.email}</FieldError>
        </label>
        <button
          type='submit'
          disabled={loading}
          className='w-full cursor-pointer rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
        >
          {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
        </button>
      </form>
    </AuthShell>
  )
}
