'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'
import { AuthShell, FieldError, StatusMessage } from '@/components/auth/auth-shell'
import { getHomeForRole } from '@/lib/auth'
import { login } from '@/lib/auth-api'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Email không hợp lệ.'
    if (password.length < 8) nextErrors.password = 'Mật khẩu tối thiểu 8 ký tự.'
    setErrors(nextErrors)
    setStatus(null)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const user = await login({ email, matKhau: password })
      setStatus({ type: 'success', message: 'Đăng nhập thành công.' })
      const redirect = searchParams.get('redirect')
      router.replace(redirect || getHomeForRole(user.vai_tro))
      router.refresh()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Đăng nhập thất bại.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Chào mừng bạn trở lại'
      title='Tiếp tục hành trình chăm sóc sức khỏe của bạn.'
      description='Đăng nhập để xem gói tư vấn, lịch hẹn với chuyên gia và các gợi ý dành riêng cho bạn.'
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link className='font-semibold text-[#2563EB] hover:text-blue-700' href='/register'>
            Đăng ký
          </Link>
        </>
      }
    >
      <form className='space-y-5' onSubmit={onSubmit}>
        <div>
          <h2 className='text-2xl font-semibold text-slate-950'>Đăng nhập</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Nhập thông tin tài khoản để vào không gian tư vấn của bạn.
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
            placeholder='email của bạn'
          />
          <FieldError>{errors.email}</FieldError>
        </label>
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Mật khẩu</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className='mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100'
            type='password'
            autoComplete='current-password'
            placeholder='Tối thiểu 8 ký tự'
          />
          <FieldError>{errors.password}</FieldError>
        </label>
        <div className='flex justify-end'>
          <Link className='text-sm font-semibold text-[#2563EB] hover:text-blue-700' href='/forgot-password'>
            Quên mật khẩu?
          </Link>
        </div>
        <button
          type='submit'
          disabled={loading}
          className='w-full cursor-pointer rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
