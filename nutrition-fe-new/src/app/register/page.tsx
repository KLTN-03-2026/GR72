'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { AuthShell, FieldError, StatusMessage } from '@/components/auth/auth-shell'
import { getHomeForRole } from '@/lib/auth'
import { register } from '@/lib/auth-api'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'customer' | 'expert'>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (fullName.trim().length < 2) nextErrors.fullName = 'Vui lòng nhập họ tên.'
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Email không hợp lệ.'
    if (password.length < 8) nextErrors.password = 'Mật khẩu tối thiểu 8 ký tự.'
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Xác nhận mật khẩu không khớp.'
    if (role === 'expert' && specialty.trim().length < 2) nextErrors.specialty = 'Vui lòng nhập chuyên môn.'
    setErrors(nextErrors)
    setStatus(null)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const user = await register({
        vaiTro: role,
        hoTen: fullName,
        email,
        matKhau: password,
        xacNhanMatKhau: confirmPassword,
        chuyenMon: role === 'expert' ? specialty : undefined,
      })
      setStatus({ type: 'success', message: 'Đăng ký thành công.' })
      router.replace(getHomeForRole(user.vai_tro))
      router.refresh()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Đăng ký thất bại.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Tạo tài khoản'
      title='Tạo tài khoản để bắt đầu chăm sóc sức khỏe tốt hơn.'
      description='Người dùng có thể đặt gói tư vấn, chuyên gia có thể nhận lịch hẹn và đồng hành cùng khách hàng.'
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link className='font-semibold text-[#2563EB] hover:text-blue-700' href='/login'>
            Đăng nhập
          </Link>
        </>
      }
    >
      <form className='space-y-5' onSubmit={onSubmit}>
        <div>
          <h2 className='text-2xl font-semibold text-slate-950'>Đăng ký</h2>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Chọn loại tài khoản phù hợp với nhu cầu sử dụng của bạn.
          </p>
        </div>
        {status ? <StatusMessage {...status} /> : null}
        <div>
          <span className='text-sm font-semibold text-slate-800'>Vai trò</span>
          <div className='mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1'>
            {[
              ['customer', 'Người dùng'],
              ['expert', 'Chuyên gia tư vấn'],
            ].map(([value, label]) => (
              <button
                key={value}
                type='button'
                onClick={() => setRole(value as 'customer' | 'expert')}
                className={
                  role === value
                    ? 'cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#2563EB] shadow-sm transition-colors duration-200'
                    : 'cursor-pointer rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-slate-950'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Họ tên</span>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className='mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100' />
          <FieldError>{errors.fullName}</FieldError>
        </label>
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type='email' autoComplete='email' className='mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100' />
          <FieldError>{errors.email}</FieldError>
        </label>
        {role === 'expert' ? (
          <label className='block'>
            <span className='text-sm font-semibold text-slate-800'>Chuyên môn</span>
            <input value={specialty} onChange={(event) => setSpecialty(event.target.value)} className='mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100' />
            <FieldError>{errors.specialty}</FieldError>
          </label>
        ) : null}
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Mật khẩu</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type='password' autoComplete='new-password' className='mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100' />
          <FieldError>{errors.password}</FieldError>
        </label>
        <label className='block'>
          <span className='text-sm font-semibold text-slate-800'>Xác nhận mật khẩu</span>
          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type='password' autoComplete='new-password' className='mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100' />
          <FieldError>{errors.confirmPassword}</FieldError>
        </label>
        <button type='submit' disabled={loading} className='w-full cursor-pointer rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]'>
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
    </AuthShell>
  )
}

