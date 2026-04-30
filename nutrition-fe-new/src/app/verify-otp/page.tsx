'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { AuthShell, FieldError, StatusMessage } from '@/components/auth/auth-shell'
import { verifyOtp } from '@/lib/auth-api'

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
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
    if (!/^\d{6}$/.test(otp)) nextErrors.otp = 'OTP phải gồm đúng 6 chữ số.'
    setErrors(nextErrors)
    setStatus(null)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      await verifyOtp({ email, otp })
      sessionStorage.setItem('password_reset_email', email.trim().toLowerCase())
      setStatus({ type: 'success', message: 'Xác minh OTP thành công.' })
      router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'OTP không hợp lệ.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Xác minh OTP'
      title='Xác nhận đây là tài khoản của bạn.'
      description='Nhập mã xác minh vừa được gửi đến email để tiếp tục đặt lại mật khẩu.'
      footer={
        <>
          Chưa nhận được mã?{' '}
          <Link className='font-semibold text-[#2563EB] hover:text-blue-700' href='/forgot-password'>
            Gửi lại OTP
          </Link>
        </>
      }
    >
      <form className='space-y-5' onSubmit={onSubmit}>
        <div>
          <h2 className='text-2xl font-semibold text-slate-950'>Xác minh OTP</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Mã xác minh chỉ có hiệu lực trong thời gian ngắn để bảo vệ tài khoản của bạn.
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
          <span className='text-sm font-semibold text-slate-800'>Mã OTP</span>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className='mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center font-display text-2xl font-semibold tracking-[0.45em] outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
            inputMode='numeric'
            autoComplete='one-time-code'
            placeholder='000000'
          />
          <FieldError>{errors.otp}</FieldError>
        </label>
        <button
          type='submit'
          disabled={loading}
          className='w-full cursor-pointer rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
        >
          {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  )
}
