'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/lib/auth-api'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await logout()
      router.replace('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type='button'
      onClick={handleLogout}
      disabled={loading}
      className='rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:border-[#2563EB] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60'
    >
      {loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
    </button>
  )
}
